import * as vscode from 'vscode';

export const logs: string[] = [];

export enum LogType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

const virtualLogsUri = vscode.Uri.parse('mythicscribelogs:/Logs.log');
let updateTimeout: NodeJS.Timeout;
export let isLogFileOpen = false;

/**
 * Logs a message with metadata including a timestamp and log type.
 *
 * @param message - The message to log.
 * @param type - The type of log message. Defaults to `LogType.DEBUG`.
 */
export function logMetadata(message: string, type: LogType = LogType.DEBUG) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${type}: ${message}`;
    logs.push(formattedMessage);
    if (!isLogFileOpen) {
        return;
    }
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        logsProvider.update(vscode.Uri.parse('mythicscribelogs:/Logs.log'));
    }, 500);
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
    logsProvider.update(virtualLogsUri);
    vscode.window.showTextDocument(virtualLogsUri, { preview: false }).then(() => {
        isLogFileOpen = true;
        return;
    });
}

class LogsProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    onDidChange?: vscode.Event<vscode.Uri> = this._onDidChange.event;

    provideTextDocumentContent(): vscode.ProviderResult<string> {
        return logs.join('\n');
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }
}
export const logsProvider = new LogsProvider();

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
    logMetadata(finalMessage, LogType.ERROR);
}

/**
 * Displays a warning message to the user.
 *
 * @param message - The warning message to be displayed.
 */
export function logWarning(message: string) {
    logMetadata(message, LogType.WARNING);
    vscode.window.showWarningMessage(message);
}

/**
 * Displays an informational message to the user.
 *
 * @param message - The message to be displayed.
 */
export function logInfo(message: string) {
    logMetadata(message, LogType.INFO);
    vscode.window.showInformationMessage(message);
}

export function logDebug(...message: string[]) {
    logMetadata(message.join(' '), LogType.DEBUG);
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
    logMetadata(message, LogType.DEBUG);
    const optionKeys = Object.keys(options);
    return vscode.window.showInformationMessage(message, ...optionKeys).then((selected) => {
        if (selected) {
            logMetadata(`Opened ${options[selected]}`, LogType.DEBUG);
            return vscode.env.openExternal(vscode.Uri.parse(options[selected]));
        }
        return undefined;
    });
}
