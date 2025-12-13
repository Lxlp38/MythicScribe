import path from 'path';

import * as vscode from 'vscode';
import { fetchJsonFromURL, fetchJsonFromLocalFile } from '@common/utils/uriutils';

import {
    AbstractScribeMechanicRegistry,
    Mechanic,
    MechanicDataset,
    ScribeMechanicHandler,
} from './ScribeMechanic';
import { getScribeEnumHandler, StaticScribeEnum, WebScribeEnum } from './ScribeEnum';
import { loadDatasets } from './datasets';
import { getLogger } from '../providers/loggerProvider';
import { changeCustomDatasetsSource } from '../migration/migration';
import { CustomDatasetElementType, CustomDatasetSource } from '../packageData';
import { timeCounter } from '../utils/timeUtils';

interface CustomDataset {
    elementType: CustomDatasetElementType;
    source?: CustomDatasetSource;
    pathOrUrl: string;
}

const validConfigurationTargets = [
    { label: 'Global', target: vscode.ConfigurationTarget.Global },
    { label: 'Workspace', target: vscode.ConfigurationTarget.Workspace },
];

export async function addCustomDataset(ctx: vscode.ExtensionContext) {
    getLogger().debug('addCustomDataset');
    const scope = await vscode.window
        .showQuickPick(validConfigurationTargets, {
            placeHolder: 'Select the scope for which you want to add the custom dataset',
        })
        .then((selection) => selection?.target);

    if (!scope) {
        return;
    }
    getLogger().debug('addCustomDataset scope:', scope.toString());

    const elementType = (await vscode.window.showQuickPick(CustomDatasetElementType, {
        placeHolder: 'Select an element type',
    })) as CustomDatasetElementType | undefined;

    if (!elementType) {
        return;
    }
    getLogger().debug('addCustomDataset elementType:', elementType);

    const source = (await vscode.window.showQuickPick(CustomDatasetSource, {
        placeHolder: 'Select a source',
    })) as CustomDatasetSource | undefined;

    if (!source) {
        return;
    }
    getLogger().debug('addCustomDataset source:', source);

    if (source === 'Link') {
        return addCustomDatasetFromLink(elementType, scope, ctx);
    }

    const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select a file',
        filters: {
            'JSON Files': ['json'],
        },
    });

    if (!fileUri || fileUri.length === 0) {
        getLogger().info('No file selected.');
        return;
    }

    getLogger().debug('addCustomDataset fileUri:', fileUri.join(', '));

    //const mechanicDatasets : MechanicDataset[] = [];
    const validPaths: vscode.Uri[] = [];

    for (const uri of fileUri) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const data = Buffer.from(fileContent).toString('utf8');

            if (elementType === 'Enum') {
                const enumDataset = JSON.parse(data);
                if (!enumDataset) {
                    getLogger().error(`Error parsing file content.`);
                    continue;
                }
            } else {
                const mechanicdataset = JSON.parse(data) as MechanicDataset;
                if (!mechanicdataset) {
                    getLogger().error(`Error parsing file content.`);
                    continue;
                }
            }
            getLogger().info(`File content loaded successfully.`);
            validPaths.push(uri);
        } catch (err) {
            getLogger().error(`Error reading file: ${err}`);
        }
    }

    for (const uri of validPaths) {
        await finalizeCustomDatasetAddition(
            elementType as CustomDatasetElementType,
            source as CustomDatasetSource,
            uri.toString(),
            scope,
            ctx
        );
    }
}

export async function removeCustomDataset(ctx: vscode.ExtensionContext) {
    getLogger().debug('removeCustomDataset');
    const scope = await vscode.window.showQuickPick(validConfigurationTargets, {
        placeHolder: 'Select the scope from which you want to remove the custom dataset',
    });

    if (!scope) {
        return;
    }

    getLogger().debug('removeCustomDataset scope:', scope.target.toString());

    const [config, existingMappings] = getCustomDatasetConfiguration(scope?.target);

    const datasets = await vscode.window
        .showQuickPick(
            existingMappings.map((mapping) => ({
                label: `${mapping.elementType} ${vscode.Uri.parse(mapping.pathOrUrl).path.split('/').reverse()[0]} -> ${vscode.Uri.parse(mapping.pathOrUrl).path}`,
                description: `Source: ${mapping.source}`,
                mapping,
            })),
            {
                placeHolder: 'Select a dataset to remove',
                canPickMany: true,
            }
        )
        .then((selection) => selection?.map((item) => item.mapping));

    if (!datasets) {
        return;
    }

    getLogger().debug(
        'removeCustomDataset datasets:',
        datasets.map((dataset) => dataset.pathOrUrl).join(', ')
    );

    datasets.forEach(async (dataset) => {
        const index = existingMappings.indexOf(dataset);
        existingMappings.splice(index, 1);

        await config.update('customDatasets', existingMappings, scope?.target);

        getLogger().info(`Mapping removed: ${dataset.elementType} -> ${dataset.pathOrUrl}`);
    });

    // Reload the datasets
    loadDatasets(ctx);
}

export async function createBundleDataset(ctx: vscode.ExtensionContext) {
    getLogger().debug('createBundleDataset');
    const scope = await vscode.window.showQuickPick(validConfigurationTargets, {
        placeHolder: 'Select the scope for which you want to create the bundle',
    });

    if (!scope) {
        return;
    }

    getLogger().debug('createBundleDataset scope:', scope.target.toString());

    const [config, existingMappings] = getCustomDatasetConfiguration(scope?.target);

    const datasets = await vscode.window.showQuickPick(
        existingMappings.map((mapping) => ({
            label: `${mapping.elementType} ${vscode.Uri.parse(mapping.pathOrUrl).path.split('/').reverse()[0]} -> ${vscode.Uri.parse(mapping.pathOrUrl).path}`,
            description: `Source: ${mapping.source}`,
            mapping,
        })),
        {
            placeHolder: 'Select datasets to bundle',
            canPickMany: true,
        }
    );

    if (!datasets) {
        return;
    }

    const bundlePath = await vscode.window.showSaveDialog({
        filters: {
            'JSON Files': ['json'],
        },
    });

    if (!bundlePath) {
        return;
    }

    getLogger().debug('createBundleDataset bundlePath:', bundlePath.fsPath);

    const bundleData = datasets.map((dataset) => {
        if (dataset.mapping.source === 'File') {
            const bundleDir = path.dirname(bundlePath.fsPath);
            const relativePath = path.relative(
                bundleDir,
                vscode.Uri.parse(dataset.mapping.pathOrUrl).fsPath
            );
            return { ...dataset.mapping, pathOrUrl: relativePath };
        }
        return dataset.mapping;
    });

    const shoudReplaceSelectedCustomDatasetsWithBundle = await vscode.window.showQuickPick(
        [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
        ],
        {
            placeHolder: 'Replace selected custom datasets with the new bundle?',
        }
    );

    if (shoudReplaceSelectedCustomDatasetsWithBundle === undefined) {
        return;
    }

    getLogger().debug(
        'createBundleDataset shoudReplaceSelectedCustomDatasetsWithBundle:',
        shoudReplaceSelectedCustomDatasetsWithBundle.value.toString()
    );

    try {
        await vscode.workspace.fs.writeFile(
            bundlePath,
            Buffer.from(JSON.stringify(bundleData, null, 2), 'utf8')
        );
        getLogger().info(`Bundle created at: ${bundlePath.fsPath}`);
    } catch (err) {
        getLogger().error(`Error creating bundle: ${err}`);
        return;
    }

    if (shoudReplaceSelectedCustomDatasetsWithBundle.value) {
        for (const dataset of datasets) {
            const index = existingMappings.indexOf(dataset.mapping);
            if (index !== -1) {
                existingMappings.splice(index, 1);
            }
        }
        existingMappings.push({
            elementType: 'Bundle',
            source: 'File',
            pathOrUrl: bundlePath.toString(),
        });
        await config.update('customDatasets', existingMappings, scope?.target);
        getLogger().info('Selected custom datasets replaced with the new bundle');
        loadDatasets(ctx);
    }
}

async function addCustomDatasetFromLink(
    elementtype: string,
    scope: vscode.ConfigurationTarget,
    ctx: vscode.ExtensionContext
) {
    const pathOrUrl = await vscode.window.showInputBox({
        placeHolder: 'Enter a path or URL',
        prompt: 'Enter a path or URL',
    });

    if (!pathOrUrl) {
        getLogger().info('No path or URL provided.');
        return;
    }

    try {
        // Parse the input as a URI
        const uri = vscode.Uri.parse(pathOrUrl);

        // Pass the URI as a string to the finalize function
        await finalizeCustomDatasetAddition(
            elementtype as CustomDatasetElementType,
            'Link',
            uri.toString(),
            scope,
            ctx
        );

        getLogger().info(`Successfully added dataset from: ${uri.toString()}`);
    } catch (err) {
        getLogger().error(err);
        getLogger().error(`Invalid URL or path: ${pathOrUrl}`);
    }
}

async function finalizeCustomDatasetAddition(
    elementType: CustomDatasetElementType,
    source: CustomDatasetSource,
    pathOrUrl: string,
    scope: vscode.ConfigurationTarget,
    ctx: vscode.ExtensionContext
) {
    const [config, existingMappings] = getCustomDatasetConfiguration();
    existingMappings.push({ elementType, source, pathOrUrl });
    await config.update('customDatasets', existingMappings, scope);

    getLogger().info(`Mapping added: ${elementType} -> ${pathOrUrl}`);

    // Reload the datasets
    loadDatasets(ctx);
}

function getCustomDatasetConfiguration(
    scope?: vscode.ConfigurationTarget
): [vscode.WorkspaceConfiguration, CustomDataset[]] {
    const config = vscode.workspace.getConfiguration('MythicScribe');

    if (scope) {
        const inspect = config.inspect<CustomDataset[]>('customDatasets');
        switch (scope) {
            case vscode.ConfigurationTarget.Global:
                return [config, inspect?.globalValue || []];
            case vscode.ConfigurationTarget.Workspace:
                return [config, inspect?.workspaceValue || []];
        }
    }

    const existingMappings = config.get<CustomDataset[]>('customDatasets') || [];

    return [config, existingMappings];
}

const customMechanicCache: {
    data: Mechanic[];
    type: keyof associableCustomDatasetElementType;
}[] = [];
export async function loadCustomDatasets() {
    getLogger().debug('Loading Custom Datasets');
    const time = timeCounter();
    const customDatasets = getCustomDatasetConfiguration()[1];
    for (const entry of customDatasets) {
        if (isOutdatedDataset(entry)) {
            getLogger().debug('Outdated dataset to migrate found:', entry.pathOrUrl);
            await changeCustomDatasetsSource('customDatasets', 'Local File', 'File');
            break;
        }
    }
    let promises = customDatasets.map((entry) => processCustomDatasetEntry(entry));
    await Promise.allSettled(promises);

    promises = customMechanicCache.map((entry) =>
        processMechanicDatasetEntry(entry.data, entry.type)
    );
    await Promise.allSettled(promises);
    getLogger().debug('Loaded Custom Datasets in', time.stop());
    return;
}

async function processCustomDatasetEntry(entry: CustomDataset, stack?: string[]) {
    getLogger().debug('Processing custom dataset entry:', entry.pathOrUrl);
    if (entry.elementType === 'Bundle') {
        await loadBundleDataset(entry, stack);
    } else if (entry.elementType === 'Enum') {
        const fileName = entry.pathOrUrl.split('/').reverse()[0].replace('.json', '').toLowerCase();
        const ifFileSource = isFileSource(entry.source);
        const clazz = ifFileSource ? StaticScribeEnum : WebScribeEnum;
        const path = ifFileSource ? vscode.Uri.parse(entry.pathOrUrl).path : entry.pathOrUrl;
        getScribeEnumHandler().addEnum(clazz, fileName, path);
    } else if (isFileSource(entry.source)) {
        const localDataset = await fetchJsonFromLocalFile<Mechanic>(
            vscode.Uri.parse(entry.pathOrUrl)
        );
        customMechanicCache.push({ data: localDataset || [], type: entry.elementType });
    } else if (isLinkSource(entry.source)) {
        const fileData = await fetchJsonFromURL<Mechanic>(entry.pathOrUrl);
        customMechanicCache.push({ data: fileData || [], type: entry.elementType });
    }
}

type associableCustomDatasetElementType = Record<
    Exclude<CustomDatasetElementType, 'Bundle' | 'Enum'>,
    () => AbstractScribeMechanicRegistry
>;
const CustomDatasetElementTypeAssociationMap: associableCustomDatasetElementType = {
    Mechanic: () => ScribeMechanicHandler.registry.mechanic,
    Targeter: () => ScribeMechanicHandler.registry.targeter,
    Condition: () => ScribeMechanicHandler.registry.condition,
    Trigger: () => ScribeMechanicHandler.registry.trigger,
    AIGoal: () => ScribeMechanicHandler.registry.aigoal,
    AITarget: () => ScribeMechanicHandler.registry.aitarget,
};
async function processMechanicDatasetEntry(
    entry: MechanicDataset,
    type: keyof associableCustomDatasetElementType
) {
    if (entry) {
        CustomDatasetElementTypeAssociationMap[type]().addMechanic(...entry);
    }
}

async function loadBundleDataset(dataset: CustomDataset, stack: string[] = ['MythicScribe']) {
    getLogger().debug('Loading bundle dataset:', dataset.pathOrUrl);

    if (stack.includes(dataset.pathOrUrl)) {
        stack.push(dataset.pathOrUrl);
        getLogger().trace('Circular reference detected in Bundle:\n', stack.join(' -> '));
        getLogger().error(
            stack.map((value) => path.basename(value)).join(' -> '),
            'Circular reference detected in Bundle:\n'
        );
        return;
    }
    stack.push(dataset.pathOrUrl);

    try {
        const configData: CustomDataset[] = [];
        const fileUri = vscode.Uri.parse(dataset.pathOrUrl);

        if (isFileSource(dataset.source)) {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            configData.push(
                ...((JSON.parse(Buffer.from(fileContent).toString('utf8')) as CustomDataset[]) ||
                    [])
            );
            getLogger().debug('Bundle dataset loaded as file:', dataset.pathOrUrl);
        } else if (isLinkSource(dataset.source)) {
            const response = await fetch(dataset.pathOrUrl);
            const jsonData = (await response.json()) as CustomDataset[];
            configData.push(...jsonData);
            getLogger().debug('Bundle dataset loaded as link:', dataset.pathOrUrl);
        }

        for (const entry of configData) {
            if (isRelativePath(entry.pathOrUrl)) {
                const datasetDirUri = isFileSource(entry.source)
                    ? vscode.Uri.file(path.dirname(fileUri.fsPath))
                    : vscode.Uri.parse(path.dirname(fileUri.toString()));
                const entryUri = vscode.Uri.joinPath(datasetDirUri, entry.pathOrUrl);
                entry.pathOrUrl = entryUri.toString();
                entry.source = dataset.source;
                getLogger().debug('Resolved relative path:', entry.pathOrUrl);
            }
            await processCustomDatasetEntry(entry, stack);
        }
    } catch (error) {
        getLogger().error(error);
    }
}

function isFileSource(source?: CustomDatasetSource) {
    return source === 'File';
}
function isLinkSource(source?: CustomDatasetSource) {
    return source === 'Link';
}

function isRelativePath(path: string) {
    return path.startsWith('.');
}

function isOutdatedDataset(dataset: CustomDataset) {
    return (dataset.source?.toString() || '') === 'Local File';
}
