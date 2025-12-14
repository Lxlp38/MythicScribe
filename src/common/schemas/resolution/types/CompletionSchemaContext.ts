import * as vscode from 'vscode';

// --- Context & Interfaces ---

export type CompletionSchemaContext = {
    document?: vscode.TextDocument;
    position?: vscode.Position;
    context?: vscode.CompletionContext;
    suffix?: string;
    command?: vscode.Command;
    textExtractor?: (text: string) => string;
};
