import * as vscode from 'vscode';
import { MobFileObjects } from '../../../schemas/mobFileObjects';
import { fileCompletions, getKeyObjectCompletions } from '../../utils/completionhelper';
import { getParentKeys, isKey } from '../../utils/yamlutils';

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

