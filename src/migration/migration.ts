import * as vscode from 'vscode';

export async function migrateConfiguration(oldKey: string, newkey: string, newProperty: string) {
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
        }
    }
}

export function migrate() {
    migrateConfiguration('regexForMythicmobsFile', 'fileRegex', 'MythicMobs');
    migrateConfiguration('regexForMobFile', 'fileRegex', 'Mob');
    migrateConfiguration('regexForItemFile', 'fileRegex', 'Item');
    migrateConfiguration('regexForMetaskillFile', 'fileRegex', 'MetaSkill');
}
