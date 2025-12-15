import * as vscode from 'vscode';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';
import type { MythicMechanic } from '@common/datasets/ScribeMechanic';
import { getLogger } from '@common/providers/loggerProvider';

export interface DocumentDataNode {
    metadata: Map<string, unknown>;
    name: {
        text: string;
    };
}

class DocumentData<K extends DocumentDataNode> {
    public nodes: K[] = [];
    public diagnostics: vscode.Diagnostic[] = [];

    constructor(
        private parent: DocumentDataMap<K>,
        public uri: string
    ) {}

    addNode(node: K): void {
        this.nodes.push(node);
        this.parent.nodes.set(node.name.text, node);
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

    clear(): void {
        this.clearNodes();
        this.clearDiagnostics();
    }

    clearNodes(): void {
        for (const node of this.nodes) {
            this.parent.nodes.delete(node.name.text);
        }
        this.nodes = [];
        ScribeMechanicHandler.registry.mechanic.clearLambdaContainer(this.uri);
    }
    clearDiagnostics(): void {
        this.diagnostics = [];
    }
}
export class DocumentDataMap<K extends DocumentDataNode> extends Map<string, DocumentData<K>> {
    nodes: Map<string, K> = new Map();

    get(uri: string): DocumentData<K> {
        if (!this.has(uri)) {
            getLogger().trace(`Creating new DocumentData for ${uri}`);
            const newData = new DocumentData<K>(this, uri);
            this.set(uri, newData);
            return newData;
        }
        return super.get(uri)!;
    }
    getFromUri(uri: vscode.Uri): DocumentData<K> {
        return this.get(uri.toString());
    }

    clear(): void {
        this.forEach((metadata) => {
            metadata.clear();
        });
        super.clear();
    }

    clearDocument(uri: string): void {
        if (this.has(uri)) {
            getLogger().trace(`Clearing DocumentData for ${uri}`);
            this.get(uri).clear();
        }
    }
}
