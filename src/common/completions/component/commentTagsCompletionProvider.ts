import * as vscode from 'vscode';
import { checkShouldPrefixCompleteExec } from '@common/utils/completionhelper';
import { CommentTagsSchema } from '@common/mythicnodes/comment-parser/comment-tags-schema';

export function commentTagsCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                const line = document.lineAt(position.line).text;
                if (line.length === 0) {
                    return undefined;
                }
                if (line[0] !== '#' || position.character !== 3) {
                    return undefined;
                }

                if (!checkShouldPrefixCompleteExec(document, position, context, ['@'], 0)) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];
                for (const [tag, schema] of Object.entries(CommentTagsSchema)) {
                    if (schema.hidden) {
                        continue;
                    }

                    const item = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Field);
                    item.detail = schema.description;
                    if (schema.documentation) {
                        item.documentation = schema.documentation;
                    }

                    if (schema.snippetString) {
                        item.insertText = schema.snippetString();
                    } else {
                        item.insertText = new vscode.SnippetString(tag + ' $0');
                    }

                    completionItems.push(item);
                }
                return completionItems;
            },
        },
        '@'
    );
}
