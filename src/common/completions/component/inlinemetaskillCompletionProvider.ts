import * as vscode from 'vscode';
import * as yamlutils from '@common/utils/yamlutils';
import { keyAliases } from '@common/objectInfos';
import { retriggerCompletionsCommand } from '@common/utils/completionhelper';
import { MythicNodeHandler } from '@common/mythicnodes/MythicNode';

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
    const indent = yamlutils.getDefaultIndentation();
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
    MythicNodeHandler.registry.metaskill.getNodes().forEach((node) => {
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

export function putSelectionInsideInlineMetaskill() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selection = new vscode.Range(
        new vscode.Position(editor.selection.start.line, 0),
        new vscode.Position(
            editor.selection.end.line,
            editor.selection.end.character === 0
                ? 0
                : document.lineAt(editor.selection.end.line).text.length
        )
    );
    const selectedText = document.getText(selection);
    const indent = yamlutils.getIndentation(document.lineAt(selection.start.line).text);
    const indentation = ' '.repeat(indent);

    const selectedLines = selectedText.split('\n');
    if (selectedLines[selectedLines.length - 1].trim() === '') {
        selectedLines.pop();
    }

    const newText = `${indentation}- skill{
${indentation}    s=[
${indentation}    ${selectedLines.join(`\n${indentation}    `)}
${indentation}    ]}\n`;

    editor.edit((editBuilder) => {
        editBuilder.replace(selection, newText);
    });
}
