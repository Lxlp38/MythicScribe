import * as vscode from 'vscode';

import * as yamlutils from '../utils/yamlutils';
import { keyAliases } from '../objectInfos';
import { ConditionActions, ConditionTypes } from '../schemas/conditionActions';
import { checkShouldKeyComplete, retriggerCompletionsCommand } from '../utils/completionhelper';
import { ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { addMetaskillsToConditionLine } from './inlinemetaskillCompletionProvider';

export function conditionCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldKeyComplete(document, position, keyAliases.Conditions)) {
                    return undefined;
                }
                return getConditionCompletionItems(document, position, context);
            },
        },
        '-',
        ' ',
        '(',
        '|',
        '&',
        ')'
    );
}

export function getConditionCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
) {
    const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
    if (charBefore[1] === '{') {
        return undefined;
    }

    const lineBefore = document.getText(
        new vscode.Range(position.with({ character: 0 }), position)
    );
    const wordBefore = yamlutils.getWordBeforePosition(document, position);

    let space = ' ';

    const completionItems: vscode.CompletionItem[] = [];
    const lastIsConditionAction = Object.keys(ConditionActions).includes(wordBefore);
    if (lastIsConditionAction) {
        if (ConditionActions[wordBefore] === ConditionTypes.METASKILL) {
            addMetaskillsToConditionLine(completionItems);
            return completionItems;
        }
        addOperatorsToConditionLine(completionItems);
        return completionItems;
    }

    const condact = fetchConditionActions();
    if (!['- ', '( ', '| ', '& '].includes(charBefore)) {
        if ([') ', '} '].includes(charBefore) || /(\w+({.*})?\s)$/.test(lineBefore)) {
            if (!condact.includes(wordBefore)) {
                addConditionActionsToConditionLine(completionItems);
            }
            addOperatorsToConditionLine(completionItems);

            return completionItems;
        }
        return undefined;
    }
    if (
        context.triggerKind === vscode.CompletionTriggerKind.Invoke &&
        context.triggerCharacter === undefined
    ) {
        space = '';
    }
    if (
        context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter &&
        context.triggerCharacter === ' '
    ) {
        space = '';
    }

    const openBraceCompletion = new vscode.CompletionItem('(', vscode.CompletionItemKind.Function);
    openBraceCompletion.kind = vscode.CompletionItemKind.Function;
    openBraceCompletion.insertText = new vscode.SnippetString(space + '( $0 )');
    openBraceCompletion.command = retriggerCompletionsCommand;
    completionItems.push(openBraceCompletion);

    const openBraceCount = (document.getText().match(/\(/g) || []).length;
    const closeBraceCount = (document.getText().match(/\)/g) || []).length;
    if (openBraceCount > closeBraceCount) {
        const closeBraceCompletion = new vscode.CompletionItem(
            ')',
            vscode.CompletionItemKind.Function
        );
        closeBraceCompletion.kind = vscode.CompletionItemKind.Function;
        closeBraceCompletion.insertText = new vscode.SnippetString(') $0');
        closeBraceCompletion.command = retriggerCompletionsCommand;
        completionItems.push(closeBraceCompletion);
    }

    completionItems.push(...ScribeMechanicHandler.registry.condition.mechanicCompletions);

    return completionItems;
}

function addOperatorsToConditionLine(completionItems: vscode.CompletionItem[]) {
    const completionItem1 = new vscode.CompletionItem('&&', vscode.CompletionItemKind.Function);
    completionItem1.kind = vscode.CompletionItemKind.Function;
    completionItem1.insertText = new vscode.SnippetString('&& $0');
    completionItem1.command = retriggerCompletionsCommand;
    const completionItem2 = new vscode.CompletionItem('||', vscode.CompletionItemKind.Function);
    completionItem2.kind = vscode.CompletionItemKind.Function;
    completionItem2.insertText = new vscode.SnippetString('|| $0');
    completionItem2.command = retriggerCompletionsCommand;
    completionItems.push(completionItem1);
    completionItems.push(completionItem2);
}

function addConditionActionsToConditionLine(completionItems: vscode.CompletionItem[]) {
    Object.keys(ConditionActions).forEach((key: string) => {
        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Function);
        completionItem.kind = vscode.CompletionItemKind.Function;
        completionItem.insertText = new vscode.SnippetString(key + ' $0');
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    });
}

function fetchConditionActions(): string[] {
    const condact = Object.keys(ConditionActions);
    return condact;
}
