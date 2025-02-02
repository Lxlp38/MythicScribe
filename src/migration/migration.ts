import * as vscode from 'vscode';

import { logInfo } from '../utils/logger';

async function migrateConfiguration(oldKey: string, newkey: string, newProperty: string) {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const inspected = config.inspect(oldKey);

    if (!inspected) {
        return;
    }

    await updateScope(inspected.globalValue, vscode.ConfigurationTarget.Global);
    await updateScope(inspected.workspaceValue, vscode.ConfigurationTarget.Workspace);

    async function updateScope(value: unknown, target: vscode.ConfigurationTarget) {
        if (value !== undefined) {
            const fileRegex: { [key: string]: unknown } = config.get(newkey) || {};

            fileRegex[newProperty] = value;

            await config.update(newkey, fileRegex, target);
            await config.update(oldKey, undefined, target);

            logInfo(`Migrated ${oldKey} to ${newkey}`);
        }
    }
}

export async function changeCustomDatasetsSource(
    key: string = 'customDatasets',
    old: RegExp | string,
    replacement: string
) {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const inspected = config.inspect(key);

    if (!inspected) {
        return;
    }

    await updateScope(inspected.globalValue, vscode.ConfigurationTarget.Global);
    await updateScope(inspected.workspaceValue, vscode.ConfigurationTarget.Workspace);

    async function updateScope(value: unknown, target: vscode.ConfigurationTarget) {
        if (Array.isArray(value)) {
            const updatedValue = value.map((entry) => {
                if (entry && typeof entry === 'object' && 'source' in entry) {
                    return { ...entry, source: (entry.source as string).replace(old, replacement) };
                }
                return entry;
            });

            await config.update(key, updatedValue, target);
        }
    }
}

export async function migrate() {
    await Promise.all([
        migrateConfiguration('regexForMythicmobsFile', 'fileRegex', 'MythicMobs'),
        migrateConfiguration('regexForMobFile', 'fileRegex', 'Mob'),
        migrateConfiguration('regexForItemFile', 'fileRegex', 'Item'),
        migrateConfiguration('regexForMetaskillFile', 'fileRegex', 'MetaSkill'),
    ]);
}
