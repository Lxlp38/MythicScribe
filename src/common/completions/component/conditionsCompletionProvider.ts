import * as vscode from 'vscode';
import * as yamlutils from '@common/utils/yamlutils';
import { keyAliases } from '@common/objectInfos';
import { ConditionActions } from '@common/schemas/conditionActions';
import { checkShouldKeyComplete, getCharBefore } from '@common/utils/completionhelper';
import { retriggerCompletionsCommand } from '@common/constants';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';

import { addMetaskillsToConditionLine } from './inlinemetaskillCompletionProvider';

export function conditionCompletionProvider(keys: string[] = keyAliases.Conditions) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldKeyComplete(document, position, keys)) {
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
    const charBefore = getCharBefore(document, position, 2);
    if (charBefore.length === 0 || charBefore[1] === '{') {
        return undefined;
    }

    const lineBefore = document.getText(
        new vscode.Range(position.with({ character: 0 }), position)
    );
    const wordBefore = yamlutils.getWordBeforePosition(document, position);

    const completionItems: vscode.CompletionItem[] = [];
    const lastIsConditionAction = ConditionActions.getConditionActions().includes(wordBefore);
    if (lastIsConditionAction) {
        if (ConditionActions.actions.get(wordBefore) === ConditionActions.types.METASKILL) {
            addMetaskillsToConditionLine(completionItems);
            return completionItems;
        }
        addOperatorsToConditionLine(completionItems);
        return completionItems;
    }

    const condact = ConditionActions.getConditionActions();
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

    handleBracketsCompletions(document.lineAt(position.line).text, completionItems, context);

    completionItems.push(...ScribeMechanicHandler.registry.condition.mechanicCompletions);
    return completionItems;
}

function handleBracketsCompletions(
    line: string,
    completionItems: vscode.CompletionItem[],
    context: vscode.CompletionContext
) {
    let space = ' ';

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

    const openBraceCount = (line.match(/\(/g) || []).length;
    const closeBraceCount = (line.match(/\)/g) || []).length;
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
    ConditionActions.getConditionActions().forEach((key: string) => {
        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Function);
        completionItem.kind = vscode.CompletionItemKind.Function;
        completionItem.insertText = new vscode.SnippetString(key + ' $0');
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    });
}
