import * as vscode from 'vscode';

import { checkShouldPrefixComplete } from '../utils/completionhelper';
import { getNodeFromPlaceholder, ScribePlaceholderHandler } from '../datasets/ScribePlaceholder';

export function placeholderCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldPrefixComplete(document, position, context, ['<', '.'], 0)) {
                    return undefined;
                }

                if (checkShouldPrefixComplete(document, position, context, ['.'], 0)) {
                    const lineText = document
                        .lineAt(position.line)
                        .text.substring(0, position.character);
                    const lastLessThanIndex = lineText.lastIndexOf('<');
                    if (lastLessThanIndex === -1) {
                        return undefined;
                    }
                    const lastPointIndex = lineText.lastIndexOf('.');
                    if (lastPointIndex < lastLessThanIndex) {
                        return undefined;
                    }
                    const previousPlaceholder = lineText.substring(
                        lastLessThanIndex + 1,
                        lastPointIndex
                    );
                    const matchPreviousPlaceholder = getNodeFromPlaceholder(previousPlaceholder);
                    return matchPreviousPlaceholder?.generateCompletions();
                }

                return ScribePlaceholderHandler.generateCompletions();
            },
        },
        '<'
    );
}
