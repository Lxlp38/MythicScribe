import * as vscode from 'vscode';

import { getDefaultIndentation, getUsedIndentation } from '../utils/yamlutils';

export function getFormatter() {
    return vscode.languages.registerDocumentFormattingEditProvider('mythicscript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const textEdits: vscode.TextEdit[] = [];
            const text = document.getText();

            // Tokenize comments
            const [textWithPlaceholders, comments] = tokenizeComments(text);

            // Add newlines in inline metaskills
            const textWithNewlines = addNewlinesInInlineMetaskills(textWithPlaceholders);

            // Apply additional formatting rules
            const formattedText = formatMythicScript(textWithNewlines);

            // Restore comments
            const textWithRestoredComments = restoreComments(formattedText, comments);

            // Replace entire document with the newly formatted text
            const fullRange = document.validateRange(new vscode.Range(0, 0, document.lineCount, 0));

            textEdits.push(vscode.TextEdit.replace(fullRange, textWithRestoredComments));

            return textEdits;
        },
    });
}

const placeholder = `/*__MYTHICSCRIBE_COMMENT__*/`;
function tokenizeComments(text: string): [string, string[]] {
    const comments: string[] = [];

    // Preserve the comments by replacing them temporarily with a placeholder
    const textWithPlaceholders = text.replace(/#.*?(?=\n|$)/g, (match) => {
        comments.push(match); // Store the comment
        return placeholder; // Replace the comment so it doesn't fuck up later on
    });

    return [textWithPlaceholders, comments];
}

function restoreComments(text: string, comments: string[]): string {
    comments.reverse();
    return text.replaceAll(placeholder, () => comments.pop() || '');
}

function addNewlinesInInlineMetaskills(text: string): string {
    const INDENTATION_LEVEL = getDefaultIndentation();
    const USED_INDENTATION = getUsedIndentation(text);

    // Process the text with all the cool replacements
    const formattedText = text
        .replace(/^([^\S\r\n]*)([\w_\-]+):/gm, (_match, p1, p2) => {
            const indent = Math.floor(p1.length / USED_INDENTATION);
            const affix = '' + ' '.repeat(indent * INDENTATION_LEVEL);
            return `${affix}${p2}:`;
        })
        .replace(/(?<=[;{])\s*([^\s;{]*)=\s*\[\s*/gm, '\n$1=\[\n')
        .replace(/(?<=[^"])\s*\]\s*([;}])/gm, '\n]$1');
    return formattedText;
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
