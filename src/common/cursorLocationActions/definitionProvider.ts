import * as vscode from 'vscode';

import { MythicNodeHandler } from '../mythicnodes/MythicNode';
import { getParentKeys } from '../utils/yamlutils';
import { searchForLinkedAttribute } from '../completions/attributeCompletionProvider';
import { isMetaskillFile } from '../subscriptions/SubscriptionHelper';

export function definitionProvider() {
    return vscode.languages.registerDefinitionProvider('mythicscript', {
        provideDefinition(document, position): vscode.ProviderResult<vscode.LocationLink[]> {
            const wordRange = document.getWordRangeAtPosition(position, /[\w\-:]+/g);
            if (!wordRange) {
                return undefined;
            }
            const word = document.getText(wordRange);
            if (word.startsWith('skill:')) {
                const skillName = word.slice(6);
                const skill = MythicNodeHandler.registry.metaskills.getNode(skillName);
                if (skill) {
                    return [
                        {
                            originSelectionRange: wordRange.with({
                                start: wordRange.start.translate(0, 6),
                            }),
                            targetUri: skill.document.uri,
                            targetRange: skill.range,
                            targetSelectionRange: skill.range,
                        },
                    ];
                }
            }

            if (isMetaskillFile) {
                const lineText = document.lineAt(position.line).text;
                const castKeywords = ['cast', 'orElseCast', 'castInstead'];
                const beforeWord = lineText.slice(0, wordRange.start.character).trim();
                if (castKeywords.some((keyword) => beforeWord.endsWith(keyword))) {
                    const skill = MythicNodeHandler.registry.metaskills.getNode(word);
                    if (skill) {
                        return [
                            {
                                originSelectionRange: wordRange,
                                targetUri: skill.document.uri,
                                targetRange: skill.range,
                                targetSelectionRange: skill.range,
                            },
                        ];
                    }
                }
            }

            const keys = getParentKeys(document, position);
            const attribute = searchForLinkedAttribute(document, position, keys);
            if (attribute && attribute.enum && attribute.enum.identifier === 'metaskill') {
                const skill = MythicNodeHandler.registry.metaskills.getNode(word);
                if (!skill) {
                    return undefined;
                }
                return [
                    {
                        originSelectionRange: wordRange,
                        targetUri: skill.document.uri,
                        targetRange: skill.range,
                        targetSelectionRange: skill.range,
                    },
                ];
            }
            return undefined;
        },
    });
}
