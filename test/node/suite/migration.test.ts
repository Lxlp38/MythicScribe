import * as assert from 'assert';

import * as vscode from 'vscode';
import * as sinon from 'sinon';

import { migrateConfiguration, changeCustomDatasetsSource } from '../../../src/common/migration/migration';

suite('Config Migration', () => {
    let getConfigurationStub: sinon.SinonStub;
    let inspectStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;

    setup(() => {
        getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
            inspect: () => ({ key: 'someKey' }),
            get: () => ({}),
            update: () => Promise.resolve(),
            has: function (section): boolean {
                throw new Error('Function not implemented: has(' + section + ')');
            },
        });
        inspectStub = sinon.stub();
        updateStub = sinon.stub();
    });

    teardown(() => {
        sinon.restore();
    });

    suite('migrateConfiguration', () => {
        test('should not proceed if inspected is undefined', async () => {
            inspectStub.returns(undefined);
            getConfigurationStub.returns({ inspect: inspectStub });

            await migrateConfiguration('oldKey', 'newKey', 'newProperty', vscode.ConfigurationTarget.Global);

            assert.strictEqual(updateStub.called, false);
        });

        test('should update global and workspace configurations', async () => {
            const inspected = {
                globalValue: 'globalValue',
                workspaceValue: 'workspaceValue',
            };
            inspectStub.returns(inspected);
            getConfigurationStub.returns({
                inspect: inspectStub,
                get: () => ({}),
                update: updateStub,
            });

            await migrateConfiguration('oldKey', 'newKey', 'newProperty', vscode.ConfigurationTarget.Global);
            await migrateConfiguration('oldKey', 'newKey', 'newProperty', vscode.ConfigurationTarget.Workspace);

            assert.strictEqual(updateStub.callCount, 4);
            assert.strictEqual(
                updateStub.calledWith(
                    'newKey',
                    { newProperty: 'globalValue' },
                    vscode.ConfigurationTarget.Global
                ),
                true
            );
            assert.strictEqual(
                updateStub.calledWith('oldKey', undefined, vscode.ConfigurationTarget.Global),
                true
            );
            assert.strictEqual(
                updateStub.calledWith(
                    'newKey',
                    { newProperty: 'workspaceValue' },
                    vscode.ConfigurationTarget.Workspace
                ),
                true
            );
            assert.strictEqual(
                updateStub.calledWith('oldKey', undefined, vscode.ConfigurationTarget.Workspace),
                true
            );
        });

        test('should handle undefined values correctly', async () => {
            const inspected = {
                globalValue: undefined,
                workspaceValue: 'workspaceValue',
            };
            inspectStub.returns(inspected);
            getConfigurationStub.returns({
                inspect: inspectStub,
                get: () => ({}),
                update: updateStub,
            });

            await migrateConfiguration('oldKey2', 'newKey2', 'newProperty2', vscode.ConfigurationTarget.Global);
            await migrateConfiguration('oldKey2', 'newKey2', 'newProperty2', vscode.ConfigurationTarget.Workspace);

            assert.strictEqual(updateStub.callCount, 2);
            assert.strictEqual(
                updateStub.calledWith(
                    'newKey2',
                    { newProperty2: 'workspaceValue' },
                    vscode.ConfigurationTarget.Workspace
                ),
                true
            );
            assert.strictEqual(
                updateStub.calledWith('oldKey2', undefined, vscode.ConfigurationTarget.Workspace),
                true
            );
        });
    });

    suite('changeCustomDatasetsSource', () => {
        test('should not proceed if inspected is undefined', async () => {
            inspectStub.returns(undefined);
            getConfigurationStub.returns({ inspect: inspectStub });

            await changeCustomDatasetsSource('customDatasets', /old/, 'new');

            assert.strictEqual(updateStub.called, false);
        });

        test('should update global and workspace configurations', async () => {
            const inspected = {
                globalValue: [{ source: 'oldValue' }],
                workspaceValue: [{ source: 'oldValue' }],
            };
            inspectStub.returns(inspected);
            getConfigurationStub.returns({
                inspect: inspectStub,
                get: () => ({}),
                update: updateStub,
            });

            await changeCustomDatasetsSource('customDatasets', /oldValue/, 'newValue');

            assert.strictEqual(updateStub.callCount, 2);
            assert.strictEqual(
                updateStub.calledWith(
                    'customDatasets',
                    [{ source: 'newValue' }],
                    vscode.ConfigurationTarget.Global
                ),
                true
            );
            assert.strictEqual(
                updateStub.calledWith(
                    'customDatasets',
                    [{ source: 'newValue' }],
                    vscode.ConfigurationTarget.Workspace
                ),
                true
            );
        });

        test('should handle undefined values correctly', async () => {
            const inspected = {
                globalValue: undefined,
                workspaceValue: [{ source: 'oldValue' }],
            };
            inspectStub.returns(inspected);
            getConfigurationStub.returns({
                inspect: inspectStub,
                get: () => ({}),
                update: updateStub,
            });

            await changeCustomDatasetsSource('customDatasets', /oldValue/, 'newValue');

            assert.strictEqual(updateStub.callCount, 1);
            assert.strictEqual(
                updateStub.calledWith(
                    'customDatasets',
                    [{ source: 'newValue' }],
                    vscode.ConfigurationTarget.Workspace
                ),
                true
            );
        });

        test('should not update if value is not an array', async () => {
            const inspected = {
                globalValue: 'notAnArray',
                workspaceValue: 'notAnArray',
            };
            inspectStub.returns(inspected);
            getConfigurationStub.returns({
                inspect: inspectStub,
                get: () => ({}),
                update: updateStub,
            });

            await changeCustomDatasetsSource('customDatasets', /oldValue/, 'newValue');

            assert.strictEqual(updateStub.called, false);
        });
    });
});
