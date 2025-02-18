import * as vscode from 'vscode';

/**
 * Logs an error message to the Visual Studio Code error message window.
 *
 * @param error - The error object or value to log. If it's an instance of `Error`, its message will be included.
 * @param message - An optional custom message to display before the error message. Defaults to 'An error occurred'.
 */
export function logError(error: unknown, message: string = 'An error occurred: ') {
    if (error instanceof Error) {
        vscode.window.showErrorMessage(message + error.message);
    } else {
        vscode.window.showErrorMessage(message, String(error));
    }
}

/**
 * Displays an informational message to the user.
 *
 * @param message - The message to be displayed.
 */
export function logInfo(message: string) {
    vscode.window.showInformationMessage(message);
}

/**
 * Displays an information message with selectable options.
 *
 * @param message - The message to display.
 * @param options - An object where keys are the option labels and values are the corresponding URLs.
 *
 * The function shows an information message with the provided options. When an option is selected,
 * it opens the corresponding URL in the default web browser.
 */
export async function showInfoMessageWithOptions(
    message: string,
    options: { [key: string]: string }
) {
    const optionKeys = Object.keys(options);
    return vscode.window.showInformationMessage(message, ...optionKeys).then((selected) => {
        if (selected) {
            return vscode.env.openExternal(vscode.Uri.parse(options[selected]));
        }
        return undefined;
    });
}
