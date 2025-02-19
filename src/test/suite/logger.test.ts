import * as sinon from 'sinon';
import * as vscode from 'vscode';

import * as logger from '../../utils/logger';

suite('Logger', () => {
    suite('logMetadata', () => {
        let clock: sinon.SinonFakeTimers;
        let updateStub: sinon.SinonStub;

        setup(() => {
            clock = sinon.useFakeTimers();
            updateStub = sinon.stub(logger.logsProvider, 'update');
        });

        teardown(() => {
            clock.restore();
            updateStub.restore();
            logger.logs.length = 0; // Clear logs after each test
        });

        test('should log message with default log type', () => {
            const message = 'Test message';
            logger.logMetadata(message);

            const timestamp = new Date().toISOString();
            const expectedMessage = `[${timestamp}] DEBUG: Test message`;

            sinon.assert.match(logger.logs[0], expectedMessage);
        });

        test('should log message with specified log type', () => {
            const message = 'Test message';
            logger.logMetadata(message, logger.LogType.INFO);

            const timestamp = new Date().toISOString();
            const expectedMessage = `[${timestamp}] INFO: Test message`;

            sinon.assert.match(logger.logs[0], expectedMessage);
        });

        test('should not update logs provider if log file is not open', () => {
            logger.logMetadata('Test message');

            sinon.assert.notCalled(updateStub);
        });
    });
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
});
