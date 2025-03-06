import * as vscode from 'vscode';

import * as yamlutils from '../utils/yamlutils';
import { keyAliases } from '../objectInfos';
import { retriggerCompletionsCommand } from '../utils/completionhelper';
import { MythicNodeHandler } from '../mythicnodes/MythicNode';

export function inlineMetaskillCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const keys = yamlutils.getParentKeys(document, position);
                if (!keyAliases.Skills.includes(keys[0][0])) {
                    return undefined;
                }

                const lastTwoChars = document.getText(
                    new vscode.Range(position.translate(0, -2), position)
                );
                if (lastTwoChars !== '=[') {
                    return undefined;
                }

                return [provideInlinemetaskillCompletion()];
            },
        },
        '['
    );
}

export function metaskillCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const keys = yamlutils.getParentKeys(document, position);
                if (!keyAliases.Skills.includes(keys[0][0])) {
                    return undefined;
                }

                const lastChars = document.getText(
                    new vscode.Range(position.translate(0, -6), position)
                );
                if (lastChars !== 'skill:') {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];
                addMetaskillsToConditionLine(completionItems, '{$0}');
                return completionItems;
            },
        },
        ':'
    );
}

function provideInlinemetaskillCompletion() {
    const indent = vscode.window.activeTextEditor
        ? (vscode.window.activeTextEditor.options.tabSize as number)
        : 2;
    const indentation = ' '.repeat(indent);

    const completionItem = new vscode.CompletionItem(
        'Inline Metaskill',
        vscode.CompletionItemKind.Function
    );
    completionItem.detail = 'Generate the syntax for an inline metaskill';
    completionItem.kind = vscode.CompletionItemKind.Function;
    completionItem.insertText = new vscode.SnippetString(
        '\n' + indentation + '- $0\n' + indentation
    );
    completionItem.command = retriggerCompletionsCommand;

    return completionItem;
}
export function addMetaskillsToConditionLine(
    completionItems: vscode.CompletionItem[],
    string: string = ' $0'
) {
    MythicNodeHandler.registry.metaskills.getNodes().forEach((node) => {
        const completionItem = new vscode.CompletionItem(
            node.name.text,
            vscode.CompletionItemKind.Function
        );
        completionItem.kind = vscode.CompletionItemKind.Function;
        completionItem.insertText = new vscode.SnippetString(node.name.text + string);
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    });
}
