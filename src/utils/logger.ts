import * as vscode from 'vscode';

export function logError(error: unknown, message: string = 'An error occurred') {
    if (error instanceof Error) {
        vscode.window.showErrorMessage(message, error.message);
    } else {
        vscode.window.showErrorMessage(message, String(error));
    }
}
