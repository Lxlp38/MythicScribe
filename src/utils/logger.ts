import * as vscode from 'vscode';
import { LogLevel } from 'vscode';

const logChannel: vscode.LogOutputChannel = vscode.window.createOutputChannel(
    'Mythic Scribe Logs',
    {
        log: true,
    }
);

export const logFunction = [
    () => {},
    logChannel.append.bind(logChannel),
    logChannel.debug.bind(logChannel),
    logChannel.info.bind(logChannel),
    logChannel.warn.bind(logChannel),
    logChannel.error.bind(logChannel),
];

/**
 * Logs a message with metadata including a timestamp and log level.
 *
 * @param message - The message to log.
 * @param type - The log level of the message. Defaults to `LogLevel.Trace`.
 */
export function logMetadata(message: string, type: LogLevel = LogLevel.Trace) {
    logFunction[type](message);
}

/**
 * Opens the logs by updating the logs provider and displaying the logs in a text document.
 *
 * This function updates the logs provider with the virtual logs URI and then opens the logs
 * in a new text document within the VSCode editor. The document is opened in non-preview mode.
 * Once the document is opened, it sets the `isLogFileOpen` flag to true.
 *
 * @returns {Promise<void>} A promise that resolves when the logs are opened.
 */
export async function openLogs(): Promise<void> {
    logChannel.show();
}
/**
 * Logs an error message to the Visual Studio Code error message window.
 *
 * @param error - The error object or value to log. If it's an instance of `Error`, its message will be included.
 * @param message - An optional custom message to display before the error message. Defaults to 'An error occurred'.
 */
export function logError(error: unknown, message: string = 'An error occurred:') {
    let finalMessage: string;
    if (error instanceof Error) {
        finalMessage = message + '\n' + error.message + '\n' + error.stack;
    } else {
        finalMessage = message + '\n' + String(error);
    }
    vscode.window.showErrorMessage(finalMessage);
    logMetadata(finalMessage, LogLevel.Error);
}

/**
 * Displays a warning message to the user.
 *
 * @param message - The warning message to be displayed.
 */
export function logWarning(message: string) {
    logMetadata(message, LogLevel.Warning);
    vscode.window.showWarningMessage(message);
}

/**
 * Displays an informational message to the user.
 *
 * @param message - The message to be displayed.
 */
export function logInfo(message: string) {
    logMetadata(message, LogLevel.Info);
    vscode.window.showInformationMessage(message);
}

export function logDebug(...message: string[]) {
    logMetadata(message.join(' '), LogLevel.Debug);
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
    logMetadata(message, LogLevel.Info);
    const optionKeys = Object.keys(options);
    return vscode.window.showInformationMessage(message, ...optionKeys).then((selected) => {
        if (selected) {
            logMetadata(`Opened ${options[selected]}`, LogLevel.Info);
            return vscode.env.openExternal(vscode.Uri.parse(options[selected]));
        }
        return undefined;
    });
}
