import * as vscode from 'vscode';

import { Log } from '../utils/logger';

export async function migrateConfiguration(
    oldKey: string,
    newkey: string,
    newProperty: string,
    scope: vscode.ConfigurationTarget
) {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const inspected = config.inspect(oldKey);

    if (!inspected) {
        return;
    }
    const inspectTarget =
        scope === vscode.ConfigurationTarget.Global ? 'globalValue' : 'workspaceValue';
    await updateScope(inspected[inspectTarget], scope);

    async function updateScope(value: unknown, target: vscode.ConfigurationTarget) {
        if (value !== undefined) {
            const fileRegex: { [key: string]: unknown } = config.get(newkey) || {};

            fileRegex[newProperty] = value;

            await config.update(newkey, fileRegex, target);
            await config.update(oldKey, undefined, target);

            Log.info(`Migrated ${oldKey} to ${newkey}`);
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

export async function doVersionSpecificMigrations(scope: vscode.ConfigurationTarget) {
    Log.debug('Running version specific migrations for', scope.toString());
    await Promise.all([
        migrateConfiguration('regexForMythicmobsFile', 'fileRegex', 'MythicMobs', scope),
        migrateConfiguration('regexForMobFile', 'fileRegex', 'Mob', scope),
        migrateConfiguration('regexForItemFile', 'fileRegex', 'Item', scope),
        migrateConfiguration('regexForMetaskillFile', 'fileRegex', 'MetaSkill', scope),
    ]);
}
