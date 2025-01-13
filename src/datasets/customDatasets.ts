import * as vscode from 'vscode';

import { MechanicDataset, ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler, StaticScribeEnum, WebScribeEnum } from './ScribeEnum';
import { fetchMechanicDatasetFromLink, loadDatasets, loadLocalMechanicDataset } from './datasets';
import { logError } from '../utils/logger';

export enum CustomDatasetElementType {
    MECHANIC = 'Mechanic',
    CONDITION = 'Condition',
    TRIGGER = 'Trigger',
    TARGETER = 'Targeter',
    ENUM = 'Enum',
}

export enum CustomDatasetSource {
    LOCALFILE = 'Local File',
    LINK = 'Link',
}

export interface CustomDataset {
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

export async function addCustomDatasetFromLink(
    elementtype: string,
    scope: vscode.ConfigurationTarget
) {
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

export function getCustomDatasetConfiguration(): [vscode.WorkspaceConfiguration, CustomDataset[]] {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const existingMappings = config.get<CustomDataset[]>('customDatasets') || [];

    return [config, existingMappings];
}

export async function loadCustomDatasets() {
    const customDatasets = getCustomDatasetConfiguration()[1];

    for (const entry in customDatasets) {
        const dataset = customDatasets[entry];
        if (dataset.elementType === CustomDatasetElementType.ENUM) {
            const fileName = dataset.pathOrUrl
                .split('/')
                .reverse()[0]
                .replace('.json', '')
                .toLowerCase();
            if (dataset.source === CustomDatasetSource.LOCALFILE) {
                ScribeEnumHandler.addEnum(
                    StaticScribeEnum,
                    fileName,
                    decodeURIComponent(vscode.Uri.parse(dataset.pathOrUrl).path)
                );
            } else if (dataset.source === CustomDatasetSource.LINK) {
                ScribeEnumHandler.addEnum(WebScribeEnum, fileName, dataset.pathOrUrl);
            }
        } else {
            if (dataset.source === CustomDatasetSource.LOCALFILE) {
                await loadLocalCustomDataset(dataset);
            } else if (dataset.source === CustomDatasetSource.LINK) {
                await loadLinkCustomDataset(dataset);
            }
        }
    }
}

async function loadLocalCustomDataset(dataset: CustomDataset) {
    const localDataset = await loadLocalMechanicDataset(dataset.pathOrUrl);
    if (localDataset) {
        switch (dataset.elementType) {
            case CustomDatasetElementType.MECHANIC:
                ScribeMechanicHandler.registry.mechanic.addMechanic(...localDataset);
                break;
            case CustomDatasetElementType.TARGETER:
                ScribeMechanicHandler.registry.targeter.addMechanic(...localDataset);
                break;
            case CustomDatasetElementType.CONDITION:
                ScribeMechanicHandler.registry.condition.addMechanic(...localDataset);
                break;
            case CustomDatasetElementType.TRIGGER:
                ScribeMechanicHandler.registry.trigger.addMechanic(...localDataset);
                break;
        }
    }
}

async function loadLinkCustomDataset(dataset: CustomDataset) {
    const fileData = await fetchMechanicDatasetFromLink(dataset.pathOrUrl);
    if (fileData) {
        switch (dataset.elementType) {
            case CustomDatasetElementType.MECHANIC:
                ScribeMechanicHandler.registry.mechanic.addMechanic(...fileData);
                break;
            case CustomDatasetElementType.TARGETER:
                ScribeMechanicHandler.registry.targeter.addMechanic(...fileData);
                break;
            case CustomDatasetElementType.CONDITION:
                ScribeMechanicHandler.registry.condition.addMechanic(...fileData);
                break;
            case CustomDatasetElementType.TRIGGER:
                ScribeMechanicHandler.registry.trigger.addMechanic(...fileData);
                break;
        }
    }
}
