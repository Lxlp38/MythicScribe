import * as vscode from 'vscode';

export function logError(error: unknown, message: string = 'An error occurred') {
    if (error instanceof Error) {
        vscode.window.showErrorMessage(message + error.message);
    } else {
        vscode.window.showErrorMessage(message, String(error));
    }
}

export function logInfo(message: string) {
    vscode.window.showInformationMessage(message);
}

export function showInfoMessageWithOptions(message: string, options: { [key: string]: string }) {
    vscode.window.showInformationMessage(message, ...Object.keys(options)).then((selection) => {
        if (selection && options[selection]) {
            vscode.env.openExternal(vscode.Uri.parse(options[selection]));
        }
        return;
    });
}
