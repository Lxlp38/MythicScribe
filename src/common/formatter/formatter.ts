import * as vscode from 'vscode';
import { parseDocument } from 'yaml';

import {
    getDefaultIndentation,
    getDocumentSearchList,
    getLastNonCommentLine,
    YamlKeyPairList,
} from '../utils/yamlutils';
import Log from '../utils/logger';
import { FileObjectTypes } from '../objectInfos';

type Comment = {
    text: string;
    indent: number;
};

type FormatterParameters = {
    text: string;
    document: vscode.TextDocument;
    comments: Comment[];
    quoted: string[];
};

export function getFormatter() {
    return vscode.languages.registerDocumentFormattingEditProvider('mythicscript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            let text = document.getText();
            const comments: Comment[] = [];
            const quoted: string[] = [];

            for (const op of [
                // Tokenize comments
                tokenizeComments,

                // Tokenize quoted strings
                tokenizeQuoted,

                // Format YAML file
                normalizeYamlIndentation,

                // Add newlines in inline metaskills
                addNewLinesInInlineMetaskills,

                // Apply additional formatting rules
                formatMythicScript,

                // Restore quoted strings
                restoreQuoted,

                // Restore comments
                restoreComments,
            ]) {
                text = op({ text, document, comments, quoted });
            }

            // Replace entire document with the newly formatted text
            const fullRange = document.validateRange(new vscode.Range(0, 0, document.lineCount, 0));

            return [vscode.TextEdit.replace(fullRange, text)];
        },
    });
}

const placeholder = `#__MYTHICSCRIBE_COMMENT_START__`;
const placeholderRegex = /(\s+|^)(#.*?)$/gm;
function tokenizeComments(par: FormatterParameters): string {
    const lines = par.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(placeholderRegex);
        if (!match) {
            continue;
        }
        const indent = match[0].indexOf('#');
        par.comments.push({ text: match[0], indent });
        lines[i] = line.replace(placeholderRegex, ' ' + placeholder);
    }
    return lines.join('\n');
}

function restoreComments(par: FormatterParameters): string {
    const yamlTree = getDocumentSearchList(par.text, par.document);
    const lastNonCommentedLine = getLastNonCommentLine(par.text);
    const lines = par.text.split('\n');

    for (let i = 0; i < lastNonCommentedLine; i++) {
        restoreMainComments(lines, i, yamlTree, par.comments);
    }
    for (let i = lastNonCommentedLine; i < lines.length; i++) {
        if (!lines[i].match(placeholder)) {
            continue;
        }
        lines[i] = lines[i].replace(' ' + placeholder, par.comments.shift()?.text || '');
    }
    return lines.join('\n');
}

function restoreMainComments(
    lines: string[],
    i: number,
    yamlTree: YamlKeyPairList,
    comments: Comment[]
): void {
    if (!lines[i].match(placeholder)) {
        return;
    }

    // Pick The Comment That Is Gonna Be Used
    const comment = comments.shift();
    if (!comment) {
        Log.warn('No comment to restore', { silent: true });
        return;
    }

    // Check for Whole Line Comment
    const match = lines[i].match(/^(\s*)#__MYTHICSCRIBE_COMMENT_START__/);

    // Process Inline Comment
    if (!match) {
        lines[i] = lines[i].replace(' ' + placeholder, comment.text);
        return;
    }

    const indent = match[0].indexOf('#') - 1;

    // If the original comment had no indent, so should this one
    if (comment.indent === 0) {
        lines[i] = lines[i].replace(generateIndent(indent), '');
        lines[i] = lines[i].replace(' ' + placeholder, comment.text.trim());
        return;
    }

    try {
        // Otherwise, let's see what happens here
        const relatedNode = yamlTree.getBoundKey(i);
        if (relatedNode) {
            let relatedNodeIndent = relatedNode.yamlKey.indent;
            const type = relatedNode.fileObject?.type;
            if (type && type in [FileObjectTypes.LIST, FileObjectTypes.KEY_LIST]) {
                relatedNodeIndent += getDefaultIndentation();
            }
            if (indent !== relatedNodeIndent) {
                const adjustedIndent = generateIndent(relatedNodeIndent);
                lines[i] = lines[i].replace(generateIndent(indent), adjustedIndent);
            }
        }
    } catch (error) {
        Log.error(error);
    }
    lines[i] = lines[i].replace(' ' + placeholder, comment.text.trim());
}

function generateIndent(input: number): string {
    if (input < 0) {
        return '';
    }
    return ' '.repeat(input);
}

const quotePlaceholder = `"__MYTHICSCRIBE_QUOTED_STRING__"`;
const quotedRegex = /(['"`]).*?\1/gms;
function tokenizeQuoted(par: FormatterParameters): string {
    return par.text.replaceAll(quotedRegex, (match) => {
        par.quoted.push(match);
        return quotePlaceholder;
    });
}

function restoreQuoted(par: FormatterParameters): string {
    return par.text.replaceAll(quotePlaceholder, () => {
        return par.quoted.shift() || '';
    });
}

function normalizeYamlIndentation(par: FormatterParameters): string {
    try {
        const doc = parseDocument(par.text, {
            keepSourceTokens: true,
            toStringDefaults: {
                doubleQuotedMinMultiLineLength: 99999,
                lineWidth: 0,
                minContentWidth: 0,
                indent: getDefaultIndentation(),
            },
            schema: 'failsafe',
        });
        if (doc.errors) {
            doc.errors.forEach((error) => {
                Log.error(error.message, error.name);
                Log.debug(`Formatter error: ${error.code} ${error.name} ${error.message}`);
                if (error.stack) {
                    Log.trace(error.stack);
                }
            });
        }
        return doc.toString();
    } catch (error) {
        Log.error(error, undefined, { silent: true });
    }
    return par.text;
}

function addNewLinesInInlineMetaskills(par: FormatterParameters): string {
    // Process the text with all the cool replacements
    const formattedText = par.text
        .replace(/(?<=[;{])\s*([^\s;{]*)=\s*\[\s*/gm, '\n$1=\[\n') // Add newline before a new inline mechanic
        .replace(/(?<=[^"])\s*\]\s*([;}])/gm, '\n]$1') // Add newline after a closing inline mechanic
        .replace(/((?!\s*-\s).*?)(-\s[\w:\-]+[{\s}])/gm, '$1\n$2') // Add newline before a new inline mechanic
        .replace(/([{;]) ([\w\-_]+)=/gm, '$1\n$2=') // Add newline before a new spaced attribute
        .replace(
            /(?<=[{;])\s*([\w\-_]+)=(\s)([\w\-_]+,)(.*)(\s)([\w\-_]+\s*)(?=[};])/gm,
            (match) => {
                return match.replace(/, /g, ',\n').replace(/= /g, '=\n');
            }
        ) // Add newline for spaced lists
        .replace(/ (?=[;}])/g, '\n') // Add inline for spaced termination character
        .replace(/;(?=}\s)/, ''); // Remove semicolon before closing bracket
    return formattedText;
}

function formatMythicScript(par: FormatterParameters): string {
    const INDENTATION_LEVEL = getDefaultIndentation();
    let lastKeyIndent = 0;
    let insideInline = 0;
    const lines = par.text.split('\n');
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
        if (line.replaceAll(placeholder, '').trim().endsWith(':')) {
            lastKeyIndent = lineIndentation;
        }

        let formattedText = line;

        // Trim trailing whitespace
        formattedText = formattedText.trimEnd();

        // Remove spaces from empty lines
        if (formattedText.trim() === '') {
            formattedText = '';
        }

        // Fix indentation for YAML-like arrays under specific keys
        else if (formattedText.match(/^\s*-\s/) || insideInline !== 0) {
            if (lineIndentation !== lastKeyIndent) {
                formattedText =
                    generateIndent(lastKeyIndent * INDENTATION_LEVEL) + formattedText.trim();
            }
        }

        lastKeyIndent += post_bracketindent;
        insideInline += squareBracketsBalance + curlyBracketsBalance;

        newLines.push(formattedText);
    });

    return newLines.join('\n');
}
