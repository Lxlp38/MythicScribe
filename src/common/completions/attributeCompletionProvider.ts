import * as vscode from 'vscode';

import { keyAliases } from '../objectInfos';
import { MythicAttribute, MythicMechanic, ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { EnumDatasetValue } from '../datasets/ScribeEnum';
import {
    checkShouldPrefixComplete,
    getEnumCompletion,
    retriggerCompletionsCommand,
} from '../utils/completionhelper';
import * as yamlutils from '../utils/yamlutils';
import { getAttributeAliasUsedInCompletions } from '../utils/configutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';

export function attributeCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldPrefixComplete(document, position, context, ['{', ';'], 1)) {
                    return undefined;
                }

                const charBefore = document.getText(
                    new vscode.Range(position.translate(0, -2), position)
                );
                if (charBefore === ';;' || charBefore === '{;') {
                    const edit = new vscode.WorkspaceEdit();
                    edit.delete(
                        document.uri,
                        new vscode.Range(position.translate(0, -1), position)
                    );
                    await vscode.workspace.applyEdit(edit);
                    vscode.commands.executeCommand(retriggerCompletionsCommand.command);
                    return undefined;
                } else if (charBefore === '- ') {
                    return undefined;
                }

                const keys = yamlutils.getParentKeys(document, position);

                const mechanic = searchForLinkedObject(
                    document,
                    position,
                    yamlutils.getKeyNameFromYamlKey(keys),
                    keys[0][1]
                );
                if (!mechanic) {
                    return null;
                }

                const attributes = mechanic.getAttributes();
                let index = 10000;

                const attributeAliasUsedInCompletions = getAttributeAliasUsedInCompletions();

                const completionItems: vscode.CompletionItem[] = [];

                attributes.forEach((attribute: MythicAttribute) => {
                    let mainname = attribute.name[0];
                    let aliases = attribute.name;

                    if (attributeAliasUsedInCompletions === 'shorter') {
                        mainname = attribute.name.reduce((a: string, b: string) =>
                            a.length < b.length ? a : b
                        );
                        aliases = [mainname];
                        attribute.name.forEach((name: string) => {
                            if (name !== mainname) {
                                aliases.push(name);
                            }
                        });
                    }

                    const attributeType = attribute.type;
                    const attributeEnum = attribute.enum;
                    const completionItem = new vscode.CompletionItem(
                        mainname,
                        vscode.CompletionItemKind.Field
                    );
                    completionItem.label = `${aliases.join(', ')}`;
                    completionItem.detail = `${attribute.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Field;

                    if (attributeType === 'Boolean') {
                        completionItem.insertText = new vscode.SnippetString(
                            mainname + '=' + '${1|true,false|}'
                        );
                    } else if (attributeEnum) {
                        completionItem.insertText = new vscode.SnippetString(mainname + '=');
                        completionItem.command = retriggerCompletionsCommand;
                    } else {
                        completionItem.insertText = new vscode.SnippetString(mainname + '=');
                    }
                    completionItem.sortText = index.toString();
                    index++;
                    completionItems.push(completionItem);
                });

                return completionItems;
            },
        },
        '{',
        ';'
    );
}

export function attributeValueCompletionProvider() {
    const attributeValueCompletionProvider = vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldPrefixComplete(document, position, context, ['=', ','])) {
                    return undefined;
                }

                const keys = yamlutils.getParentKeys(document, position);
                const completionItems: vscode.CompletionItem[] = [];

                const attributeInfo = searchForLinkedAttribute(document, position, keys);

                if (!attributeInfo) {
                    return null;
                }

                const charBefore0 = document.getText(
                    new vscode.Range(position.translate(0, -1), position)
                );

                const attributeType = attributeInfo.type;
                const attributeEnum = attributeInfo.enum ? attributeInfo.enum : null;
                const attributeList = attributeInfo.list;

                if (charBefore0 === ',') {
                    if (!attributeList) {
                        return undefined;
                    }
                }

                if (attributeType === 'Boolean') {
                    completionItems.push(
                        new vscode.CompletionItem('true', vscode.CompletionItemKind.Value)
                    );
                    completionItems.push(
                        new vscode.CompletionItem('false', vscode.CompletionItemKind.Value)
                    );
                } else if (attributeEnum) {
                    if (!attributeEnum) {
                        return undefined;
                    }
                    attributeEnum.getDataset().forEach((value: EnumDatasetValue, key: string) => {
                        const completionItem = getEnumCompletion(value, key);
                        completionItems.push(completionItem);
                    });
                } else {
                    return undefined;
                }

                return completionItems;
            },
        },
        '=',
        ','
    );
    return attributeValueCompletionProvider;
}

function searchForLinkedObject(
    document: vscode.TextDocument,
    position: vscode.Position,
    keys: string[],
    maxSearchLine: number
): MythicMechanic | null {
    let mechanic: MythicMechanic | undefined;

    const object = getObjectLinkedToAttribute(document, position, maxSearchLine);
    if (!object) {
        return null;
    }
    if (object.startsWith('@')) {
        const type = ScribeMechanicHandler.registry.targeter;
        mechanic = type.getMechanicByName(object.replace('@', ''));
    } else if (object.startsWith('?')) {
        const type = ScribeMechanicHandler.registry.condition;
        mechanic = type.getMechanicByName(
            object.replace('?', '').replace('!', '').replace('~', '')
        );
    } else if (keyAliases.Conditions.includes(keys[0])) {
        const type = ScribeMechanicHandler.registry.condition;
        mechanic = type.getMechanicByName(object);
    } else if (keyAliases.AITargetSelectors.includes(keys[0])) {
        const type = ScribeMechanicHandler.registry.aitarget;
        mechanic = type.getMechanicByName(object);
    } else if (keyAliases.AIGoalSelectors.includes(keys[0])) {
        const type = ScribeMechanicHandler.registry.aigoal;
        mechanic = type.getMechanicByName(object);
    } else {
        const type = ScribeMechanicHandler.registry.mechanic;
        mechanic = type.getMechanicByName(object);

        if (!mechanic && object.startsWith('skill:')) {
            mechanic = type.getMechanicByName('skill');
        }
    }
    if (
        !mechanic &&
        yamlutils.isInsideInlineConditionList(
            document,
            position,
            ScribeMechanicHandler.registry.mechanic,
            ScribeMechanicHandler.registry.aigoal,
            ScribeMechanicHandler.registry.aitarget
        )
    ) {
        mechanic = ScribeMechanicHandler.registry.condition.getMechanicByName(object);
    }

    return mechanic ? mechanic : null;
}

export function searchForLinkedAttribute(
    document: vscode.TextDocument,
    position: vscode.Position,
    keys: yamlutils.YamlKey[]
): MythicAttribute | undefined {
    const mechanic = searchForLinkedObject(
        document,
        position,
        yamlutils.getKeyNameFromYamlKey(keys),
        keys[0][1]
    );
    if (!mechanic) {
        return undefined;
    }
    const attribute = document
        .getText(new vscode.Range(new vscode.Position(keys[0][1], 0), position))
        .match(MythicAttribute.regex)
        ?.pop();

    if (!attribute) {
        return undefined;
    }

    return mechanic.getAttributeByName(attribute);
}
