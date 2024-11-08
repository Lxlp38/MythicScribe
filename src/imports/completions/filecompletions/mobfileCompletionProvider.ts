import * as vscode from 'vscode';
import { MobFileObjects } from '../../../schemas/mobFileObjects';
import { fileCompletions, getKeyObjectCompletions, listCompletion } from '../../utils/completionhelper';
import { getParentKeys, isKey } from '../../utils/yamlutils';
import { EnumDatasetValue, EnumInfo, EnumType } from '../../../objectInfos';

export function mobFileCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (context.triggerKind === vscode.CompletionTriggerKind.Invoke && isKey(document, position.line)) {
                    const keys = getParentKeys(document, position, true).reverse();
                    return getKeyObjectCompletions(keys.slice(1), MobFileObjects);
                }

                if (!/^\s*$/.test(document.lineAt(position.line).text)) {
                    return undefined;
                }

                return fileCompletions(document, position, MobFileObjects);
            }
        }, "\n"
    );
}

export function damagemodifierCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (getParentKeys(document, position)[0] !== "DamageModifiers") {
                    return undefined;
                }

                const space = listCompletion(document, position, context);
                if (space === undefined) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];
                const floatlist = ["0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"].join(",");

                Object.entries(EnumInfo[EnumType.DAMAGECAUSE].dataset).forEach(([key, value]: [string, unknown]) => {
                    const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Function);
                    if ((value as EnumDatasetValue).description) {
                        completionItem.detail = `${(value as EnumDatasetValue).description}`;
                    }
                    completionItem.insertText = new vscode.SnippetString(space + key + " ${1|" + floatlist + "|}");
                    completionItem.kind = vscode.CompletionItemKind.EnumMember;
                    completionItems.push(completionItem);
                });
                return completionItems;
            }
        }, "\n", " "
    );
}