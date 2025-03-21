import * as vscode from 'vscode';
import {
    AbstractScribeMechanicRegistry,
    ScribeMechanicHandler,
} from '@common/datasets/ScribeMechanic';
import {
    checkShouldKeyComplete,
    getListCompletionNeededSpaces,
} from '@common/utils/completionhelper';
import { isInsideInlineConditionList } from '@common/utils/yamlutils';

export function mechanicCompletionProvider(
    registry: AbstractScribeMechanicRegistry,
    keyAliases: string[]
) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldKeyComplete(document, position, keyAliases)) {
                    return undefined;
                }

                const space = getListCompletionNeededSpaces(document, position, context);
                if (space === undefined) {
                    return undefined;
                }
                if (space !== '') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor === undefined) {
                        return [];
                    }
                    editor.insertSnippet(new vscode.SnippetString(space));
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
                }

                if (isInsideInlineConditionList(document, position, registry)) {
                    return ScribeMechanicHandler.registry.condition.mechanicCompletions;
                }
                return registry.mechanicCompletions;
            },
        },
        '-',
        ' '
    );
}
