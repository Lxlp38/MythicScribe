import * as vscode from 'vscode';
import { LogLevel } from 'vscode';

import { addConfigChangeFunction, getLogLevel } from './configutils';

type logOptions = {
    silent?: boolean;
};

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel;

    constructor(outputChannelName: string, defaultLogLevel: LogLevel = LogLevel.Info) {
        this.outputChannel = vscode.window.createOutputChannel(outputChannelName, 'log');
        this.logLevel = defaultLogLevel;
        addConfigChangeFunction(this.updateLogLevel.bind(this));
        this.debug('Logger initialized with a default log level of', LogLevel[defaultLogLevel]);
    }

    setLogLevel(logLevel: LogLevel): void {
        this.logLevel = logLevel;
    }

    updateLogLevel(): void {
        this.debug('Log level update has been called');
        const logLevel = getLogLevel();
        if (logLevel !== undefined) {
            this.debug(
                `Updating log level from`,
                LogLevel[this.logLevel],
                'to',
                LogLevel[logLevel]
            );
            this.setLogLevel(logLevel);
        }
    }

    log(message: string, level: LogLevel = LogLevel.Info, type?: string): void {
        if (level >= this.logLevel) {
            const timestamp = new Date().toISOString();
            const levelString = type ?? LogLevel[level];
            this.outputChannel.appendLine(`${timestamp} [${levelString}] ${message}`);
        }
    }

    trace(...message: string[]): void {
        for (const msg of message) {
            this.log(msg, LogLevel.Trace);
        }
    }

    debug(...message: string[]): void {
        this.log(message.join(' '), LogLevel.Debug);
    }

    info(message: string, options: logOptions = {}): void {
        this.log(message, LogLevel.Info);
        if (options.silent) {
            return;
        }
        vscode.window.showInformationMessage(message);
    }

    warn(message: string, options: logOptions = {}): void {
        this.log(message, LogLevel.Warning);
        if (options.silent) {
            return;
        }
        vscode.window.showWarningMessage(message);
    }

    error(error: unknown, message: string = 'An error occurred:', options: logOptions = {}): void {
        let finalMessage: string;
        if (error instanceof Error) {
            finalMessage = message + '\n' + error.message + '\n' + error.stack;
            this.processError(message, error);
        } else {
            finalMessage = message + '\n' + String(error);
            this.processError(finalMessage);
        }
        if (options.silent) {
            return;
        }
        vscode.window.showErrorMessage(finalMessage);
    }

    private processError(message: string, error?: Error) {
        this.log(message, LogLevel.Error);
        if (!error) {
            return;
        }
        this.log(error.message, LogLevel.Error);
        if (error.stack) {
            this.log(error.stack, LogLevel.Error);
        }
    }

    show(): void {
        this.outputChannel.show();
    }
}

const Log = new Logger('MythicScribe', getLogLevel() || LogLevel.Debug);
export default Log;

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
    Log.show();
}

type InfoMessageType = 'external' | 'command';
type InfoMessageOptions = {
    [key: string]: {
        type: InfoMessageType;
        target: string;
        action?: string;
    };
};

/**
 * Displays an information message with selectable options.
 *
 * @param message - The message to display.
 * @param options - An object where keys are the option labels and values are the corresponding URLs.
 *
 * The function shows an information message with the provided options. When an option is selected,
 * it opens the corresponding URL in the default web browser.
 */
export async function showInfoMessageWithOptions(message: string, options: InfoMessageOptions) {
    Log.debug(message);
    const optionKeys = Object.keys(options);
    return vscode.window.showInformationMessage(message, ...optionKeys).then((selected) => {
        if (selected) {
            const sel = options[selected];
            switch (sel.type) {
                case 'external':
                    Log.debug(`Opened ${sel.target}`);
                    return vscode.env.openExternal(vscode.Uri.parse(sel.target));
                case 'command':
                    Log.debug(`Executed command: ${sel.target}`);
                    return vscode.commands.executeCommand(sel.target, sel.action);
            }
        }
        return undefined;
    });
}
