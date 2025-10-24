import { Mechanic } from '@common/datasets/ScribeMechanic';
import * as vscode from 'vscode';

import * as commentParser from 'comment-parser';

import type { MythicNode } from '../MythicNode';

const options: Parameters<typeof commentParser.parse>[1] = {};

export const CommentTags = ['plugin', 'param', 'link', 'id', 'extend', 'author'] as const;
type CommentTags = (typeof CommentTags)[number];

export function getMechanicFromComment(comment: string, node: MythicNode): Mechanic | undefined {
    const parsed = parseComments(comment);
    if (!parsed) {
        return undefined;
    }
    const tags: Record<CommentTags, commentParser.Spec[]> = {
        plugin: [],
        param: [],
        link: [],
        id: [],
        extend: [],
        author: [],
    };

    for (const tag of parsed.tags) {
        if (tags.hasOwnProperty(tag.tag) && (CommentTags as readonly string[]).includes(tag.tag)) {
            tags[tag.tag as CommentTags].push(tag);
        }
    }

    return {
        class: tags.id[0]?.name || 'λ' + node.name.text,
        name: ['skill:' + node.name.text],
        plugin:
            tags.plugin[0]?.name ||
            'Local Skill at [' +
                node.document.uri.fsPath.replaceAll('\\', '/').split('/').pop() +
                '](' +
                node.document.uri.toString() +
                ')',
        author: tags.author.map((authorTag) => authorTag.name).join(', ') || undefined,
        description: parsed.description.replace(/^\-/, '').trim() || '',
        extends: tags.extend[0]?.name || undefined,
        attributes: tags.param.map((paramTag) => {
            return {
                name: [paramTag.name],
                description: paramTag.description,
                default_value: paramTag.default || '',
                type: 'String',
                enum: paramTag.type,
            };
        }),
        link: tags.link[0]?.name || '',
    };
}

function parseComments(source: string) {
    const comment =
        '/**\n' +
        source
            .split('\n')
            .map((line) => ' * ' + line)
            .join('\n') +
        '\n**/';
    const parsed = commentParser.parse(comment, options);
    if (parsed.length > 0) {
        return parsed[0];
    }
    return undefined;
}

export function createDocumentationFromSkillParameters(
    parameters: string[],
    position: vscode.Position
) {
    let doc = '@mechanic';
    doc += 'Describe the metaskill here.  \n';
    doc += '\n';
    for (const param of parameters) {
        doc += `@param {ParameterType} ${param} - Description of what ${param} does  \n`;
    }
    doc += '\n';
    doc += '@author YourName  \n';
    doc += '@plugin YourPluginName  \n';
    doc += '@link http://example.com  ';

    doc = doc
        .split('\n')
        .map((line) => '# ' + line)
        .join('\n');
    doc += '\n';

    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.edit((editBuilder) => {
            editBuilder.insert(position, doc);
        });
    }

    return doc;
}

// function stringifyComments(block: commentParser.Block) {
//     const unparsed = commentParser.stringify(block);
//     const lines = unparsed.split('\n');
//     // Remove the starting /** and ending */
//     if (lines.length >= 2) {
//         lines.shift();
//         lines.pop();
//     }
//     // Remove leading " * " from each line
//     const cleanedLines = lines
//         .map((line) => {
//             if (line.startsWith(' * ')) {
//                 return line.substring(3);
//             } else if (line.startsWith(' *')) {
//                 return line.substring(2);
//             } else {
//                 return line;
//             }
//         })
//         // And add '#' at the start of each line
//         .map((line) => '#' + line);
//     return cleanedLines.join('\n');
// }
