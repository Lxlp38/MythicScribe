import { ConfigProvider } from '@common/providers/configProvider';
import * as vscode from 'vscode';

type DiagnosticNode = {
    registry: {
        documentDataMap: Map<string, { addDiagnostic(diagnostic: vscode.Diagnostic): void }>;
    };
    document: { uri: vscode.Uri };
    normalizeRelativeRange(range: vscode.Range): vscode.Range;
};

export const NodeDiagnosticCollection = vscode.languages.createDiagnosticCollection('MythicScribe');

export function createNodeDiagnostic<NODE extends DiagnosticNode>(clazz: typeof NodeDiagnostic) {
    return function (
        node: NODE,
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

export class NodeDiagnostic<NODE extends DiagnosticNode> extends vscode.Diagnostic {
    constructor(
        node: NODE,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        super(range, message, severity);
        this.source = 'MythicScribe';
        node.registry.documentDataMap.get(node.document.uri.toString())?.addDiagnostic(this);
    }
}

export class NodeRawDiagnostic<NODE extends DiagnosticNode> extends NodeDiagnostic<NODE> {
    constructor(
        node: NODE,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity
    ) {
        super(node, node.normalizeRelativeRange(range), message, severity);
    }
}
