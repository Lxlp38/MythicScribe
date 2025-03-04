import * as vscode from 'vscode';

import { FileObjectMap, FileObjectTypes } from '../objectInfos';
import {
    MythicAttribute,
    AbstractScribeMechanicRegistry,
    MythicMechanic,
} from '../datasets/ScribeMechanic';
import { CursorLocationAction } from '../utils/cursorLocationAction';

export type KeyDependantMechanicLikeHover = {
    keys: string[];
    registry: AbstractScribeMechanicRegistry;
};

export function hoverProvider(
    fileobject: FileObjectMap,
    ...keydependencies: KeyDependantMechanicLikeHover[]
) {
    return vscode.languages.registerHoverProvider(['mythicscript', 'yaml'], {
        provideHover(
            document: vscode.TextDocument,
            position: vscode.Position
        ): vscode.ProviderResult<vscode.Hover> {
            return CursorLocationAction(
                document,
                position,
                fileobject,
                getHoverForFileElement,
                getHoverForAttribute,
                getHover,
                ...keydependencies
            );
        },
    });
}

async function getHover(mechanic: MythicMechanic): Promise<vscode.Hover> {
    // Combine the mechanic names into a comma-separated string for the mechanic's names
    const mechanicNames = mechanic.name.join(', ');

    // Start building the hover content for the mechanic
    const hoverContent = new vscode.MarkdownString(`
### [${mechanic.registry.type}](${mechanic.link})
[\`${mechanicNames}\`](${mechanic.link})


### Description
${mechanic.description}

---

`);
    const mechanicAttributes = mechanic.getMyAttributes();
    // Check if there are any attributes to display in the table
    if (mechanicAttributes && mechanicAttributes.length > 0) {
        // Add headers for the attribute table
        hoverContent.appendMarkdown(`\n\n`);
        hoverContent.appendMarkdown(`
| **Name**        | **Aliases**    | **Description**                  | **Default**       | **Type**            |
|-----------------|----------------|----------------------------------|-------------------|---------------------|
`);

        // Add each attribute to the table
        mechanicAttributes.forEach((attribute: MythicAttribute) => {
            const attributeName = attribute.name[0]; // First element as the primary name
            const attributeAliases = attribute.name.slice(1).join(', ') || ''; // Remaining names as aliases
            const attributeDescription = attribute.description || 'No description provided.';
            const defaultValue = attribute.default_value || 'None'; // Assuming there's a defaultValue field
            const attributeType = attribute.type || ''; // Default to "Unknown" if type is missing

            // Append the attribute details as a row in the table
            hoverContent.appendMarkdown(
                `| ${attributeName ? `\`${attributeName}\`` : ''} | ${attributeAliases ? `\`${attributeAliases}\`` : ''} | ${attributeDescription ? attributeDescription : ''} | ${defaultValue ? `\`${defaultValue}\`` : ''} | ${attributeType ? `\`${attributeType}\`` : ''} |\n`
            );
        });
    }

    hoverContent.appendMarkdown(`\n\n##### Plugin: ${mechanic.plugin}\n\n---`);

    hoverContent.appendMarkdown(
        `\n\n[Get More Information By Visiting Its Wiki Page](${mechanic.link})`
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
async function getHoverForAttribute(attribute: MythicAttribute): Promise<vscode.Hover> {
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
    link: string | undefined
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
    link: string | undefined
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
    return undefined;
}
