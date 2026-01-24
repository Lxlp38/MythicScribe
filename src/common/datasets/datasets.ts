import * as vscode from 'vscode';
import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { atlasJsonRemoteUrl, GITHUB_API_COMMITS_URL } from '@common/constants';
import { filesToUpdateProvider } from '@common/stateDataProvider';
import { registryKey, specialAttributeEnumToRegistryKey } from '@common/objectInfos';

import { getLogger } from '../providers/loggerProvider';
import { MythicAttribute, ScribeMechanicHandler } from './ScribeMechanic';
import { ensureComponentsExist, fetchJsonFromURL } from '../utils/uriutils';
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
import { atlasDataNode } from './AtlasNode';
import { AtlasFileNodeHash, AtlasDirectoryNode, AtlasRootNodeImpl } from './types/AtlasNode';

const datasetsLoadedEventEmitter = new vscode.EventEmitter<void>();
export const onDatasetsLoaded = datasetsLoadedEventEmitter.event;

export async function loadDatasets(context: vscode.ExtensionContext) {
    filesToUpdateProvider.clear();
    getLogger().debug(
        'Loading datasets from',
        ConfigProvider.registry.generic.get('datasetSource') || 'undefined'
    );

    if (ConfigProvider.registry.generic.get('datasetSource') === 'GitHub') {
        await initializeExtensionDatasetsClonedStorage();
        const latestCommitHash = context.globalState.get<string>('latestCommitHash');
        const savedCommitHash = context.globalState.get<string>('savedCommitHash');
        if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
            getLogger().debug(
                'Commit hash mismatch, updating datasets',
                savedCommitHash?.toString() || 'undefined',
                '-->',
                latestCommitHash?.toString() || 'undefined'
            );

            const localFiles: Map<string, AtlasFileNodeHash> = new Map();
            atlasDataNode.getFiles().forEach((file) => {
                localFiles.set(file.path, file.getHash());
            });
            try {
                // Fetch the atlas.json from GitHub
                const atlasRemoteJson =
                    await fetchJsonFromURL<AtlasDirectoryNode>(atlasJsonRemoteUrl);
                if (!atlasRemoteJson) {
                    throw new Error('Failed to fetch atlas.json from remote URL');
                }
                const atlasRemoteNode = new AtlasRootNodeImpl(
                    atlasRemoteJson as unknown as AtlasDirectoryNode
                );

                // Compare with local atlas.json
                const remoteFiles: Map<string, AtlasFileNodeHash> = new Map();
                atlasRemoteNode.getFiles().forEach((file) => {
                    getLogger().trace(
                        'Found remote file: ' + file.path + ' with hash: ' + file.getHash()
                    );
                    remoteFiles.set(file.path, file.getHash());
                });

                const filesToUpdate: Set<string> = new Set();

                // Determine which files need to be updated
                localFiles.forEach((hash, path) => {
                    const remoteHash = remoteFiles.get(path);
                    getLogger().trace(
                        `Comparing file: ${path}, local hash: ${hash}, remote hash: ${remoteHash}`
                    );
                    if (remoteHash && remoteHash !== hash) {
                        filesToUpdate.add(path);
                    }
                });

                // // Detect new files in remote that don't exist locally
                // remoteFiles.forEach((hash, path) => {
                //     if (!localFiles.has(path)) {
                //         filesToUpdate.add(path);
                //     }
                // });

                // Notify about files to update
                filesToUpdate.forEach((filePath) => {
                    getLogger().trace('File needs to update:', filePath);
                    filesToUpdateProvider.run(filePath, 'shouldUpdate');
                });
                filesToUpdateProvider.setDefault('isFineAsIs');
            } catch (error) {
                getLogger().error(error, `Error fetching atlas.json`);
                // If there's an error, assume all files need to be updated
                filesToUpdateProvider.setDefault('shouldUpdate');
            }
            context.globalState.update('savedCommitHash', latestCommitHash);
        } else {
            filesToUpdateProvider.setDefault('isFineAsIs');
            getLogger().debug('Commit hash matches, no need to update datasets');
        }
        fetchNextHash(latestCommitHash || '', context);
    } else {
        filesToUpdateProvider.setDefault('isFineAsIs');
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
            getLogger().error(result.reason, 'Error while loading datasets');
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
            if (
                typeof data === 'object' &&
                data !== null &&
                'message' in data &&
                typeof data.message === 'string'
            ) {
                if (data.message.includes('rate limit exceeded')) {
                    throw new Error(
                        'GitHub API rate limit exceeded. Are you using a VPN or proxy?'
                    );
                }
                throw new Error(
                    'Error fetching latest commit hash. The request returned the following message: ' +
                        data.message
                );
            }
            throw new Error('Unexpected data format: ' + JSON.stringify(data));
        }
    } catch (error) {
        getLogger().error(error, 'Error fetching latest commit hash');
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
