import * as vscode from 'vscode';

import { isEnabled } from '../utils/configutils';

export function shortcutsProvider() {
    return vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = event.document;
        if (!isEnabled) {
            return;
        }

        const changes = event.contentChanges;
        if (changes.length === 0) {
            return;
        }
        const change = changes[0];
        if (change.text !== '=') {
            return;
        }

        const position = editor.selection.active.translate(0, 1);
        const line = document.lineAt(position.line);
        const textBeforeCursor = line.text.substring(0, position.character);

        for (const key in mechanicShortcuts) {
            const shortcut = mechanicShortcuts[key];
            const match = textBeforeCursor.match(shortcut.regex);
            if (match) {
                const snippet = shortcut.function(match);
                if (snippet) {
                    editor.insertSnippet(
                        snippet,
                        new vscode.Range(position.translate(0, -match[0].length), position)
                    );
                }
                break;
            }
        }
    });
}

interface MechanicShortcut {
    regex: RegExp;
    function: (match: RegExpMatchArray) => vscode.SnippetString;
}

const mechanicShortcuts: { [key: string]: MechanicShortcut } = {
    setvariable: {
        regex: /(?<=-\s)([ctwgs])\.(?:([ifds])\.)?([\w_-]*)=$/,
        function: shortcutSetVariable,
    },
};

function shortcutSetVariable(match: RegExpMatchArray): vscode.SnippetString {
    let scope = 'skill';
    let type = 'integer';
    const name = match[3];

    switch (match[1]) {
        case 'c':
            scope = 'caster';
            break;
        case 't':
            scope = 'target';
            break;
        case 'w':
            scope = 'world';
            break;
        case 'g':
            scope = 'global';
            break;
        case 's':
            scope = 'skill';
            break;
    }

    if (match[2]) {
        switch (match[2]) {
            case 'i':
                type = 'INTEGER';
                break;
            case 'f':
                type = 'FLOAT';
                break;
            case 'd':
                type = 'DOUBLE';
                break;
            case 's':
                type = 'STRING';
                break;
        }
    }

    return new vscode.SnippetString(`setvariable{var=${scope}.${name};type=${type};value=$1} $2`);
}
