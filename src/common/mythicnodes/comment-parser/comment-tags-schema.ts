import * as vscode from 'vscode';
import { ScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';

import type { CommentTags } from './comment-parser';

export const CommentTagsSchema: Record<
    CommentTags,
    {
        description: string;
        documentation?: vscode.MarkdownString;
        snippetString?: (context?: {
            document?: vscode.TextDocument;
            position?: vscode.Position;
            context?: vscode.CompletionContext;
        }) => vscode.SnippetString;
        hidden?: boolean;
    }
> = {
    plugin: {
        description: 'The plugin this mechanic belongs to',
    },
    param: {
        description: 'A skill parameter of the MetaSkill',
        documentation: new vscode.MarkdownString(
            `paramType can be any single enum identifier or a comma-separated list of values.`
        ),
        snippetString: () =>
            new vscode.SnippetString(
                'param \{${1|Comma-Separated list of values,' +
                    ScribeEnumHandler.getEnumList().join(',') +
                    '|}\} ${2:paramName} - ${3:description}'
            ),
    },
    link: {
        description: 'The reference link for the source of this MetaSkill',
    },
    id: {
        description: 'The internal name of the MetaSkill',
        hidden: true,
    },
    extend: {
        description: 'The MetaSkill/Mechanic this one extends, inheriting all of its parameters',
        snippetString: () =>
            new vscode.SnippetString(
                'extend ${1|' +
                    ScribeMechanicHandler.registry.mechanic.mechanicClasses.join(',') +
                    '|}'
            ),
    },
    author: {
        description: 'The author(s) of this MetaSkill',
    },
    mechanic: {
        description:
            'The flag to identify the comment block following it as a MetaSkill definition',
    },
};
