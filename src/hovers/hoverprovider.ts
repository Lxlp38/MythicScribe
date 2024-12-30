import * as vscode from 'vscode';

import {
    keyAliases,
    ObjectType,
    Mechanic,
    Attribute,
    FileObjectMap,
    FileObjectTypes,
} from '../objectInfos';
import { ItemFileObjects } from '../schemas/itemfileObjects';
import { MobFileObjects } from '../schemas/mobFileObjects';
import { MetaskillFileObjects } from '../schemas/metaskillFileObjects';
import * as yamlutils from '../utils/yamlutils';
import { isItemFile, isMetaskillFile, isMobFile } from '../utils/configutils';
import { getCursorSkills, getCursorObject } from '../utils/cursorutils';

export function hoverProvider() {
    return vscode.languages.registerHoverProvider(['mythicscript', 'yaml'], {
        provideHover(document: vscode.TextDocument, position: vscode.Position) {
            const keys = yamlutils.getParentKeys(document, position);

            if (yamlutils.isKey(document, position.line) === true) {
                const fileobject = isMetaskillFile
                    ? MetaskillFileObjects
                    : isMobFile
                      ? MobFileObjects
                      : isItemFile
                        ? ItemFileObjects
                        : undefined;
                if (!fileobject) {
                    return undefined;
                }

                const key = yamlutils.getKey(document, position.line);
                keys.reverse();
                keys.push(key);

                return getHoverForFileElement(keys.slice(1), fileobject, undefined);
            }

            if (keyAliases.Skills.includes(keys[0])) {
                const result = getCursorSkills(document, position);
                if (!result) {
                    return null;
                }
                const [obj, type] = result;

                if (!obj) {
                    return null;
                }
                if (type === ObjectType.ATTRIBUTE) {
                    return getHoverForAttribute(obj as Attribute);
                }

                return getHover(obj as Mechanic, type as ObjectType);
            } else if (keyAliases.Conditions.includes(keys[0])) {
                return getHoverForMechanicLike(ObjectType.CONDITION, document, position);
            } else if (keyAliases.AITargetSelectors.includes(keys[0])) {
                return getHoverForMechanicLike(ObjectType.AITARGET, document, position);
            }

            return null;
        },
    });
}

async function getHoverForMechanicLike(
    oType: ObjectType,
    document: vscode.TextDocument,
    position: vscode.Position,
): Promise<vscode.Hover | undefined> {
    const result = getCursorObject(oType, document, position);
    if (!result) {
        return undefined;
    }
    const [obj, type] = result;

    if (!obj) {
        return undefined;
    }
    if (type === ObjectType.ATTRIBUTE) {
        return getHoverForAttribute(obj as Attribute);
    }

    return getHover(obj as Mechanic, type as ObjectType);
}

async function getHover(mechanic: Mechanic, type: ObjectType): Promise<vscode.Hover | undefined> {
    // Combine the mechanic names into a comma-separated string for the mechanic's names
    const mechanicNames = mechanic.name.join(', ');

    // Start building the hover content for the mechanic
    const hoverContent = new vscode.MarkdownString(`
### [${type}](${mechanic.link})
[\`${mechanicNames}\`](${mechanic.link})


### Description
${mechanic.description}

---

`);

    // Check if there are any attributes to display in the table
    if (mechanic.attributes && mechanic.attributes.length > 0) {
        // Add headers for the attribute table
        hoverContent.appendMarkdown(`\n\n`);
        hoverContent.appendMarkdown(`
| **Name**        | **Aliases**    | **Description**                  | **Default**       | **Type**            |
|-----------------|----------------|----------------------------------|-------------------|---------------------|
`);

        // Add each attribute to the table
        mechanic.attributes.forEach((attribute: Attribute) => {
            const attributeName = attribute.name[0]; // First element as the primary name
            const attributeAliases = attribute.name.slice(1).join(', ') || ''; // Remaining names as aliases
            const attributeDescription = attribute.description || 'No description provided.';
            const defaultValue = attribute.default_value || 'None'; // Assuming there's a defaultValue field
            const attributeType = attribute.type || ''; // Default to "Unknown" if type is missing

            // Append the attribute details as a row in the table
            hoverContent.appendMarkdown(
                `| ${attributeName ? `\`${attributeName}\`` : ''} | ${attributeAliases ? `\`${attributeAliases}\`` : ''} | ${attributeDescription ? attributeDescription : ''} | ${defaultValue ? `\`${defaultValue}\`` : ''} | ${attributeType ? `\`${attributeType}\`` : ''} |\n`,
            );
        });
    }

    hoverContent.appendMarkdown(`\n\n##### Plugin: ${mechanic.plugin}\n\n---`);

    hoverContent.appendMarkdown(
        `\n\n[Get More Information By Visiting Its Wiki Page](${mechanic.link})`,
    );

    // Enable support for links
    hoverContent.isTrusted = true;

    // Return the hover with the formatted content
    return new vscode.Hover(hoverContent);
}

/**
 * Function to return a Markdown hover for the given attribute
 * @param attribute - The attribute object containing name, type, description, and link
 * @returns A new Hover object with Markdown content
 */
async function getHoverForAttribute(attribute: Attribute): Promise<vscode.Hover> {
    // Combine the names into a comma-separated string
    const attributeNames = attribute.name.join(', ');

    // Format the hover content using Markdown
    const hoverContent = new vscode.MarkdownString(`
## [Attribute](${attribute.link})
### [\`${attributeNames}\`](${attribute.link})

#### Type \`${attribute.type}\`
#### Default \`${attribute.default_value}\`
### Description\n\n${attribute.description}
`);

    // Enable support for links
    hoverContent.isTrusted = true;

    // Return a new hover with the formatted content
    return new vscode.Hover(hoverContent);
}

function getMinimalHover(
    title: string,
    description: string | undefined,
    link: string | undefined,
): vscode.Hover {
    const hoverContent = new vscode.MarkdownString(`
## [${title}](${link})

${description ? description : 'No description provided.'}`);
    hoverContent.isTrusted = true;
    return new vscode.Hover(hoverContent);
}

function getHoverForFileElement(
    keys: string[],
    type: FileObjectMap,
    link: string | undefined,
): vscode.Hover | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    if (!object) {
        return undefined;
    }
    if (keys.length === 0) {
        return getMinimalHover(key, object.description, object.link ? object.link : link);
    }
    if (object.type === FileObjectTypes.KEY && object.keys) {
        const newobject = object.keys;
        return getHoverForFileElement(keys, newobject, object.link);
    }
}
