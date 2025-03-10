import * as vscode from 'vscode';

import { checkFileType, FileType } from '../subscriptions/SubscriptionHelper';
import { Log } from '../utils/logger';
import { getFileParserPolicyConfig } from '../utils/configutils';
import { ConditionActions } from '../schemas/conditionActions';
import { timeCounter } from '../utils/timeUtils';

type NodeEntry = Map<string, MythicNode>;

enum ParserIntructions {
    // Disable parsing for the file
    DISABLE_PARSING = '# mythicscribe-disable file-parsing',
}

const NodeRegex = /((?:^#.*$\r?\n\r?)*)^([\w\-\_]+):((?:.*(?:\r?\n\r?(?=^\s))?)*)/gm;

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
    templates: Set<string> = new Set();
    outEdge: { [K in keyof MythicNodeHandlerRegistry]: Set<string> } = {
        metaskills: new Set(),
        mobs: new Set(),
        items: new Set(),
        droptables: new Set(),
        stats: new Set(),
    };
    constructor(
        public registry: MythicNodeRegistry,
        public document: vscode.TextDocument,
        public range: vscode.Range,
        public description: NodeBaseElement,
        public name: NodeElement,
        public body: NodeBaseElement
    ) {
        if (this.description.text && this.registry.type === 'metaskills') {
            try {
                this.matchTemplate(
                    this.description.text,
                    /^#\s*@((?:Called)|(?:Callers)):.*/gm
                ).forEach((template) => {
                    this.templates.add(template);
                });
            } catch {
                Log.error(`Error parsing description for ${this.registry.type} ${this.name.text}`);
            }
        }

        if (!this.body.text) {
            return;
        }
        this.body.text = this.body.text
            .split('\n')
            .map((line) => line.replace(/\s#.*/, ''))
            .join('\n');
        if (this.registry.type === 'mobs' || this.registry.type === 'items') {
            this.matchTemplate(this.body.text).forEach((template) => {
                if (this.templates.has(template)) {
                    Log.warn(
                        `Duplicate template ${template} found in ${this.registry.type} ${this.name.text}`
                    );
                }
                this.templates.add(template);
            });
        } else if (this.registry.type === 'metaskills') {
            this.matchConditionActions(this.body.text).forEach((action) => {
                this.outEdge.metaskills.add(action);
            });
        }
        for (const type in this.outEdge) {
            this.matchAttributes(this.body.text, type as keyof MythicNodeHandlerRegistry).forEach(
                (attribute) => {
                    this.outEdge[type as keyof MythicNodeHandlerRegistry].add(attribute);
                }
            );
        }

        this.matchSkillShortcut(this.body.text).forEach((skillShortcut) => {
            this.outEdge.metaskills.add(skillShortcut);
        });
        delete body.text;
    }

    get hash(): string {
        return `${this.document.uri.toString()}#${this.range.start.line}`;
    }

    private matchTemplate(body: string, regex = /^\s*Template(s)?:.*/gm): string[] {
        const match = body.match(regex);
        const templateList: string[] = [];
        if (match) {
            const parsedTemplates = match[0]
                .split(':')[1]
                .split(',')
                .map((template) => template.trim())
                .filter((template) => template.length > 0);
            templateList.push(...parsedTemplates);
        }
        return templateList;
    }
    private matchConditionActions(body: string): string[] {
        const conditionActionRegex = new RegExp(
            `\\s(?:${Object.keys(ConditionActions).join('|')})\\s([\\w\\-_]+)`,
            'gi'
        );
        const matches = body.matchAll(conditionActionRegex);
        const conditionActions: string[] = [];
        for (const match of matches) {
            conditionActions.push(match[1]);
        }
        return conditionActions;
    }
    private matchAttributes(body: string, type: keyof MythicNodeHandlerRegistry): string[] {
        const attributeRegex = new RegExp(
            `[{;}]\\s*(?:${Array.from(MythicNodeHandler.registry[type].referenceAttributes).join('|')})\\s*=\\s*([\\w\\-_]+)\\s*[;}]`,
            'gi'
        );
        const matches = body.matchAll(attributeRegex);
        const attributes: string[] = [];
        for (const match of matches) {
            attributes.push(match[1]);
        }
        return attributes;
    }
    private matchSkillShortcut(body: string): string[] {
        const skillShortcutRegex = /-\sskill:([\w\-_]+)/g;
        const matches = body.matchAll(skillShortcutRegex);
        const skillShortcuts: string[] = [];
        for (const match of matches) {
            skillShortcuts.push(match[1]);
        }
        return skillShortcuts;
    }
}

export class MockMythicNode extends MythicNode {
    constructor(registry: MythicNodeRegistry, name: string, creator: MythicNode) {
        const document = vscode.workspace.textDocuments[0];
        const range = creator.range;
        const description = {
            text: 'Mock description',
            range: new vscode.Range(0, 0, 0, 0),
        };
        const body = {
            text: 'Mock body',
            range: new vscode.Range(0, 0, 0, 0),
        };
        const MockName = {
            text: name,
            range: creator.name.range,
        };
        super(registry, document, range, description, MockName, body);
    }
    get hash(): string {
        return `Mock:${this.name.text}@${this.registry.type}`;
    }
}

export class MythicNodeRegistry {
    readonly type: keyof MythicNodeHandlerRegistry;
    referenceAttributes: Set<string> = new Set();
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

    getNodeValues(): MythicNode[] {
        return Array.from(this.nodes.values());
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
                    text: match[3],
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

export interface MythicNodeHandlerRegistry {
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
        const time = timeCounter();
        Log.debug('Scanning all documents');
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
        Log.debug('Scanned all documents in', time.stop());
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
