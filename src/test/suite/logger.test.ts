import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { logError, logInfo, showInfoMessageWithOptions } from '../../utils/logger';

suite('Logger', () => {
    suite('logError', () => {
        let showErrorMessageStub: sinon.SinonStub;

        setup(() => {
            showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
        });

        teardown(() => {
            showErrorMessageStub.restore();
        });

        test('should log error message when error is an instance of Error', () => {
            const error = new Error('Test error');
            logError(error);

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, 'An error occurred: ' + error.message);
        });

        test('should log custom message when error is an instance of Error', () => {
            const error = new Error('Test error');
            const customMessage = 'Custom message: ';
            logError(error, customMessage);

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, customMessage + error.message);
        });

        test('should log error message when error is not an instance of Error', () => {
            const error = 'Test error string';
            logError(error);

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, 'An error occurred: ', String(error));
        });

        test('should log custom message when error is not an instance of Error', () => {
            const error = 'Test error string';
            const customMessage = 'Custom message: ';
            logError(error, customMessage);

            sinon.assert.calledOnce(showErrorMessageStub);
            sinon.assert.calledWith(showErrorMessageStub, customMessage, String(error));
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
            logInfo(message);

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

            showInfoMessageWithOptions(message, options);

            sinon.assert.calledOnce(showInformationMessageStub);
            sinon.assert.calledWith(showInformationMessageStub, message, 'Option1', 'Option2');
        });

        test('should open URL when an option is selected', async () => {
            const message = 'Test message';
            const options = { Option1: 'https://example.com/1', Option2: 'https://example.com/2' };

            showInformationMessageStub.resolves('Option1');

            await showInfoMessageWithOptions(message, options);

            sinon.assert.calledOnce(openExternalStub);
            sinon.assert.calledWith(openExternalStub, vscode.Uri.parse('https://example.com/1'));
        });

        test('should not open URL when no option is selected', async () => {
            const message = 'Test message';
            const options = { Option1: 'https://example.com/1', Option2: 'https://example.com/2' };

            showInformationMessageStub.resolves(undefined);

            await showInfoMessageWithOptions(message, options);

            sinon.assert.notCalled(openExternalStub);
        });
    });
});
