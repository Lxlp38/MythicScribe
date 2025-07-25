import type { MythicNode } from '@common/mythicnodes/MythicNode';
import { ConfigProvider } from '@common/providers/configProvider';
import * as vscode from 'vscode';

export const NodeDiagnosticCollection = vscode.languages.createDiagnosticCollection('MythicScribe');

export function createNodeDiagnostic(clazz: typeof NodeDiagnostic) {
    return function (
        node: MythicNode,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        if (!ConfigProvider.registry.diagnosticsPolicy.get('enabled')) {
            return;
        }
        return new clazz(node, range, message, severity);
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
        node.registry.documentDataMap.get(node.document.uri.toString()).addDiagnostic(this);
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
