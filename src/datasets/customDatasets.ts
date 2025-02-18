import path from 'path';

import * as vscode from 'vscode';

import { MechanicDataset, ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler, StaticScribeEnum, WebScribeEnum } from './ScribeEnum';
import { fetchMechanicDatasetFromLink, loadDatasets, loadLocalMechanicDataset } from './datasets';
import { logError, logInfo } from '../utils/logger';
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

export async function addCustomDataset() {
    const scope = await vscode.window
        .showQuickPick(
            [
                { label: 'Global', target: vscode.ConfigurationTarget.Global },
                {
                    label: 'Workspace',
                    target: vscode.ConfigurationTarget.Workspace,
                },
            ],
            {
                placeHolder: 'Select the scope for which you want to add the custom dataset',
            }
        )
        .then((selection) => selection?.target);

    if (!scope) {
        return;
    }

    const elementType = await vscode.window.showQuickPick(Object.values(CustomDatasetElementType), {
        placeHolder: 'Select an element type',
    });

    if (!elementType) {
        return;
    }

    const source = await vscode.window.showQuickPick(Object.values(CustomDatasetSource), {
        placeHolder: 'Select a source',
    });

    if (!source) {
        return;
    }

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
        vscode.window.showInformationMessage('No file selected.');
        return;
    }

    //const mechanicDatasets : MechanicDataset[] = [];
    const validPaths: vscode.Uri[] = [];

    for (const uri of fileUri) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const data = Buffer.from(fileContent).toString('utf8');

            if (elementType === CustomDatasetElementType.ENUM) {
                const enumDataset = JSON.parse(data);
                if (!enumDataset) {
                    vscode.window.showErrorMessage(`Error parsing file content.`);
                    continue;
                }
            } else {
                const mechanicdataset = JSON.parse(data) as MechanicDataset;
                if (!mechanicdataset) {
                    vscode.window.showErrorMessage(`Error parsing file content.`);
                    continue;
                }
            }
            vscode.window.showInformationMessage(`File content loaded successfully.`);
            validPaths.push(uri);
        } catch (err) {
            vscode.window.showErrorMessage(`Error reading file: ${err}`);
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
    const scope = await vscode.window.showQuickPick(
        [
            { label: 'Global', target: vscode.ConfigurationTarget.Global },
            { label: 'Workspace', target: vscode.ConfigurationTarget.Workspace },
        ],
        {
            placeHolder: 'Select the scope from which you want to remove the custom dataset',
        }
    );

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

    datasets.forEach(async (dataset) => {
        const index = existingMappings.indexOf(dataset);
        existingMappings.splice(index, 1);

        await config.update('customDatasets', existingMappings, scope?.target);

        logInfo(`Mapping removed: ${dataset.elementType} -> ${dataset.pathOrUrl}`);
    });

    // Reload the datasets
    loadDatasets();
}

async function addCustomDatasetFromLink(elementtype: string, scope: vscode.ConfigurationTarget) {
    const pathOrUrl = await vscode.window.showInputBox({
        placeHolder: 'Enter a path or URL',
        prompt: 'Enter a path or URL',
    });

    if (!pathOrUrl) {
        vscode.window.showInformationMessage('No path or URL provided.');
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

        vscode.window.showInformationMessage(`Successfully added dataset from: ${uri.toString()}`);
    } catch (err) {
        logError(err);
        vscode.window.showErrorMessage(`Invalid URL or path: ${pathOrUrl}`);
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

    vscode.window.showInformationMessage(`Mapping added: ${elementType} -> ${pathOrUrl}`);

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
    const customDatasets = getCustomDatasetConfiguration()[1];
    for (const entry of customDatasets) {
        if (isOutdatedDataset(entry)) {
            await changeCustomDatasetsSource('customDatasets', 'Local File', 'File');
            break;
        }
    }
    for (const entry of customDatasets) {
        await processCustomDatasetEntry(entry);
    }
}

async function processCustomDatasetEntry(entry: CustomDataset) {
    if (entry.elementType === CustomDatasetElementType.BUNDLE) {
        await loadBundleDataset(entry);
    } else if (entry.elementType === CustomDatasetElementType.ENUM) {
        const fileName = entry.pathOrUrl.split('/').reverse()[0].replace('.json', '').toLowerCase();
        const clazz = isFileSource(entry.source) ? StaticScribeEnum : WebScribeEnum;
        ScribeEnumHandler.addEnum(
            clazz,
            fileName,
            decodeURIComponent(vscode.Uri.parse(entry.pathOrUrl).path)
        );
    } else if (isFileSource(entry.source)) {
        const localDataset = await loadLocalMechanicDataset(entry.pathOrUrl);
        processMechanicDatasetEntry(localDataset, entry.elementType);
    } else if (isLinkSource(entry.source)) {
        const fileData = await fetchMechanicDatasetFromLink(entry.pathOrUrl);
        processMechanicDatasetEntry(fileData, entry.elementType);
    }
}

async function processMechanicDatasetEntry(entry: MechanicDataset, type: CustomDatasetElementType) {
    if (entry) {
        switch (type) {
            case CustomDatasetElementType.MECHANIC:
                ScribeMechanicHandler.registry.mechanic.addMechanic(...entry);
                break;
            case CustomDatasetElementType.TARGETER:
                ScribeMechanicHandler.registry.targeter.addMechanic(...entry);
                break;
            case CustomDatasetElementType.CONDITION:
                ScribeMechanicHandler.registry.condition.addMechanic(...entry);
                break;
            case CustomDatasetElementType.TRIGGER:
                ScribeMechanicHandler.registry.trigger.addMechanic(...entry);
                break;
        }
    }
}

async function loadBundleDataset(dataset: CustomDataset) {
    try {
        const fileUri = vscode.Uri.parse(dataset.pathOrUrl);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const configData: CustomDataset[] = JSON.parse(Buffer.from(fileContent).toString('utf8'));

        for (const entry of configData) {
            if (isFileSource(entry.source)) {
                const datasetDirUri = vscode.Uri.file(path.dirname(fileUri.fsPath));
                const entryUri = vscode.Uri.joinPath(datasetDirUri, entry.pathOrUrl);
                entry.pathOrUrl = entryUri.toString();
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

function isOutdatedDataset(dataset: CustomDataset) {
    return dataset.source.toString() === 'Local File';
}
