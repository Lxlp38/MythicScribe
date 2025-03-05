import * as vscode from 'vscode';

import { checkFileType, FileType } from '../subscriptions/SubscriptionHelper';
import { Log } from '../utils/logger';

type NodeEntry = Map<string, MythicNode>;

enum ParserIntructions {
    // Disable parsing for the file
    DISABLE_PARSING = '# mythicscribe-disable file-parsing',
}

export class MythicNode {
    description = '';

    constructor(
        public registry: MythicNodeRegistry,
        public name: string,
        public document: vscode.TextDocument,
        public range: vscode.Range
    ) {
        Log.trace(`Registered node ${name} in ${document.uri.toString()}`);
        this.searchForDescription();
    }

    searchForDescription(): void {
        for (let i = this.range.start.line - 1; i >= 0; i--) {
            const line = this.document.lineAt(i);
            if (!line.text.startsWith('#')) {
                break;
            }
            const match = line.text.match(/#(.*)/);
            if (match) {
                const newDescriptionLine = match[1].replace(/^#/, '').trim();
                this.description = newDescriptionLine + '\n' + this.description;
            }
        }
    }
}

export class MythicNodeRegistry {
    readonly type: keyof typeof MythicNodeHandler.registry;
    nodes: NodeEntry = new Map();
    nodesByDocument: Map<string, MythicNode[]> = new Map();

    constructor(registry: keyof typeof MythicNodeHandler.registry) {
        this.type = registry;
    }

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
        if (document.lineAt(0).text === ParserIntructions.DISABLE_PARSING) {
            Log.debug(`Parsing disabled for ${document.uri.toString()}`);
            return;
        }
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const match = line.text.match(/^([\w\-]+):/);
            if (match) {
                const node = new MythicNode(this, match[1], document, line.range);
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
    const type = fromFileTypeToRegistryKey.get(checkFileType(document));
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(document);
    }
});
vscode.workspace.onDidDeleteFiles(async (event) => {
    for (const file of event.files) {
        const document = await vscode.workspace.openTextDocument(file);
        const type = fromFileTypeToRegistryKey.get(checkFileType(document));
        if (type) {
            MythicNodeHandler.registry[type].clearNodesByDocument(document);
        }
    }
});

interface MythicNodeHandlerRegistry {
    metaskills: MythicNodeRegistry;
    mobs: MythicNodeRegistry;
    items: MythicNodeRegistry;
    droptables: MythicNodeRegistry;
    stats: MythicNodeRegistry;
}

export namespace MythicNodeHandler {
    export const registry: MythicNodeHandlerRegistry = {
        metaskills: new MythicNodeRegistry('metaskills'),
        mobs: new MythicNodeRegistry('mobs'),
        items: new MythicNodeRegistry('items'),
        droptables: new MythicNodeRegistry('droptables'),
        stats: new MythicNodeRegistry('stats'),
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
        const type = fromFileTypeToRegistryKey.get(checkFileType(file));
        if (type) {
            MythicNodeHandler.registry[type].scanDocument(file);
        }
    }

    export async function scanAllDocuments(): Promise<void> {
        const files = await vscode.workspace.findFiles('**/*.{yaml,yml}');
        for (const file of files) {
            await scanFile(file);
        }
    }
}

export const fromFileTypeToRegistryKey: Map<FileType, keyof typeof MythicNodeHandler.registry> =
    new Map([
        [FileType.METASKILL, 'metaskills'],
        [FileType.MOB, 'mobs'],
        [FileType.ITEM, 'items'],
        [FileType.DROPTABLE, 'droptables'],
        [FileType.STAT, 'stats'],
    ]);
