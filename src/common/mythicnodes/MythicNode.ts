import * as vscode from 'vscode';

import { checkFileType, FileType } from '../subscriptions/SubscriptionHelper';
import { Log } from '../utils/logger';

type NodeEntry = Map<string, MythicNode>;

export class MythicNode {
    name: string;
    document: vscode.TextDocument;
    range: vscode.Range;

    constructor(name: string, document: vscode.TextDocument, range: vscode.Range) {
        this.name = name;
        this.document = document;
        this.range = range;
        Log.trace(`Registered node ${name} in ${document.uri.toString()}`);
    }
}

export class MythicNodeRegistry {
    nodes: NodeEntry = new Map();
    nodesByDocument: Map<string, MythicNode[]> = new Map();

    registerNode(node: MythicNode): void {
        this.nodes.set(node.name, node);
        const documentUri = node.document.uri.toString();
        if (!this.nodesByDocument.has(documentUri)) {
            this.nodesByDocument.set(documentUri, []);
        }
        this.nodesByDocument.get(documentUri)?.push(node);
    }

    getNode(name: string): MythicNode | undefined {
        return this.nodes.get(name);
    }

    getNodes(): NodeEntry {
        return this.nodes;
    }

    clearNodes(): void {
        this.nodes.clear();
        this.nodesByDocument.clear();
    }

    clearNodesByDocument(document: vscode.TextDocument): void {
        const nodesToRemove = this.nodesByDocument.get(document.uri.toString());
        if (nodesToRemove) {
            nodesToRemove.forEach((node) => {
                Log.trace(`Unregistered node ${node.name} in ${document.uri.toString()}`);
                this.nodes.delete(node.name);
            });
        }
        this.nodesByDocument.delete(document.uri.toString());
    }

    scanDocument(document: vscode.TextDocument): void {
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const match = line.text.match(/^([\w\-]+):/);
            if (match) {
                const node = new MythicNode(match[1], document, line.range);
                this.registerNode(node);
            }
        }
    }

    resetDocument(document: vscode.TextDocument): void {
        this.clearNodesByDocument(document);
        this.scanDocument(document);
    }
}

vscode.workspace.onDidSaveTextDocument((document) => {
    const type = fromFileTypeToRegistryKey(checkFileType(document));
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(document);
    }
});
vscode.workspace.onDidDeleteFiles(async (event) => {
    for (const file of event.files) {
        const document = await vscode.workspace.openTextDocument(file);
        const type = fromFileTypeToRegistryKey(checkFileType(document));
        if (type) {
            MythicNodeHandler.registry[type].clearNodesByDocument(document);
        }
    }
});

export namespace MythicNodeHandler {
    export const registry = {
        metaskills: new MythicNodeRegistry(),
        mobs: new MythicNodeRegistry(),
        items: new MythicNodeRegistry(),
        droptables: new MythicNodeRegistry(),
        stats: new MythicNodeRegistry(),
    };

    export function getRegistry(key: keyof typeof registry): MythicNodeRegistry {
        return registry[key];
    }

    export function clearNodes(): void {
        for (const key in registry) {
            MythicNodeHandler.registry[key as keyof typeof registry].clearNodes();
        }
    }

    export async function scanFile(document: vscode.Uri) {
        const file = await vscode.workspace.openTextDocument(document);
        const type = fromFileTypeToRegistryKey(checkFileType(file));
        if (type) {
            MythicNodeHandler.registry[type].resetDocument(file);
        }
    }

    export async function scanAllDocuments(): Promise<void> {
        const files = await vscode.workspace.findFiles('**/*.{yaml,yml}');
        for (const file of files) {
            scanFile(file);
        }
    }
}

function fromFileTypeToRegistryKey(
    type: FileType
): keyof typeof MythicNodeHandler.registry | undefined {
    switch (type) {
        case FileType.METASKILL:
            return 'metaskills';
        case FileType.MOB:
            return 'mobs';
        case FileType.ITEM:
            return 'items';
        case FileType.DROPTABLE:
            return 'droptables';
        case FileType.STAT:
            return 'stats';
        default:
            return undefined;
    }
}
