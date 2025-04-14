import * as vscode from 'vscode';
import { keyAliases } from '@common/objectInfos';
import {
    MythicAttribute,
    MythicMechanic,
    ScribeMechanicHandler,
} from '@common/datasets/ScribeMechanic';
import { EnumDatasetValue } from '@common/datasets/ScribeEnum';
import {
    checkShouldPrefixComplete,
    getEnumCompletion,
    retriggerCompletionsCommand,
} from '@common/utils/completionhelper';
import * as yamlutils from '@common/utils/yamlutils';
import { getAttributeAliasUsedInCompletions } from '@common/utils/configutils';
import { getObjectLinkedToAttribute } from '@common/utils/cursorutils';

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
                    keys[0].line
                );
                if (!mechanic) {
                    return null;
                }

                const attributes = mechanic.getAttributes();
                let index = 10000;

                const attributeAliasUsedInCompletions = getAttributeAliasUsedInCompletions();

                const completionItems: vscode.CompletionItem[] = [];

                attributes.forEach((attribute: MythicAttribute) => {
                    let mainname: string;
                    let aliases: string[];

                    function finalizeAttributeAliases() {
                        const aliases = [mainname];
                        attribute.name.forEach((name: string) => {
                            if (name !== mainname) {
                                aliases.push(name);
                            }
                        });
                        return aliases;
                    }

                    switch (attributeAliasUsedInCompletions) {
                        case 'shorter':
                            mainname = attribute.name.reduce((a: string, b: string) =>
                                a.length < b.length ? a : b
                            );
                            aliases = finalizeAttributeAliases();
                            break;
                        case 'longer':
                            mainname = attribute.name.reduce((a: string, b: string) =>
                                a.length > b.length ? a : b
                            );
                            aliases = finalizeAttributeAliases();
                            break;
                        default:
                            mainname = attribute.name[0];
                            aliases = attribute.name;
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

export function matchLinkedObject(object: string, key: string) {
    if (!object) {
        return undefined;
    }
    let mechanic: MythicMechanic | undefined;
    if (object.startsWith('@')) {
        const type = ScribeMechanicHandler.registry.targeter;
        mechanic = type.getMechanicByName(object.replace('@', ''));
    } else if (object.startsWith('?')) {
        const type = ScribeMechanicHandler.registry.condition;
        mechanic = type.getMechanicByName(
            object.replace('?', '').replace('!', '').replace('~', '')
        );
    } else if (keyAliases.Conditions.includes(key)) {
        const type = ScribeMechanicHandler.registry.condition;
        mechanic = type.getMechanicByName(object);
    } else if (keyAliases.AITargetSelectors.includes(key)) {
        const type = ScribeMechanicHandler.registry.aitarget;
        mechanic = type.getMechanicByName(object);
    } else if (keyAliases.AIGoalSelectors.includes(key)) {
        const type = ScribeMechanicHandler.registry.aigoal;
        mechanic = type.getMechanicByName(object);
    } else {
        const type = ScribeMechanicHandler.registry.mechanic;
        mechanic = type.getMechanicByName(object);

        if (!mechanic && object.startsWith('skill:')) {
            mechanic = type.getMechanicByName('skill');
        }
    }
    return mechanic;
}

export function searchForLinkedAttribute(
    document: vscode.TextDocument,
    position: vscode.Position,
    keys: yamlutils.YamlKey[]
): MythicAttribute | undefined {
    if (keys.length === 0) {
        return undefined;
    }
    const mechanic = searchForLinkedObject(
        document,
        position,
        yamlutils.getKeyNameFromYamlKey(keys),
        keys[0].line
    );
    if (!mechanic) {
        return undefined;
    }
    const attribute = document
        .getText(new vscode.Range(new vscode.Position(keys[0].line, 0), position))
        .match(MythicAttribute.regex)
        ?.pop();

    if (!attribute) {
        return undefined;
    }

    return mechanic.getAttributeByName(attribute);
}
