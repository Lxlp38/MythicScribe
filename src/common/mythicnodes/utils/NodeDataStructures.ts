import * as vscode from 'vscode';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';
import type { MythicMechanic } from '@common/datasets/ScribeMechanic';

import { type MythicNode } from '../MythicNode';

class DocumentData {
    constructor(
        public uri: string,
        public nodes: MythicNode[] = [],
        public diagnostics: vscode.Diagnostic[] = []
    ) {}

    addNode(node: MythicNode): void {
        this.nodes.push(node);
        if (node.metadata.has('lambdaMechanic')) {
            ScribeMechanicHandler.registry.mechanic.addLambdaMechanic(
                this.uri,
                node.metadata.get('lambdaMechanic') as MythicMechanic
            );
        }
    }
    addDiagnostic(diagnostic: vscode.Diagnostic): void {
        this.diagnostics.push(diagnostic);
    }

    clearNodes(): void {
        this.nodes = [];
        ScribeMechanicHandler.registry.mechanic.clearLambdaContainer(this.uri);
    }
    clearDiagnostics(): void {
        this.diagnostics = [];
    }
}
export class DocumentDataMap extends Map<string, DocumentData> {
    get(uri: string): DocumentData {
        if (!this.has(uri)) {
            const newData = new DocumentData(uri);
            this.set(uri, newData);
            return newData;
        }
        return super.get(uri)!;
    }
    getFromUri(uri: vscode.Uri): DocumentData {
        return this.get(uri.toString());
    }

    clear(): void {
        this.forEach((metadata) => {
            metadata.clearNodes();
            metadata.clearDiagnostics();
        });
        super.clear();
    }

    clearDocument(uri: string): void {
        if (this.has(uri)) {
            const metadata = this.get(uri);
            metadata.clearNodes();
            metadata.clearDiagnostics();
            this.delete(uri);
        }
    }
}
