import * as vscode from 'vscode';

import { getDefaultIndentation, getUsedIndentation } from '../utils/yamlutils';

export function getFormatter() {
    return vscode.languages.registerDocumentFormattingEditProvider('mythicscript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const textEdits: vscode.TextEdit[] = [];
            const text = document.getText();

            // First step: Add newlines at specific points
            const modifiedText = addNewlinesInInlineMetaskills(text);

            // Second step: Apply additional formatting rules
            const formattedText = formatMythicScript(modifiedText);

            // Replace entire document with the newly formatted text
            const fullRange = new vscode.Range(
                new vscode.Position(0, 0),
                document.lineAt(document.lineCount - 1).range.end,
            );

            textEdits.push(vscode.TextEdit.replace(fullRange, formattedText));

            return textEdits;
        },
    });
}

function addNewlinesInInlineMetaskills(text: string): string {
    const INDENTATION_LEVEL = getDefaultIndentation();
    const USED_INDENTATION = getUsedIndentation(text);

    const uuid = Math.random().toString(36).substring(2);
    const placeholder = `/*MYTHICSCRIBE_COMMENT_${uuid}*/`;

    let comments: string[] = [];

    // Preserve the comments by replacing them temporarily with a placeholder
    const textWithPlaceholders = text.replace(placeholder, '').replace(/#.*?(?=\n)/g, (match) => {
        comments.push(match); // Store the comment
        return placeholder; // Replace the comment so it doesn't fuck up later on
    });

    // Process the text with all the cool replacements
    const formattedText = textWithPlaceholders
        .replace(/^([^\S\r\n]*)([\w_\-\d]+):/gm, (_match, p1, p2) => {
            const indent = Math.floor(p1.length / USED_INDENTATION);
            const affix = '' + ' '.repeat(indent * INDENTATION_LEVEL);
            return `${affix}${p2}:`;
        })
        .replace(/(?<=[;{])\s*([^\s;{]*)=\s*\[\s*/gm, '\n$1=\[\n')
        .replace(/(?<=[^"])\s*\]\s*([;}])/gm, '\n]$1');
    comments.reverse(); // Reverse the comments to restore them in the order they were added
    return formattedText.replaceAll(placeholder, (_match) => {
        return comments.pop() || ''; // Restore the comments by replacing the placeholder
    });
}

function formatMythicScript(text: string): string {
    const INDENTATION_LEVEL = getDefaultIndentation();
    let lastKeyIndent = 0;
    let insideInline = 0;
    const lines = text.split('\n');
    const newLines: string[] = [];

    lines.forEach((line) => {
        // Positive --> too many open square brackets
        // Negative --> too many close square brackets
        // Will be effective from next line
        const squareBracketsBalance =
            (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
        const curlyBracketsBalance =
            (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

        const pre_squarebracketindent = squareBracketsBalance < 0 ? squareBracketsBalance : 0;
        //const pre_curlybracketindent = curlyBracketsBalance < 0 ? curlyBracketsBalance : 0;
        const post_bracketindent =
            squareBracketsBalance + curlyBracketsBalance * 2 - pre_squarebracketindent;

        lastKeyIndent += pre_squarebracketindent;

        const lineIndentation = line.indexOf(line.trim()) / INDENTATION_LEVEL;
        if (line.replace(/#.*$/gm, '').trim().endsWith(':')) {
            lastKeyIndent = lineIndentation;
        }

        let formattedText = line;

        // Step 1: Trim trailing whitespace
        formattedText = formattedText.trimEnd();

        // Step 2: Fix indentation for YAML-like arrays under specific keys
        if (formattedText.match(/^\s*-\s/) || insideInline !== 0) {
            if (lineIndentation !== lastKeyIndent) {
                formattedText =
                    ' '.repeat(lastKeyIndent * INDENTATION_LEVEL) + formattedText.trim();
            }
        }

        lastKeyIndent += post_bracketindent;
        insideInline += squareBracketsBalance + curlyBracketsBalance;

        newLines.push(formattedText);
    });

    return newLines.join('\n');
}
