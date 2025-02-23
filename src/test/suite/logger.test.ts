import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { LogLevel } from 'vscode';

import * as logger from '../../utils/logger';

suite('Logger', () => {
    suite('logError', () => {
        let showErrorMessageStub: sinon.SinonStub;

        setup(() => {
            showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        });

        teardown(() => {
            showErrorMessageStub.restore();
        });

        test('should log error message with default message', () => {
            const error = new Error('Test error');
            logger.logError(error);

            const expectedMessage = `An error occurred:\n${error.message}\n${error.stack}`;

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, expectedMessage);
        });

        test('should log error message with custom message', () => {
            const error = new Error('Test error');
            const customMessage = 'Custom error message';
            logger.logError(error, customMessage);

            const expectedMessage = `${customMessage}\n${error.message}\n${error.stack}`;

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, expectedMessage);
        });

        test('should log non-error object', () => {
            const error = 'Test string error';
            logger.logError(error);

            const expectedMessage = `An error occurred:\n${error}`;

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, expectedMessage);
        });
    });

    suite('logInfo', () => {
        let showInformationMessageStub: sinon.SinonStub;

        setup(() => {
            showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
        });

        teardown(() => {
            showInformationMessageStub.restore();
        });

        test('should log informational message', () => {
            const message = 'Test info message';
            logger.logInfo(message);

            sinon.assert.calledOnce(showInformationMessageStub);
            sinon.assert.calledWith(showInformationMessageStub, message);
        });
    });

    suite('showInfoMessageWithOptions', () => {
        let showInformationMessageStub: sinon.SinonStub;
        let openExternalStub: sinon.SinonStub;

        setup(() => {
            showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
            openExternalStub = sinon.stub(vscode.env, 'openExternal');
        });

        teardown(() => {
            showInformationMessageStub.restore();
            openExternalStub.restore();
        });

        test('should display information message with options', () => {
            const message = 'Test message';
            const options = { Option1: 'https://example.com/1', Option2: 'https://example.com/2' };

            logger.showInfoMessageWithOptions(message, options);

            sinon.assert.calledOnce(showInformationMessageStub);
            sinon.assert.calledWith(showInformationMessageStub, message, 'Option1', 'Option2');
        });

        test('should open URL when an option is selected', async () => {
            const message = 'Test message';
            const options = { Option1: 'https://example.com/1', Option2: 'https://example.com/2' };

            showInformationMessageStub.resolves('Option1');

            await logger.showInfoMessageWithOptions(message, options);

            sinon.assert.calledOnce(openExternalStub);
            sinon.assert.calledWith(openExternalStub, vscode.Uri.parse('https://example.com/1'));
        });

        test('should not open URL when no option is selected', async () => {
            const message = 'Test message';
            const options = { Option1: 'https://example.com/1', Option2: 'https://example.com/2' };

            showInformationMessageStub.resolves(undefined);

            await logger.showInfoMessageWithOptions(message, options);

            sinon.assert.notCalled(openExternalStub);
        });
    });
    suite('logMetadata', () => {
        let logChannel: vscode.LogOutputChannel;
        let appendStub: sinon.SinonStub;
        let debugStub: sinon.SinonStub;
        let infoStub: sinon.SinonStub;
        let warnStub: sinon.SinonStub;
        let errorStub: sinon.SinonStub;

        setup(() => {
            // Create a mock LogOutputChannel
            logChannel = {
                append: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                trace: () => {},
                show: () => {},
                clear: () => {},
                dispose: () => {},
                name: 'Mythic Scribe Logs',
                logLevel: LogLevel.Trace,
                onDidChangeLogLevel: new vscode.EventEmitter<LogLevel>().event,
                hide: () => {},
                appendLine: () => {},
                replace: () => {},
            };

            // Stub the methods
            appendStub = sinon.stub(logChannel, 'append');
            debugStub = sinon.stub(logChannel, 'debug');
            infoStub = sinon.stub(logChannel, 'info');
            warnStub = sinon.stub(logChannel, 'warn');
            errorStub = sinon.stub(logChannel, 'error');

            // Replace the logFunction array with the stubbed methods
            logger.logFunction[0] = () => {};
            logger.logFunction[1] = appendStub;
            logger.logFunction[2] = debugStub;
            logger.logFunction[3] = infoStub;
            logger.logFunction[4] = warnStub;
            logger.logFunction[5] = errorStub;
        });

        teardown(() => {
            sinon.restore();
        });

        test('should log a message with LogLevel.Trace', () => {
            const message = 'Test trace message';
            logger.logMetadata(message, LogLevel.Trace);

            sinon.assert.calledOnce(appendStub);
            sinon.assert.calledWith(appendStub, message);
        });

        test('should log a message with LogLevel.Debug', () => {
            const message = 'Test debug message';
            logger.logMetadata(message, LogLevel.Debug);

            sinon.assert.calledOnce(debugStub);
            sinon.assert.calledWith(debugStub, message);
        });

        test('should log a message with LogLevel.Info', () => {
            const message = 'Test info message';
            logger.logMetadata(message, LogLevel.Info);

            sinon.assert.calledOnce(infoStub);
            sinon.assert.calledWith(infoStub, message);
        });

        test('should log a message with LogLevel.Warning', () => {
            const message = 'Test warning message';
            logger.logMetadata(message, LogLevel.Warning);

            sinon.assert.calledOnce(warnStub);
            sinon.assert.calledWith(warnStub, message);
        });

        test('should log a message with LogLevel.Error', () => {
            const message = 'Test error message';
            logger.logMetadata(message, LogLevel.Error);

            sinon.assert.calledOnce(errorStub);
            sinon.assert.calledWith(errorStub, message);
        });

        test('should default to LogLevel.Trace if no type is provided', () => {
            const message = 'Test default trace message';
            logger.logMetadata(message);

            sinon.assert.calledOnce(appendStub);
            sinon.assert.calledWith(appendStub, message);
        });
    });
});
