import * as assert from 'assert';

import * as sinon from 'sinon';
import * as vscode from 'vscode';

import {
    getObjectLinkedToAttribute,
    getAttributeLinkedToValue,
    fetchCursorSkills,
} from '../../utils/cursorutils';
import { AbstractScribeMechanicRegistry } from '../../datasets/ScribeMechanic';

suite('Cursor Utils', () => {
    let document: vscode.TextDocument;
    let position: vscode.Position;

    setup(() => {
        document = {
            getText: sinon.stub(),
        } as unknown as vscode.TextDocument;
        position = new vscode.Position(0, 0);
    });
    suite('getObjectLinkedToAttribute', () => {
        test('should return null if no unbalanced opening brace is found', () => {
            (document.getText as sinon.SinonStub).returns(
                '- object{attribute1=value1;attribute2=value2}'
            );
            position = new vscode.Position(0, 40);

            const result = getObjectLinkedToAttribute(document, position);
            assert.strictEqual(result, null);
        });

        test('should return the object linked to the attribute', () => {
            (document.getText as sinon.SinonStub).returns(
                '- object{attribute1=value1;attribute2=value2'
            );
            position = new vscode.Position(0, 20);

            const result = getObjectLinkedToAttribute(document, position);
            assert.strictEqual(result, 'object');
        });

        test('should return null if no object is found before unbalanced opening brace', () => {
            (document.getText as sinon.SinonStub).returns('{attribute1=value1;attribute2=value2');
            position = new vscode.Position(0, 20);

            const result = getObjectLinkedToAttribute(document, position);
            assert.strictEqual(result, null);
        });

        test('should handle nested braces correctly', () => {
            (document.getText as sinon.SinonStub).returns('- outer{- inner{attribute1=value1;');
            position = new vscode.Position(0, 30);

            const result = getObjectLinkedToAttribute(document, position);
            assert.strictEqual(result, 'inner');
        });

        test('should handle multiple objects correctly', () => {
            (document.getText as sinon.SinonStub).returns(
                'object1{attribute1=value1;}- object2{attribute2=value2;'
            );
            position = new vscode.Position(0, 40);

            const result = getObjectLinkedToAttribute(document, position);
            assert.strictEqual(result, 'object2');
        });
    });
    suite('getAttributeLinkedToValue', () => {
        test('should return null if no attribute is found', () => {
            (document.getText as sinon.SinonStub).returns('object{value1;value2');
            position = new vscode.Position(0, 20);

            const result = getAttributeLinkedToValue(document, position);
            assert.strictEqual(result, null);
        });

        test('should return the attribute linked to the value', () => {
            (document.getText as sinon.SinonStub).returns(
                'object{attribute1=value1;attribute2=value2'
            );
            position = new vscode.Position(0, 30);

            const result = getAttributeLinkedToValue(document, position);
            assert.strictEqual(result, 'attribute2');
        });

        test('should return null if no attribute is found before the value', () => {
            (document.getText as sinon.SinonStub).returns('object{value1');
            position = new vscode.Position(0, 10);

            const result = getAttributeLinkedToValue(document, position);
            assert.strictEqual(result, null);
        });

        test('should handle multiple attributes correctly', () => {
            (document.getText as sinon.SinonStub).returns(
                'object{attribute1=value1;attribute2=value2;attribute3=value3'
            );
            position = new vscode.Position(0, 50);

            const result = getAttributeLinkedToValue(document, position);
            assert.strictEqual(result, 'attribute3');
        });

        test('should handle attributes with spaces correctly', () => {
            (document.getText as sinon.SinonStub).returns(
                'object{attribute1 = value1; attribute2 = value2'
            );
            position = new vscode.Position(0, 40);

            const result = getAttributeLinkedToValue(document, position);
            assert.strictEqual(result, 'attribute2');
        });
    });

    suite('fetchCursorSkills', () => {
        let document: vscode.TextDocument;
        let position: vscode.Position;
        let registry: AbstractScribeMechanicRegistry;

        setup(() => {
            document = {
                getText: sinon.stub(),
                getWordRangeAtPosition: sinon.stub(),
            } as unknown as vscode.TextDocument;
            position = new vscode.Position(0, 0);
            registry = {
                regex: /\bmechanic\b/,
                getMechanicByName: sinon.stub(),
            } as unknown as AbstractScribeMechanicRegistry;
        });

        test('should return null if no mechanic is found at the position', () => {
            (document.getWordRangeAtPosition as sinon.SinonStub).returns(undefined);

            const result = fetchCursorSkills(document, position, registry);
            assert.strictEqual(result, null);
        });

        test('should return the mechanic if found at the position', () => {
            const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 8));
            (document.getWordRangeAtPosition as sinon.SinonStub).returns(range);
            (document.getText as sinon.SinonStub).returns('mechanic');
            (registry.getMechanicByName as sinon.SinonStub).returns({ name: 'mechanic' });

            const result = fetchCursorSkills(document, position, registry);
            assert.deepStrictEqual(result, { name: 'mechanic' });
        });

        test('should return null if mechanic name is not found in registry', () => {
            const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 8));
            (document.getWordRangeAtPosition as sinon.SinonStub).returns(range);
            (document.getText as sinon.SinonStub).returns('mechanic');
            (registry.getMechanicByName as sinon.SinonStub).returns(null);

            const result = fetchCursorSkills(document, position, registry);
            assert.strictEqual(result, null);
        });
    });
});
