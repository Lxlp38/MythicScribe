import * as vscode from 'vscode';
import pLimit from 'p-limit';

import { checkFileType } from '../subscriptions/SubscriptionHelper';
import { Log } from '../utils/logger';
import { getFileParserPolicyConfig } from '../utils/configutils';
import { ConditionActions } from '../schemas/conditionActions';
import { timeCounter } from '../utils/timeUtils';
import { openDocumentTactfully } from '../utils/uriutils';
import { executeGetObjectLinkedToAttribute } from '../utils/cursorutils';

type NodeEntry = Map<string, MythicNode>;

enum ParserIntructions {
    // Disable parsing for the file
    DISABLE_PARSING = '# mythicscribe-disable file-parsing',
}

const NodeRegex =
    /(?<descriptionkey>(?<description>(?:^#.*$\r?\n\r?)*)^(?<key>[\w\-\_]+):)(?<body>(?:.*(?:\r?\n\r?(?!((^#.*$\r?\n\r?)*)^([\w\-\_]+):))?)*)/gm;
//  /(?<descriptionkey>(?<description>(?:^#.*$\r?\n\r?)*)^(?<key>[\w\-\_]+):)(?<body>(?:.*(?:\r?\n\r?(?=^[\s#](?!((^#.*$\r?\n\r?)*)^([\w\-\_]+):)))?)*)/gm;

// This is what we could have had with proper regexes
// But here we are, in ECMAScript
// const NodeRegex =
//     /(?<descriptionkey>(?<description>(?:^#.*$\r?\n\r?)*)^(?<key>[\w\-\_]+):)(?<body>(?:.*(?:\r?\n\r?(?=^[\s#](?!\g<descriptionkey>)))?)*)/gm;

vscode.workspace.onDidSaveTextDocument((document) => {
    if (!getFileParserPolicyConfig('parseOnSave')) {
        return;
    }
    const type = checkFileType(document.uri)?.key;
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(document);
    }
});

vscode.workspace.onDidChangeTextDocument((event) => {
    if (!getFileParserPolicyConfig('parseOnModification')) {
        return;
    }
    const type = checkFileType(event.document.uri)?.key;
    if (type) {
        MythicNodeHandler.registry[type].resetDocument(event.document);
    }
});

vscode.workspace.onDidRenameFiles(async (event) => {
    for (const { oldUri, newUri } of event.files) {
        const oldType = checkFileType(oldUri)?.key;
        const newType = checkFileType(newUri)?.key;

        if (oldType) {
            MythicNodeHandler.registry[oldType].clearNodesByDocument(oldUri);
        }

        if (newType) {
            const newDocument = await openDocumentTactfully(newUri);
            if (!newDocument) {
                continue;
            }
            MythicNodeHandler.registry[newType].scanDocument(newDocument);
        }
    }
});

vscode.workspace.onDidCreateFiles(async (event) => {
    for (const file of event.files) {
        const document = await openDocumentTactfully(file);
        if (!document) {
            continue;
        }
        const type = checkFileType(document.uri)?.key;
        if (type) {
            MythicNodeHandler.registry[type].scanDocument(document);
        }
    }
});

vscode.workspace.onDidDeleteFiles(async (event) => {
    for (const file of event.files) {
        const type = checkFileType(file)?.key;
        if (type) {
            MythicNodeHandler.registry[type].clearNodesByDocument(file);
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

//let NodeMatchTime = 0;

export class MythicNode {
    templates: Set<string> = new Set();
    outEdge: { [K in MythicNodeHandlerRegistryKey]: Set<string> } = {
        metaskill: new Set(),
        mob: new Set(),
        item: new Set(),
        droptable: new Set(),
        stat: new Set(),
        placeholder: new Set(),
    };
    constructor(
        public registry: MythicNodeRegistry,
        public document: vscode.TextDocument,
        public range: vscode.Range,
        public description: NodeBaseElement,
        public name: NodeElement,
        public body: NodeBaseElement
    ) {
        //const time = timeCounter();
        if (this.description.text) {
            for (const type of MythicNodeHandlerRegistryKey) {
                this.matchDecorators(this.description.text, type).forEach((decorator) => {
                    this.outEdge[type].add(decorator);
                });
            }
        }

        this.description.text = this.description.text?.replace(/^#/gm, '');

        if (!this.body.text) {
            return;
        }

        for (const type of MythicNodeHandlerRegistryKey) {
            this.matchDecorators(this.body.text, type).forEach((decorator) => {
                this.outEdge[type].add(decorator);
            });
        }

        this.body.text = this.body.text
            .split('\n')
            .map((line) => line.replace(/\s*#.*/, ''))
            .join('\n');

        if (this.registry.type === 'mob' || this.registry.type === 'item') {
            this.matchTemplate(this.body.text).forEach((template) => {
                if (this.templates.has(template)) {
                    Log.warn(
                        `Duplicate template ${template} found in ${this.registry.type} ${this.name.text}`
                    );
                }
                this.templates.add(template);
            });
        } else if (this.registry.type === 'metaskill') {
            this.matchConditionActions(this.body.text).forEach((action) => {
                this.outEdge.metaskill.add(action);
            });
        }
        for (const type of MythicNodeHandlerRegistryKey) {
            this.matchAttributes(this.body.text, type).forEach((attribute) => {
                this.outEdge[type].add(attribute);
            });
        }

        this.matchSkillShortcut(this.body.text).forEach((skillShortcut) => {
            this.outEdge.metaskill.add(skillShortcut);
        });
        delete body.text;
        //NodeMatchTime += time.delta();
    }

    get hash(): string {
        return `${this.document.uri.toString()}#${this.range.start.line}`;
    }

    private matchTemplate(body: string, regex = /^\s*Template(s)?:.*/gm): string[] {
        const match = body.match(regex);
        const templateList: string[] = [];
        if (match) {
            templateList.push(...this.processTemplate(match));
        }
        return templateList;
    }
    private matchDecorators(body: string, type: MythicNodeHandlerRegistryKey): string[] {
        const regex = MythicNodeHandler.registry[type].decoratorRegex;
        const matches = body.matchAll(regex);
        const decorators: string[] = [];
        for (const match of matches) {
            decorators.push(...this.processTemplate(match));
        }
        return decorators;
    }
    processTemplate(match: RegExpMatchArray): string[] {
        const parsedTemplates = match[0]
            .split(':')[1]
            .split(',')
            .map((template) => template.trim())
            .filter((template) => template.length > 0);
        return parsedTemplates;
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
    private matchAttributes(body: string, type: MythicNodeHandlerRegistryKey): string[] {
        const attributeRegex = new RegExp(
            `[{;}]\\s*(?<attribute>${Array.from(MythicNodeHandler.registry[type].referenceAttributes).join('|')})\\s*=\\s*(?<value>[\\w\\-_]+)\\s*[;}]`,
            'gi'
        );
        const matches = body.matchAll(attributeRegex);
        const attributes: string[] = [];
        for (const match of matches) {
            const object = executeGetObjectLinkedToAttribute(
                body.substring(0, match.index + 1)
            )?.replace(/@|\?|!|~/g, '');
            if (!object) {
                continue;
            }
            const objectMatch = MythicNodeHandler.registry[type].referenceMap.get(
                object.toLowerCase()
            );
            if (!objectMatch) {
                continue;
            }
            if (!objectMatch.has(match.groups!.attribute.toLowerCase())) {
                continue;
            }
            attributes.push(match.groups!.value);
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
    readonly type: MythicNodeHandlerRegistryKey;
    referenceAttributes: Set<string> = new Set();
    referenceMap: Map<string, Set<string>> = new Map();
    nodes: NodeEntry = new Map();
    nodesByDocument: Map<string, MythicNode[]> = new Map();
    decoratorRegex: RegExp;

    constructor(registry: keyof typeof MythicNodeHandler.registry) {
        this.type = registry;
        this.decoratorRegex = new RegExp(`^\\s*#\\s?@${registry}?\\s*[\\w\\-_]*\\s*:.+`, 'gm');
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

    clearNodesByDocument(uri: vscode.Uri): void {
        const nodesToRemove = this.nodesByDocument.get(uri.toString());
        if (nodesToRemove) {
            nodesToRemove.forEach((node) => {
                Log.trace(`Unregistered ${this.type} ${node.name.text} in ${uri.toString()}`);
                this.nodes.delete(node.name.text);
            });
        }
        this.nodesByDocument.delete(uri.toString());
    }

    scanDocument(document: vscode.TextDocument): void {
        if (document.lineAt(0).text === ParserIntructions.DISABLE_PARSING) {
            Log.debug(`Parsing disabled for ${document.uri.toString()}`);
            return;
        }
        const matches = document.getText().matchAll(NodeRegex);
        for (const match of matches) {
            const description = match.groups?.description || '';
            const key = match.groups!.key;
            const body = match.groups?.body || '';

            const matchStart = document.positionAt(match.index);
            const matchKeyStart = document.positionAt(match.index + description.length);
            const matchBodyStart = document.positionAt(
                match.index + description.length + key.length
            );
            const matchEnd = document.positionAt(match.index + match[0].length);

            const node = new MythicNode(
                this,
                document,
                new vscode.Range(matchStart, matchEnd),
                {
                    text: description,
                    range: new vscode.Range(matchStart, matchKeyStart),
                },
                {
                    text: key,
                    range: new vscode.Range(matchKeyStart, matchBodyStart),
                },
                {
                    text: body,
                    range: new vscode.Range(matchBodyStart, matchEnd),
                }
            );
            this.registerNode(node);
        }
    }

    resetDocument(document: vscode.TextDocument): void {
        this.clearNodesByDocument(document.uri);
        this.scanDocument(document);
    }
}

export const MythicNodeHandlerRegistryKey = [
    'metaskill',
    'mob',
    'item',
    'droptable',
    'stat',
    'placeholder',
] as const;
export type MythicNodeHandlerRegistryKey = (typeof MythicNodeHandlerRegistryKey)[number];

export namespace MythicNodeHandler {
    export const registry: Record<MythicNodeHandlerRegistryKey, MythicNodeRegistry> = {
        metaskill: new MythicNodeRegistry('metaskill'),
        mob: new MythicNodeRegistry('mob'),
        item: new MythicNodeRegistry('item'),
        droptable: new MythicNodeRegistry('droptable'),
        stat: new MythicNodeRegistry('stat'),
        placeholder: new MythicNodeRegistry('placeholder'),
    };

    export function getRegistry(key: keyof typeof registry): MythicNodeRegistry {
        return registry[key];
    }

    export function clearNodes(): void {
        for (const key in registry) {
            MythicNodeHandler.registry[key as keyof typeof registry].clearNodes();
        }
    }

    type ProcessFileResult = [MythicNodeHandlerRegistryKey, vscode.TextDocument] | null;
    async function processFile(uri: vscode.Uri): Promise<ProcessFileResult> {
        const type = checkFileType(uri)?.key;
        if (!type) {
            return null;
        }
        const openedFile = await vscode.workspace.openTextDocument(uri);
        return [type, openedFile];
    }

    export async function scanAllDocuments(): Promise<void> {
        clearNodes();

        const time = timeCounter();
        Log.debug('Scanning all documents');

        const include =
            (getFileParserPolicyConfig('parsingGlobPattern') as string | undefined) ||
            '**/*.{yaml,yml}';

        const exclude = getFileParserPolicyConfig('excludeGlobPattern') as string | undefined;

        Log.debug(`Parsing files with include: ${include} and exclude: ${exclude}`);

        const limitAmount = getFileParserPolicyConfig('parallelParsingLimit') as number;
        if (limitAmount <= 0) {
            Log.warn('File Parsing disabled because parallelParsingLimit is set to <0');
            return;
        }
        const limit = pLimit(limitAmount);

        const openFindTime = timeCounter();
        const files = await vscode.workspace.findFiles(
            include,
            exclude && exclude !== '' ? exclude : undefined
        );
        Log.custom(
            vscode.LogLevel.Trace,
            'Time Report',
            `Document Find Time: ${openFindTime.stop()}`
        );

        const openDocumentTime = timeCounter();
        const tasks = files.map((file) => limit(() => processFile(file)));
        const results = await Promise.allSettled(tasks);
        Log.debug(`Found ${results.length} files`);
        const openedFiles = results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter((result) => result !== null);
        Log.debug(`Opened ${openedFiles.length} files`);
        const rejected = results.filter((result) => result.status === 'rejected');
        if (rejected.length > 0) {
            Log.debug(`Failed to open ${rejected.length} files`);
            rejected.forEach((rejection, index) =>
                Log.debug(`Reason ${index}: ${rejection.reason}`)
            );
        }
        Log.custom(
            vscode.LogLevel.Trace,
            'Time Report',
            `Document Open Time: ${openDocumentTime.stop()}`
        );

        const documentScanTime = timeCounter();
        for (const [type, file] of openedFiles) {
            registry[type].scanDocument(file);
        }
        Log.custom(
            vscode.LogLevel.Trace,
            'Time Report',
            `Document Scan Time: ${documentScanTime.stop()}`
        );

        //Log.custom(vscode.LogLevel.Trace, 'Time Report', `Node Match Time: ${NodeMatchTime} ms`);

        Log.custom(
            vscode.LogLevel.Trace,
            'Time Report',
            `Total Time for File Parsing: ${time.stop()}`
        );
        Log.debug('Finished scanning all documents');
    }
}
