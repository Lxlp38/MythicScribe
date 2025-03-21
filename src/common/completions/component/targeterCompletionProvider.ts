import * as vscode from 'vscode';
import { keyAliases } from '@common/objectInfos';
import { checkShouldComplete } from '@common/utils/completionhelper';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';

export function targeterCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldComplete(document, position, context, keyAliases.Skills, ['@'])) {
                    return undefined;
                }

                const completionItems = ScribeMechanicHandler.registry.targeter.mechanicCompletions;

                return completionItems;
            },
        },
        '@'
    );
}
