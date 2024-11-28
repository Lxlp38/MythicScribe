import * as vscode from 'vscode';
import { getDefaultIndentation } from '../utils/yamlutils';

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
              document.lineAt(document.lineCount - 1).range.end
            );
    
            textEdits.push(vscode.TextEdit.replace(fullRange, formattedText));
    
            return textEdits;    
        }
    });
}

function addNewlinesInInlineMetaskills(text: string): string {
    return text.replace(/\[\s*(?=\S)/g, '[\n').replace(/(?<=\S)\s*\]/g, '\n]');
}

function formatMythicScript(text: string): string {
    const INDENTATION_LEVEL = getDefaultIndentation();
    let lastKeyIndent = 0;
    let insideInline = 0;
    const lines = text.split('\n');
    const newLines: string[] = [];

    lines.forEach((line) => {
        console.log(line);
        // Positive --> too many open square brackets
        // Negative --> too many close square brackets
        // Will be effective from next line
        const squareBracketsBalance = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
        const curlyBracketsBalance = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        const pre_bracketindent = squareBracketsBalance < 0 ? squareBracketsBalance : 0;
        const post_bracketindent = squareBracketsBalance + curlyBracketsBalance - pre_bracketindent;
        lastKeyIndent += pre_bracketindent;
        const lineIndentation = line.indexOf(line.trim()) / INDENTATION_LEVEL;
        if (line.trim().endsWith(":")) {
            lastKeyIndent = lineIndentation;
        }

        let formattedText = line;

        // Step 1: Trim trailing whitespace
        formattedText = formattedText.trimEnd();

        // Step 2: Fix indentation for YAML-like arrays under specific keys
        if (formattedText.match(/^\s*-\s/) || insideInline !== 0) {
            if (lineIndentation !== lastKeyIndent) {
                formattedText = " ".repeat(lastKeyIndent * INDENTATION_LEVEL) + formattedText.trim();
            }
        }

        lastKeyIndent += post_bracketindent;
        insideInline += squareBracketsBalance + curlyBracketsBalance;

        newLines.push(formattedText);
    });

    return newLines.join('\n');

}