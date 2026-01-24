import * as vscode from 'vscode';
import { LogLevel } from '@common/packageData';

import { CallbackProvider } from './callbackProvider';

type logOptions = {
    silent?: boolean;
};

const LogLevelAssociation: Record<LogLevel, vscode.LogLevel> = {
    error: vscode.LogLevel.Error,
    warn: vscode.LogLevel.Warning,
    info: vscode.LogLevel.Info,
    debug: vscode.LogLevel.Debug,
    trace: vscode.LogLevel.Trace,
} as const;

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: vscode.LogLevel;
    private configCallbackProvider?: CallbackProvider<'configChange'>;
    private getScribeLogLevel: () => LogLevel | undefined = () => 'trace';

    constructor(outputChannelName: string, defaultLogLevel: vscode.LogLevel = this.getLogLevel()) {
        this.outputChannel = vscode.window.createOutputChannel(outputChannelName, 'log');
        this.logLevel = defaultLogLevel;
        this.debug(
            'Logger initialized with a default log level of',
            vscode.LogLevel[defaultLogLevel]
        );
    }

    addConfigCallbackProvider(callbackProvider: CallbackProvider<'configChange'>) {
        this.configCallbackProvider = callbackProvider;
        this.configCallbackProvider.registerCallback(
            'configChange',
            this.updateLogLevel.bind(this)
        );
    }

    addScribeLogLevelProvider(getLogLevel: () => LogLevel | undefined) {
        this.getScribeLogLevel = getLogLevel;
    }

    setLogLevel(logLevel: vscode.LogLevel): void {
        this.logLevel = logLevel;
    }

    updateLogLevel(): void {
        const logLevel = this.getLogLevel();
        this.debug('Log level update has been called');
        this.debug(
            `Updating log level from`,
            vscode.LogLevel[this.logLevel],
            'to',
            vscode.LogLevel[logLevel]
        );
        this.setLogLevel(logLevel);
    }

    log(message: string, level: vscode.LogLevel = vscode.LogLevel.Info, type?: string): void {
        if (level >= this.logLevel) {
            const timestamp = new Date().toISOString();
            const levelString = type ?? vscode.LogLevel[level];
            this.outputChannel.appendLine(`${timestamp} [${levelString}] ${message}`);
        }
    }

    trace(...message: string[]): void {
        for (const msg of message) {
            this.log(msg, vscode.LogLevel.Trace);
        }
    }

    debug(...message: string[]): void {
        this.log(message.join(' '), vscode.LogLevel.Debug);
    }

    info(message: string, options: logOptions = {}): void {
        this.log(message, vscode.LogLevel.Info);
        if (options.silent) {
            return;
        }
        vscode.window.showInformationMessage(message);
    }

    async options(
        message: string,
        options: InfoMessageOptions,
        func: (message: string, ...items: string[]) => Thenable<undefined | string> = vscode.window
            .showInformationMessage
    ) {
        this.debug(message);
        const optionKeys = Object.keys(options);
        return func(message, ...optionKeys).then((selected) => {
            if (selected) {
                const sel = options[selected];
                switch (sel.type) {
                    case 'external':
                        this.debug(`Opened ${sel.target}`);
                        return vscode.env.openExternal(vscode.Uri.parse(sel.target));
                    case 'command':
                        this.debug(`Executed command: ${sel.target} with action: ${sel.action}`);
                        return vscode.commands.executeCommand(sel.target, sel.action);
                }
            }
            return undefined;
        });
    }

    warn(message: string, options: logOptions = {}): void {
        this.log(message, vscode.LogLevel.Warning);
        if (options.silent) {
            return;
        }
        vscode.window.showWarningMessage(message);
    }

    error(error: unknown, message: string = 'An error occurred:', options: logOptions = {}): void {
        message = message.trim();
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
        this.options(
            message,
            {
                'Check the logs for more details': {
                    type: 'command',
                    target: 'MythicScribe.openLogs',
                },
            },
            vscode.window.showErrorMessage
        );
    }

    private processError(message: string, error?: Error) {
        const errorMap = {
            message: message,
            errorMessage: error?.message,
            stack: error?.stack,
        };
        this.log(JSON.stringify(errorMap, null, 2), vscode.LogLevel.Error);
    }

    show(): void {
        this.outputChannel.show();
    }

    getLogLevel() {
        const returnValue = this.getScribeLogLevel();
        if (returnValue) {
            return LogLevelAssociation[returnValue as LogLevel] || vscode.LogLevel.Trace;
        }
        return vscode.LogLevel.Trace;
    }
}

const Loggers = {
    MythicScribe: undefined as Logger | undefined,
};

export function getLogger(loggerKey: keyof typeof Loggers = 'MythicScribe'): Logger {
    if (!Loggers[loggerKey]) {
        Loggers[loggerKey] = new Logger(loggerKey);
    }
    return Loggers[loggerKey];
}

/**
 * Opens and displays the log output using the application's logger.
 *
 * This function calls the `show` method on the logger instance,
 * making the logs visible to the user. Useful for debugging or
 * monitoring application events.
 *
 * @public
 */
export function openLogs() {
    getLogger().show();
}

type InfoMessageOptions = {
    [key: string]: {
        type: 'external' | 'command';
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
 * @deprecated Use Logger.options method instead.
 */
export async function showInfoMessageWithOptions(message: string, options: InfoMessageOptions) {
    return getLogger().options(message, options);
}
