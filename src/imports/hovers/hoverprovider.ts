import * as vscode from 'vscode';
import { ObjectType, SkillFileObjects } from '../../objectInfos';
import * as yamlutils from '../utils/yamlutils';
import { isEnabled } from '../utils/configutils';
import { getCursorSkills, getCursorCondition } from '../utils/cursorutils';


export const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {

        if (isEnabled(document) === false) {
            return undefined;
        }




        if (yamlutils.isKey(document, position.line) === true) {
            const key = yamlutils.getKey(document, position.line);
            if (Object.keys(SkillFileObjects).includes(key)){
                const key_ = key as keyof typeof SkillFileObjects;
                return getMinimalHover(key, SkillFileObjects[key_].description ,SkillFileObjects[key_].link);
            }
            return undefined;
        }

        var obj, type = null;
        const keys = yamlutils.getParentKeys(document, position.line);

        switch (keys[0]) {
            case 'Skills':
    
                [obj, type] = getCursorSkills(document, position);
    
                if (!obj) {
                    return null;
                }
    
                return getHover(obj, type);
            case "Conditions": case "TargetConditions": case "TriggerConditions":
                [obj, type] = getCursorCondition(document, position, true);
    
                if (!obj) {
                    return null;
                }
    
                return getHover(obj, type);
        }
    
    
        return null;
    }
});



async function getHover(mechanic: any, type: ObjectType): Promise<vscode.Hover | undefined> {
    if (type == ObjectType.ATTRIBUTE) {
        return getHoverForAttribute(mechanic);
    }



    // Combine the mechanic names into a comma-separated string for the mechanic's names
    const mechanicNames = mechanic.name.join(', ');
    

    // Start building the hover content for the mechanic
    let hoverContent = new vscode.MarkdownString(`
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
        mechanic.attributes.forEach((attribute: any) => {

            const attributeName = attribute.name[0]; // First element as the primary name
            const attributeAliases = attribute.name.slice(1).join(', ') || ''; // Remaining names as aliases
            const attributeDescription = attribute.description || 'No description provided.';
            const defaultValue = attribute.default_value || 'None'; // Assuming there's a defaultValue field
            const attributeType = attribute.type || ''; // Default to "Unknown" if type is missing

            // Append the attribute details as a row in the table
            hoverContent.appendMarkdown(`| ${attributeName ? `\`${attributeName}\`` : ''} | ${attributeAliases ? `\`${attributeAliases}\`` : ''} | ${attributeDescription ? attributeDescription : ''} | ${defaultValue ? `\`${defaultValue}\`` : ''} | ${attributeType ? `\`${attributeType}\`` : ''} |\n`);
        });
    }

    hoverContent.appendMarkdown(`\n\n[Get More Information By Visiting Its Wiki Page](${mechanic.link})`);

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
async function getHoverForAttribute(attribute: any): Promise<vscode.Hover> {
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

function getMinimalHover(title : string, description: string, link : string) : vscode.Hover {
    const hoverContent = new vscode.MarkdownString(`
## [${title}](${link})

${description}`)
    hoverContent.isTrusted = true;
    return new vscode.Hover(hoverContent);
}