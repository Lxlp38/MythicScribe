import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { LogLevel } from 'vscode';

import { Logger } from '../../../src/common/providers/loggerProvider';

suite('Logger', () => {
    let logger: Logger;
    let outputChannel: vscode.OutputChannel;
    let showInformationMessageStub: sinon.SinonStub;
    let showWarningMessageStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let appendLineStub: sinon.SinonStub;

    setup(() => {
        outputChannel = {
            appendLine: () => {},
            show: () => {},
            clear: () => {},
            dispose: () => {},
            name: 'Test Logs',
            append: () => {},
            replace: () => {},
            hide: () => {},
        };

        appendLineStub = sinon.stub(outputChannel, 'appendLine');

        showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
        showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
        showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');

        logger = new Logger('Test Logs', LogLevel.Trace);
        logger['outputChannel'] = outputChannel;
    });

    teardown(() => {
        sinon.restore();
    });

    suite('log', () => {
        test('should log a message with the correct format', () => {
            const message = 'Test log message';
            logger.log(message, LogLevel.Info);

            sinon.assert.calledOnce(appendLineStub);
            const loggedMessage = appendLineStub.firstCall.args[0];
            sinon.assert.match(
                loggedMessage,
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[Info\] Test log message$/
            );
        });

        test('should not log if the message level is below the log level', () => {
            logger.setLogLevel(LogLevel.Warning);
            logger.log('Test log message', LogLevel.Info);

            sinon.assert.notCalled(appendLineStub);
        });
    });

    suite('debug', () => {
        test('should log a debug message', () => {
            logger.debug('Test debug message');
            sinon.assert.calledOnce(appendLineStub);
            const loggedMessage = appendLineStub.firstCall.args[0];
            sinon.assert.match(
                loggedMessage,
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[Debug\] Test debug message$/
            );
        });

        test('should log a debug message with multiple arguments', () => {
            logger.debug('Test', 'debug', 'message');
            sinon.assert.calledOnce(appendLineStub);
            const loggedMessage = appendLineStub.firstCall.args[0];
            sinon.assert.match(
                loggedMessage,
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[Debug\] Test debug message$/
            );
        });
    });

    suite('info', () => {
        test('should log an info message and show an information message', () => {
            const message = 'Test info message';
            logger.info(message);

            sinon.assert.calledOnce(appendLineStub);
            sinon.assert.calledOnce(showInformationMessageStub);
            sinon.assert.calledWith(showInformationMessageStub, message);
        });
    });

    suite('warn', () => {
        test('should log a warning message and show a warning message', () => {
            const message = 'Test warning message';
            logger.warn(message);

            sinon.assert.calledOnce(appendLineStub);
            sinon.assert.calledOnce(showWarningMessageStub);
            sinon.assert.calledWith(showWarningMessageStub, message);
        });
    });

    suite('error', () => {
        test('should log an error message and show an error message for Error objects', () => {
            const error = new Error('Test error');
            const message = 'Test error message';
            logger.error(error, message);

            sinon.assert.calledThrice(appendLineStub); // Called for message, error.message, and error.stack
            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(
                showErrorMessageStub,
                `${message}\n${error.message}\n${error.stack}`
            );
        });

        test('should log an error message and show an error message for non-Error objects', () => {
            const error = 'Test error string';
            const message = 'Test error message';
            logger.error(error, message);

            sinon.assert.calledOnce(appendLineStub);
            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, `${message}\n${error}`);
        });
    });

    suite('show', () => {
        test('should show the output channel', () => {
            const showStub = sinon.stub(outputChannel, 'show');
            logger.show();
            sinon.assert.calledOnce(showStub);
        });
    });
});
