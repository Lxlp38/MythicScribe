import path from 'path';

import * as vscode from 'vscode';

import { MechanicDataset, ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler, StaticScribeEnum, WebScribeEnum } from './ScribeEnum';
import { fetchMechanicDatasetFromLink, loadDatasets, loadLocalMechanicDataset } from './datasets';
import { logDebug, logError, logInfo } from '../utils/logger';
import { changeCustomDatasetsSource } from '../migration/migration';

enum CustomDatasetElementType {
    BUNDLE = 'Bundle',
    MECHANIC = 'Mechanic',
    CONDITION = 'Condition',
    TRIGGER = 'Trigger',
    TARGETER = 'Targeter',
    ENUM = 'Enum',
}

enum CustomDatasetSource {
    FILE = 'File',
    LINK = 'Link',
}

interface CustomDataset {
    elementType: CustomDatasetElementType;
    source: CustomDatasetSource;
    pathOrUrl: string;
}

const validConfigurationTargets = [
    { label: 'Global', target: vscode.ConfigurationTarget.Global },
    { label: 'Workspace', target: vscode.ConfigurationTarget.Workspace },
];

export async function addCustomDataset() {
    logDebug('addCustomDataset');
    const scope = await vscode.window
        .showQuickPick(validConfigurationTargets, {
            placeHolder: 'Select the scope for which you want to add the custom dataset',
        })
        .then((selection) => selection?.target);

    if (!scope) {
        return;
    }
    logDebug('addCustomDataset scope:', scope.toString());

    const elementType = await vscode.window.showQuickPick(Object.values(CustomDatasetElementType), {
        placeHolder: 'Select an element type',
    });

    if (!elementType) {
        return;
    }
    logDebug('addCustomDataset elementType:', elementType);

    const source = await vscode.window.showQuickPick(Object.values(CustomDatasetSource), {
        placeHolder: 'Select a source',
    });

    if (!source) {
        return;
    }
    logDebug('addCustomDataset source:', source);

    if (source === CustomDatasetSource.LINK) {
        return addCustomDatasetFromLink(elementType, scope);
    }

    const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select a file',
        filters: {
            'JSON Files': ['json'],
        },
    });

    if (!fileUri || fileUri.length === 0) {
        logInfo('No file selected.');
        return;
    }

    logDebug('addCustomDataset fileUri:', fileUri.join(', '));

    //const mechanicDatasets : MechanicDataset[] = [];
    const validPaths: vscode.Uri[] = [];

    for (const uri of fileUri) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const data = Buffer.from(fileContent).toString('utf8');

            if (elementType === CustomDatasetElementType.ENUM) {
                const enumDataset = JSON.parse(data);
                if (!enumDataset) {
                    logError(`Error parsing file content.`);
                    continue;
                }
            } else {
                const mechanicdataset = JSON.parse(data) as MechanicDataset;
                if (!mechanicdataset) {
                    logError(`Error parsing file content.`);
                    continue;
                }
            }
            logInfo(`File content loaded successfully.`);
            validPaths.push(uri);
        } catch (err) {
            logError(`Error reading file: ${err}`);
        }
    }

    for (const uri of validPaths) {
        await finalizeCustomDatasetAddition(
            elementType as CustomDatasetElementType,
            source as CustomDatasetSource,
            uri.toString(),
            scope
        );
    }
}

export async function removeCustomDataset() {
    logDebug('removeCustomDataset');
    const scope = await vscode.window.showQuickPick(validConfigurationTargets, {
        placeHolder: 'Select the scope from which you want to remove the custom dataset',
    });

    if (!scope) {
        return;
    }

    logDebug('removeCustomDataset scope:', scope.target.toString());

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

    logDebug(
        'removeCustomDataset datasets:',
        datasets.map((dataset) => dataset.pathOrUrl).join(', ')
    );

    datasets.forEach(async (dataset) => {
        const index = existingMappings.indexOf(dataset);
        existingMappings.splice(index, 1);

        await config.update('customDatasets', existingMappings, scope?.target);

        logInfo(`Mapping removed: ${dataset.elementType} -> ${dataset.pathOrUrl}`);
    });

    // Reload the datasets
    loadDatasets();
}

export async function createBundleDataset() {
    logDebug('createBundleDataset');
    const scope = await vscode.window.showQuickPick(validConfigurationTargets, {
        placeHolder: 'Select the scope for which you want to create the bundle',
    });

    if (!scope) {
        return;
    }

    logDebug('createBundleDataset scope:', scope.target.toString());

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

    logDebug('createBundleDataset bundlePath:', bundlePath.fsPath);

    const bundleData = datasets.map((dataset) => {
        if (dataset.mapping.source === CustomDatasetSource.FILE) {
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

    logDebug(
        'createBundleDataset shoudReplaceSelectedCustomDatasetsWithBundle:',
        shoudReplaceSelectedCustomDatasetsWithBundle.value.toString()
    );

    try {
        await vscode.workspace.fs.writeFile(
            bundlePath,
            Buffer.from(JSON.stringify(bundleData, null, 2), 'utf8')
        );
        logInfo(`Bundle created at: ${bundlePath.fsPath}`);
    } catch (err) {
        logError(`Error creating bundle: ${err}`);
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
            elementType: CustomDatasetElementType.BUNDLE,
            source: CustomDatasetSource.FILE,
            pathOrUrl: bundlePath.toString(),
        });
        await config.update('customDatasets', existingMappings, scope?.target);
        logInfo('Selected custom datasets replaced with the new bundle');
        loadDatasets();
    }
}

async function addCustomDatasetFromLink(elementtype: string, scope: vscode.ConfigurationTarget) {
    const pathOrUrl = await vscode.window.showInputBox({
        placeHolder: 'Enter a path or URL',
        prompt: 'Enter a path or URL',
    });

    if (!pathOrUrl) {
        logInfo('No path or URL provided.');
        return;
    }

    try {
        // Parse the input as a URI
        const uri = vscode.Uri.parse(pathOrUrl);

        // Pass the URI as a string to the finalize function
        await finalizeCustomDatasetAddition(
            elementtype as CustomDatasetElementType,
            CustomDatasetSource.LINK,
            uri.toString(),
            scope
        );

        logInfo(`Successfully added dataset from: ${uri.toString()}`);
    } catch (err) {
        logError(err);
        logError(`Invalid URL or path: ${pathOrUrl}`);
    }
}

async function finalizeCustomDatasetAddition(
    elementType: CustomDatasetElementType,
    source: CustomDatasetSource,
    pathOrUrl: string,
    scope: vscode.ConfigurationTarget
) {
    const [config, existingMappings] = getCustomDatasetConfiguration();
    existingMappings.push({ elementType, source, pathOrUrl });
    await config.update('customDatasets', existingMappings, scope);

    logInfo(`Mapping added: ${elementType} -> ${pathOrUrl}`);

    // Reload the datasets
    loadDatasets();
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

export async function loadCustomDatasets() {
    logDebug('loading custom datasets');
    const customDatasets = getCustomDatasetConfiguration()[1];
    for (const entry of customDatasets) {
        if (isOutdatedDataset(entry)) {
            logDebug('Outdated dataset to migrate found:', entry.pathOrUrl);
            await changeCustomDatasetsSource('customDatasets', 'Local File', 'File');
            break;
        }
    }
    for (const entry of customDatasets) {
        await processCustomDatasetEntry(entry);
    }
}

async function processCustomDatasetEntry(entry: CustomDataset) {
    logDebug('Processing custom dataset entry:', entry.pathOrUrl);
    if (entry.elementType === CustomDatasetElementType.BUNDLE) {
        await loadBundleDataset(entry);
    } else if (entry.elementType === CustomDatasetElementType.ENUM) {
        const fileName = entry.pathOrUrl.split('/').reverse()[0].replace('.json', '').toLowerCase();
        const ifFileSource = isFileSource(entry.source);
        const clazz = ifFileSource ? StaticScribeEnum : WebScribeEnum;
        const path = ifFileSource
            ? decodeURIComponent(vscode.Uri.parse(entry.pathOrUrl).path)
            : entry.pathOrUrl;
        ScribeEnumHandler.addEnum(clazz, fileName, path);
    } else if (isFileSource(entry.source)) {
        const localDataset = await loadLocalMechanicDataset(entry.pathOrUrl);
        processMechanicDatasetEntry(localDataset, entry.elementType);
    } else if (isLinkSource(entry.source)) {
        const fileData = await fetchMechanicDatasetFromLink(entry.pathOrUrl);
        processMechanicDatasetEntry(fileData, entry.elementType);
    }
}

const CustomDatasetElementTypeAssociationMap = {
    [CustomDatasetElementType.MECHANIC]: () => ScribeMechanicHandler.registry.mechanic,
    [CustomDatasetElementType.TARGETER]: () => ScribeMechanicHandler.registry.targeter,
    [CustomDatasetElementType.CONDITION]: () => ScribeMechanicHandler.registry.condition,
    [CustomDatasetElementType.TRIGGER]: () => ScribeMechanicHandler.registry.trigger,
};
async function processMechanicDatasetEntry(
    entry: MechanicDataset,
    type: keyof typeof CustomDatasetElementTypeAssociationMap
) {
    if (entry && type in CustomDatasetElementTypeAssociationMap) {
        CustomDatasetElementTypeAssociationMap[type]().addMechanic(...entry);
    }
}

async function loadBundleDataset(dataset: CustomDataset) {
    logDebug('Loading bundle dataset:', dataset.pathOrUrl);
    try {
        const configData: CustomDataset[] = [];
        const fileUri = vscode.Uri.parse(dataset.pathOrUrl);

        if (isFileSource(dataset.source)) {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            configData.push(
                ...((JSON.parse(Buffer.from(fileContent).toString('utf8')) as CustomDataset[]) ||
                    [])
            );
            logDebug('Bundle dataset loaded as file:', dataset.pathOrUrl);
        } else if (isLinkSource(dataset.source)) {
            const response = await fetch(dataset.pathOrUrl);
            const jsonData = (await response.json()) as CustomDataset[];
            configData.push(...jsonData);
            logDebug('Bundle dataset loaded as link:', dataset.pathOrUrl);
        }

        for (const entry of configData) {
            if (isRelativePath(entry.pathOrUrl)) {
                const datasetDirUri = isFileSource(entry.source)
                    ? vscode.Uri.file(path.dirname(fileUri.fsPath))
                    : vscode.Uri.parse(path.dirname(fileUri.toString()));
                const entryUri = vscode.Uri.joinPath(datasetDirUri, entry.pathOrUrl);
                entry.pathOrUrl = entryUri.toString();
                entry.source = dataset.source;
                logDebug('Resolved relative path:', entry.pathOrUrl);
            }
            await processCustomDatasetEntry(entry);
        }
    } catch (error) {
        logError(error);
    }
}

function isFileSource(source: CustomDatasetSource) {
    return source === CustomDatasetSource.FILE;
}
function isLinkSource(source: CustomDatasetSource) {
    return source === CustomDatasetSource.LINK;
}

function isRelativePath(path: string) {
    return path.startsWith('.');
}

function isOutdatedDataset(dataset: CustomDataset) {
    return dataset.source.toString() === 'Local File';
}
