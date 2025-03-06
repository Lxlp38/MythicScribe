import * as vscode from 'vscode';

import { checkFileType, FileType } from '../subscriptions/SubscriptionHelper';
import { Log } from '../utils/logger';
import { getFileParserPolicyConfig } from '../utils/configutils';

type NodeEntry = Map<string, MythicNode>;

enum ParserIntructions {
    // Disable parsing for the file
    DISABLE_PARSING = '# mythicscribe-disable file-parsing',
}

const NodeRegex = /((?:^#.*$\n)*)^([\w\-\_]+):((?:.*(?:\n(?=^\s))?)*)/gm;

vscode.workspace.onDidSaveTextDocument((document) => {
    if (!getFileParserPolicyConfig('parseOnSave')) {
        return;
    }
    const type = fromFileTypeToRegistryKey.get(checkFileType(document));
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(document);
    }
});

vscode.workspace.onDidChangeTextDocument((event) => {
    if (!getFileParserPolicyConfig('parseOnModification')) {
        return;
    }
    const type = fromFileTypeToRegistryKey.get(checkFileType(event.document));
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(event.document);
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

interface NodeBaseElement {
    text: string | undefined;
    range: vscode.Range;
}

interface NodeElement extends NodeBaseElement {
    text: string;
}

export class MythicNode {
    constructor(
        public registry: MythicNodeRegistry,
        public document: vscode.TextDocument,
        public range: vscode.Range,
        public description: NodeBaseElement,
        public name: NodeElement,
        public body: NodeBaseElement
    ) {}
}

export class MythicNodeRegistry {
    readonly type: keyof typeof MythicNodeHandler.registry;
    nodes: NodeEntry = new Map();
    nodesByDocument: Map<string, MythicNode[]> = new Map();

    constructor(registry: keyof typeof MythicNodeHandler.registry) {
        this.type = registry;
    }

    registerNode(node: MythicNode): void {
        this.nodes.set(node.name.text, node);
        const documentUri = node.document.uri.toString();
        if (!this.nodesByDocument.has(documentUri)) {
            this.nodesByDocument.set(documentUri, []);
        }
        this.nodesByDocument.get(documentUri)?.push(node);
        Log.trace(`Registered ${this.type} ${node.name.text} in ${node.document.uri.toString()}`);
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
                Log.trace(
                    `Unregistered ${this.type} ${node.name.text} in ${document.uri.toString()}`
                );
                this.nodes.delete(node.name.text);
            });
        }
        this.nodesByDocument.delete(document.uri.toString());
    }

    scanDocument(document: vscode.TextDocument): void {
        if (document.lineAt(0).text === ParserIntructions.DISABLE_PARSING) {
            Log.debug(`Parsing disabled for ${document.uri.toString()}`);
            return;
        }
        const matches = document.getText().matchAll(NodeRegex);
        for (const match of matches) {
            const matchStart = document.positionAt(match.index);
            const matchEnd = document.positionAt(match.index + match[0].length);
            const node = new MythicNode(
                this,
                document,
                new vscode.Range(matchStart, matchEnd),
                {
                    text: match[1],
                    range: new vscode.Range(
                        matchStart,
                        document.positionAt(match.index + match[1].length)
                    ),
                },
                {
                    text: match[2],
                    range: new vscode.Range(
                        document.positionAt(match.index + match[1].length),
                        document.positionAt(match.index + match[1].length + match[2].length)
                    ),
                },
                {
                    text: undefined,
                    range: new vscode.Range(
                        document.positionAt(match.index + match[1].length + match[2].length),
                        matchEnd
                    ),
                }
            );
            this.registerNode(node);
        }
    }

    resetDocument(document: vscode.TextDocument): void {
        this.clearNodesByDocument(document);
        this.scanDocument(document);
    }
}

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
        const include =
            (getFileParserPolicyConfig('parsingGlobPattern') as string | undefined) ||
            '**/*.{yaml,yml}';

        const exclude = getFileParserPolicyConfig('excludeGlobPattern') as string | undefined;

        const files = await vscode.workspace.findFiles(
            include,
            exclude && exclude !== '' ? exclude : undefined
        );
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
