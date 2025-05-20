import type { MythicNode } from '@common/mythicnodes/MythicNode';
import { getDiagnosticsPolicyConfig } from '@common/utils/configutils';
import * as vscode from 'vscode';

export const ScribeDiagnostics = vscode.languages.createDiagnosticCollection('MythicScribe');

export function createDiagnostic(clazz: typeof NodeDiagnostic) {
    return function (
        node: MythicNode,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        if (!getDiagnosticsPolicyConfig('enabled')) {
            return;
        }
        new clazz(node, range, message, severity);
    };
}

export class NodeDiagnostic extends vscode.Diagnostic {
    constructor(
        node: MythicNode,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        super(range, message, severity);
        this.source = 'MythicScribe';
        if (!node.registry.diagnosticsByDocument.has(node.document.uri.toString())) {
            node.registry.diagnosticsByDocument.set(node.document.uri.toString(), []);
        }
        node.registry.diagnosticsByDocument.get(node.document.uri.toString())!.push(this);
    }
}

export class NodeRawDiagnostic extends NodeDiagnostic {
    constructor(
        node: MythicNode,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        super(node, node.normalizeRelativeRange(range), message, severity);
    }
}
