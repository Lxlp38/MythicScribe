import * as vscode from 'vscode';
import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { GITHUB_API_COMMITS_URL } from '@common/constants';
import { stateControlBooleanProvider } from '@common/stateDataProvider';
import { registryKey, specialAttributeEnumToRegistryKey } from '@common/objectInfos';

import { getLogger } from '../providers/loggerProvider';
import { MythicAttribute, ScribeMechanicHandler } from './ScribeMechanic';
import { ensureComponentsExist } from '../utils/uriutils';
import { ConfigProvider, finallySetEnabledPlugins } from '../providers/configProvider';
import {
    addCustomDataset,
    createBundleDataset,
    loadCustomDatasets,
    removeCustomDataset,
} from './customDatasets';
import { MythicNodeHandler } from '../mythicnodes/MythicNode';
import { edcsUri } from './edcsUri';
import { addScriptedEnums } from './ScriptedEnums';

const datasetsLoadedEventEmitter = new vscode.EventEmitter<void>();
export const onDatasetsLoaded = datasetsLoadedEventEmitter.event;

export async function loadDatasets(context: vscode.ExtensionContext) {
    stateControlBooleanProvider.clear('doUpdateGithubDataset');
    getLogger().debug(
        'Loading datasets from',
        ConfigProvider.registry.generic.get('datasetSource') || 'undefined'
    );

    if (ConfigProvider.registry.generic.get('datasetSource') === 'GitHub') {
        await initializeExtensionDatasetsClonedStorage();
        const latestCommitHash = context!.globalState.get<string>('latestCommitHash');
        const savedCommitHash = context!.globalState.get<string>('savedCommitHash');
        if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
            getLogger().debug(
                'Commit hash mismatch, updating datasets',
                savedCommitHash?.toString() || 'undefined',
                '-->',
                latestCommitHash?.toString() || 'undefined'
            );
            stateControlBooleanProvider.run('doUpdateGithubDataset', true);
            context.globalState.update('savedCommitHash', latestCommitHash);
        } else {
            stateControlBooleanProvider.run('doUpdateGithubDataset', false);
            getLogger().debug('Commit hash matches, no need to update datasets');
        }
        fetchNextHash(latestCommitHash || '', context);
    }

    // Load Enums
    const enumHandler = getScribeEnumHandler();
    enumHandler.loadEnumDatasets();
    addScriptedEnums(enumHandler, ScribeMechanicHandler);

    // Load Mechanic Datasets
    const results = await Promise.allSettled([
        ScribeMechanicHandler.loadMechanicDatasets(context),
        loadCustomDatasets(),
    ]);
    results.forEach((result) => {
        if (result.status === 'rejected') {
            getLogger().error('Error while loading datasets:', result.reason);
        }
    });
    // Finalize Mechanic Datasets
    ScribeMechanicHandler.finalize();

    // Update Node Registry
    updateNodeRegistry();

    // Updates the plugins list based on newly found ones in datasets
    finallySetEnabledPlugins();
    if (ConfigProvider.registry.fileParsingPolicy.get('parseOnStartup')) {
        MythicNodeHandler.scanAllDocuments();
    }
    datasetsLoadedEventEmitter.fire();
}

function updateNodeRegistry() {
    Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
        registry.getMechanics().forEach((mechanic) => {
            mechanic.getAttributes().forEach((attr) => updateNodeRegistryAttribute(attr, mechanic));
        })
    );
    getLogger().debug('Updated Node Registry with Enum References');
}

function updateNodeRegistryAttribute(attr: MythicAttribute, mechanic = attr.mechanic) {
    let enumIdentifier = attr.enum?.identifier;
    if (!enumIdentifier) {
        return;
    }
    if (enumIdentifier in specialAttributeEnumToRegistryKey) {
        enumIdentifier = specialAttributeEnumToRegistryKey[enumIdentifier] as registryKey;
    }
    if (!(registryKey as readonly string[]).includes(enumIdentifier)) {
        return;
    }

    const key = enumIdentifier as registryKey;

    for (const n of mechanic.name) {
        const entry = n.toLowerCase();
        if (!MythicNodeHandler.registry[key].referenceMap.has(entry)) {
            MythicNodeHandler.registry[key].referenceMap.set(entry, new Set());
        }
        for (const name of attr.name) {
            MythicNodeHandler.registry[key].referenceMap.get(entry)!.add(name.toLowerCase());
        }
    }

    const correctedNames = attr.name.map((n) =>
        n.toLowerCase().replaceAll('(', '\\(').replaceAll(')', '\\)').replaceAll('$', '\\$')
    );
    for (const n of correctedNames) {
        MythicNodeHandler.registry[key].referenceAttributes.add(n);
    }
}

async function fetchNextHash(latestCommitHash: string, ctx: vscode.ExtensionContext) {
    const nextCommitHash = await fetchLatestCommitHash();
    if (nextCommitHash && nextCommitHash !== latestCommitHash) {
        getLogger().debug('Next commit hash:', nextCommitHash);
        ctx.globalState.update('latestCommitHash', nextCommitHash);
        getLogger().options(
            'New dataset update has been found. It will be applied the next time the datasets are loaded',
            {
                'Reload Datasets Now': {
                    type: 'command',
                    target: 'mythicscribe.loadDatasets',
                },
            }
        );
    }
}

async function initializeExtensionDatasetsClonedStorage() {
    getLogger().debug('Initializing extension datasets cloned storage');
    await ensureComponentsExist(edcsUri);
}

export async function clearExtensionDatasetsClonedStorage() {
    getLogger().debug('Clearing extension datasets cloned storage');
    const exists = await vscode.workspace.fs.stat(edcsUri).then(
        () => true,
        () => false
    );
    if (exists) {
        await vscode.workspace.fs.delete(edcsUri, { recursive: true });
    }
    await initializeExtensionDatasetsClonedStorage();
}

// Function to fetch the latest commit hash from GitHub
async function fetchLatestCommitHash(): Promise<string | null> {
    getLogger().debug('Fetching latest commit hash from GitHub');
    try {
        const response = await fetch(GITHUB_API_COMMITS_URL);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
            getLogger().debug('Latest commit hash fetched: ' + data[0].sha);
            return data[0].sha;
        } else {
            throw new Error('Unexpected data format');
        }
    } catch (error) {
        getLogger().error(error);
        return null;
    }
}

export namespace CustomDatasetsHandling {
    export async function handleRemoveCustomDataset(ctx: vscode.ExtensionContext) {
        await removeCustomDataset();
        await loadDatasets(ctx);
    }

    export async function handleCreateBundleDataset(ctx: vscode.ExtensionContext) {
        await createBundleDataset();
        await loadDatasets(ctx);
    }

    export async function handleAddCustomDataset(ctx: vscode.ExtensionContext) {
        await addCustomDataset();
        await loadDatasets(ctx);
    }
}
