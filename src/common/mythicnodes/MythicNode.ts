import * as vscode from 'vscode';
import pLimit from 'p-limit';
import {
    fromPlaceholderNodeIdentifierToRegistryKey,
    parseWrittenPlaceholder,
} from '@common/datasets/ScribePlaceholder';
import { ConditionActions } from '@common/schemas/conditionActions';
import {
    createDiagnostic,
    NodeDiagnostic,
    NodeRawDiagnostic,
    ScribeDiagnostics,
} from '@common/diagnostics/ScribeDiagnostics';
import { ScribeEnumHandler } from '@common/datasets/ScribeEnum';

import { checkFileType } from '../subscriptions/SubscriptionHelper';
import Log from '../utils/logger';
import { getDiagnosticsPolicyConfig, getFileParserPolicyConfig } from '../utils/configutils';
import { timeCounter } from '../utils/timeUtils';
import { openDocumentTactfully } from '../utils/uriutils';
import { executeGetObjectLinkedToAttribute } from '../utils/cursorutils';
import { registryKey } from '../objectInfos';

export type NodeEntry = Map<string, MythicNode>;

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
        MythicNodeHandler.registry[type].updateDocument(document);
    }
});

vscode.workspace.onDidChangeTextDocument((event) => {
    if (!getFileParserPolicyConfig('parseOnModification')) {
        return;
    }
    const type = checkFileType(event.document.uri)?.key;
    if (type) {
        MythicNodeHandler.registry[type].updateDocument(event.document);
    }
});

vscode.workspace.onDidRenameFiles(async (event) => {
    for (const { oldUri, newUri } of event.files) {
        const oldType = checkFileType(oldUri)?.key;
        const newType = checkFileType(newUri)?.key;

        if (oldType) {
            MythicNodeHandler.registry[oldType].clearDocument(oldUri);
        }

        if (newType) {
            const newDocument = await openDocumentTactfully(newUri);
            if (!newDocument) {
                continue;
            }
            MythicNodeHandler.registry[newType].updateDocument(newDocument);
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
            MythicNodeHandler.registry[type].updateDocument(document);
        }
    }
});

vscode.workspace.onDidDeleteFiles(async (event) => {
    for (const file of event.files) {
        const type = checkFileType(file)?.key;
        if (type) {
            MythicNodeHandler.registry[type].clearDocument(file);
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

type NodeReferenceValue = Map<string, vscode.Range[]>;
type NodeReference = Partial<Record<registryKey, NodeReferenceValue>>;

type CompactNodeReference = { name: string; range: vscode.Range };

export class MythicNode {
    templates: NodeReferenceValue = new Map<string, vscode.Range[]>();
    outEdge: NodeReference = {};
    metadata = new Map<string, unknown>();

    constructor(
        public registry: MythicNodeRegistry,
        public document: vscode.TextDocument,
        public range: vscode.Range,
        public description: NodeBaseElement,
        public name: NodeElement,
        public body: NodeBaseElement
    ) {
        if (this.description.text) {
            for (const type of registryKey) {
                this.matchDecorators(this.description.text, type).forEach((decorator) => {
                    this.addEdge(type, decorator.name, decorator.range);
                });
            }
        }

        this.description.text = this.description.text?.replace(/^#/gm, '');

        if (!this.body.text) {
            return;
        }

        for (const type of registryKey) {
            this.matchDecorators(this.body.text, type).forEach((decorator) => {
                this.addEdge(type, decorator.name, decorator.range);
            });
        }

        this.body.text = this.body.text
            .split('\n')
            .map((line) => line.replace(/(^|\s)\s*#.*/m, ''))
            .join('\n');

        this.findNodeEdges(this.body.text);

        body.text = undefined;
    }

    get hash(): string {
        return `${this.document.uri.toString()}#${this.range.start.line}`;
    }

    public normalizeRelativeRange(range: vscode.Range): vscode.Range {
        const newStart = this.body.range.start.line + range.start.line;
        const newEnd = this.body.range.start.line + range.end.line;
        const newRange = new vscode.Range(
            newStart,
            range.start.character,
            newEnd,
            range.end.character
        );
        return newRange;
    }

    protected calculateRelativeRangeFromBody(body: string, match: RegExpExecArray): vscode.Range {
        const matchStart = match.index;
        const matchText = match[0];
        const matchEnd = matchStart + matchText.length;

        const lines = body.split('\n');
        let startLine = 0;
        let startPos = matchStart;
        let endLine = 0;
        let endPos = matchEnd;

        // Calculate start line and position
        for (; startLine < lines.length; startLine++) {
            const lineLength = lines[startLine].length + 1; // +1 for newline

            if (startPos < lineLength) {
                break;
            }
            startPos -= lineLength;
        }

        // Calculate end line and position
        endLine = startLine;
        endPos = startPos + matchText.length;

        for (; endLine < lines.length; endLine++) {
            const lineLength = lines[endLine].length + 1;

            if (endPos <= lineLength) {
                break;
            }
            endPos -= lineLength;
        }

        // Ensure we don't go beyond document bounds
        startLine = Math.min(startLine, lines.length - 1);
        endLine = Math.min(endLine, lines.length - 1);

        // Ensure positions are within line bounds
        startPos = Math.min(startPos, lines[startLine].length);
        endPos = Math.min(endPos, lines[endLine].length);

        return new vscode.Range(startLine, startPos, endLine, endPos);
    }

    protected addEdge(registry: registryKey, entry: string, ...ranges: vscode.Range[]): void {
        if (!this.outEdge[registry]) {
            this.outEdge[registry] = new Map();
        }
        if (!this.outEdge[registry].has(entry)) {
            this.outEdge[registry].set(entry, []);
        }
        for (const range of ranges) {
            this.outEdge[registry].get(entry)!.push(this.normalizeRelativeRange(range));
        }
        // console.log({
        //     this: this.name.text,
        //     registry,
        //     entry,
        //     edge: this.outEdge[registry].get(entry),
        // });
    }

    public hasEdge(registry: registryKey, entry: string): boolean {
        if (!this.outEdge[registry]) {
            return false;
        }
        return this.outEdge[registry].has(entry);
    }

    protected findNodeEdges(body: string): void {
        this.matchAttributes(body).forEach(({ registry, name, range }) =>
            this.addEdge(registry, name, range)
        );

        this.matchSkillShortcut(body).forEach((skillShortcut) => {
            this.addEdge('metaskill', skillShortcut.name, skillShortcut.range);
        });
        this.matchPlaceholder(body);
    }

    protected matchTemplate(
        body: string,
        regex = /(?<=^\s*)Template(s)?:.*/gm
    ): CompactNodeReference[] {
        const matches = body.matchAll(regex);
        const templateList: ReturnType<typeof this.matchTemplate> = [];
        for (const match of matches) {
            const range = this.calculateRelativeRangeFromBody(body, match);
            for (const template of this.processTemplate(match)) {
                templateList.push({
                    name: template,
                    range,
                });
            }
            break;
        }
        return templateList;
    }
    protected matchSingleEntry(
        body: string,
        regex: RegExp = /^\s*Entry:\s*(?<entry>.*)/m
    ): CompactNodeReference | undefined {
        const matches = body.matchAll(regex);
        if (!matches) {
            return undefined;
        }
        let match: RegExpExecArray | undefined;
        for (const m of matches) {
            match = m;
            break;
        }
        if (match && match.groups && match.groups.entry) {
            const range = this.calculateRelativeRangeFromBody(body, match);
            return {
                name: match.groups.entry.trim(),
                range,
            };
        }
        return undefined;
    }
    protected matchMultipleEntries(
        body: string,
        regex: RegExp = /^\s*Entry:\s*(?<entry>.*)/gm
    ): CompactNodeReference[] {
        const match = body.matchAll(regex);
        const entries: ReturnType<typeof this.matchMultipleEntries> = [];
        for (const entry of match) {
            if (entry.groups && entry.groups.entry) {
                const range = this.calculateRelativeRangeFromBody(body, entry);
                entries.push({
                    name: entry.groups.entry.trim(),
                    range,
                });
            }
        }
        return entries;
    }
    protected matchList(
        body: string,
        regex = /(?<=ListEntry:)(\s*- [\w_\-]+\s*)*/gm
    ): CompactNodeReference[] {
        const matches = body.matchAll(regex);
        if (!matches) {
            return [];
        }
        let match: RegExpExecArray | undefined;
        for (const m of matches) {
            match = m;
            break;
        }
        if (!match) {
            return [];
        }
        const range = this.calculateRelativeRangeFromBody(body, match);
        const matchList = match[0]
            .split('\n')
            .map((line) => line.replace('-', '').trim())
            .filter((line) => line.length > 0)
            .map((line) => ({
                name: line,
                range,
            }));
        return matchList;
    }
    private matchDecorators(body: string, type: registryKey): CompactNodeReference[] {
        const regex = MythicNodeHandler.registry[type].decoratorRegex;
        const matches = body.matchAll(regex);
        const decorators: ReturnType<typeof this.matchDecorators> = [];
        for (const match of matches) {
            const range = this.calculateRelativeRangeFromBody(body, match);
            for (const decorator of this.processTemplate(match)) {
                decorators.push({
                    name: decorator,
                    range,
                });
            }
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

    private matchAttributes(
        body: string
    ): { registry: registryKey; name: string; range: vscode.Range }[] {
        const attributes: ReturnType<typeof this.matchAttributes> = [];
        const matches = body.matchAll(attributeRegex);
        for (const match of matches) {
            const object = executeGetObjectLinkedToAttribute(
                body.substring(0, match.index + 1)
            )?.replace(/@|\?|!|~/g, '');
            if (!object) {
                continue;
            }
            for (const type of registryKey) {
                const objectMatch = MythicNodeHandler.registry[type].referenceMap.get(
                    object.toLowerCase()
                );
                if (objectMatch && objectMatch.has(match.groups!.attribute.toLowerCase())) {
                    const range = this.calculateRelativeRangeFromBody(body, match);
                    attributes.push({
                        registry: type,
                        name: match.groups!.value,
                        range,
                    });
                    break;
                }
            }
        }
        return attributes;
    }

    private matchSkillShortcut(body: string): CompactNodeReference[] {
        const skillShortcutRegex = /-\sskill:([\w\-_]+)/g;
        const matches = body.matchAll(skillShortcutRegex);
        const skillShortcuts: ReturnType<typeof this.matchSkillShortcut> = [];
        for (const match of matches) {
            const range = this.calculateRelativeRangeFromBody(body, match);
            const name = match[1].trim();
            skillShortcuts.push({
                name,
                range,
            });
        }
        return skillShortcuts;
    }

    private matchPlaceholder(body: string) {
        const placeholderRegex = /<([\w\-_.]+)>/g;
        const matches = body.matchAll(placeholderRegex);
        for (const match of matches) {
            const nodes = parseWrittenPlaceholder(match[1]);
            const range = this.calculateRelativeRangeFromBody(body, match);
            let i = 0;
            for (const node of nodes) {
                const registry = fromPlaceholderNodeIdentifierToRegistryKey(node);
                if (registry) {
                    this.addEdge(registry, match[1].split('.')[i], range);
                }
                i++;
            }
        }
    }

    public getTemplatedMetadata<T>(target: string): T | undefined {
        if (this.metadata.has(target)) {
            return this.metadata.get(target) as T;
        }
        for (const template of Array.from(this.templates).reverse()) {
            const templateNode = this.registry.getNode(template[0]);
            if (templateNode) {
                const metadata = templateNode.getTemplatedMetadata<T>(target);
                if (metadata) {
                    return metadata;
                }
            }
        }
        return undefined;
    }
}

// Represents a MythicNode specifically for metaskills, extending the base functionality
// to include condition actions as additional edges.
export class MetaskillMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);
        this.matchConditionActions(body).forEach((action) => {
            this.addEdge('metaskill', action);
        });

        const spell = this.matchSingleEntry(body, /^\s*Spell:\s*(?<entry>.*)/gm);
        if (spell && spell.name.toLowerCase() === 'true') {
            this.metadata.set('spell', true);
        }
    }

    private matchConditionActions(body: string): string[] {
        const conditionActionRegex = new RegExp(
            `\\s(?:${ConditionActions.getConditionActions().join('|')})\\s([\\w\\-_]+)`,
            'gi'
        );
        const matches = body.matchAll(conditionActionRegex);
        const conditionActions: string[] = [];
        for (const match of matches) {
            conditionActions.push(match[1]);
        }
        return conditionActions;
    }
}

// Represents a MythicNode that supports templates, adding functionality to handle
// and validate templates within the node body.
export class TemplatableMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);
        this.matchTemplate(body).forEach((template) => {
            if (this.templates.has(template.name)) {
                createDiagnostic(NodeRawDiagnostic)(
                    this,
                    template.range,
                    `Duplicate template ${template.name} found in ${this.registry.type} ${this.name.text}`,
                    vscode.DiagnosticSeverity.Warning
                );
            }
            this.templates.set(template.name, [template.range]);
        });
    }
}

const variablesRegex =
    /^(?<indent>\s*)Variables:\n(?<variables>((\k<indent> +.*\n)|(\s*?\n)|^\s*#.*)*)/gim;
const variableEntryRegex = /^\s*(?<variable>[\w\-_]+)\s*:/gim;

export class MobMythicNode extends TemplatableMythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        const variables = this.matchVariables(body);
        if (variables) {
            this.metadata.set('variables', variables);
        }
    }

    private matchVariables(body: string) {
        const variableBody = body.matchAll(variablesRegex);
        let firstVariablesKey;
        // I am aware this is dumb, but otherwise it bugs out for no reason
        for (const vb of variableBody) {
            firstVariablesKey = vb;
            break;
        }
        if (!firstVariablesKey) {
            return;
        }
        const templateVariables: Set<string> = new Set();
        const variables = firstVariablesKey.groups?.variables.matchAll(variableEntryRegex);
        if (variables) {
            for (const variable of variables) {
                //console.log(variable);
                const variableName = variable.groups?.variable;
                if (variableName) {
                    templateVariables.add(variableName);
                }
            }
        }
        return templateVariables;
    }

    get variables(): Set<string> {
        const fetchedVariables = new Set<string>();

        const thisVariables = this.metadata.get('variables') as Set<string> | undefined;
        if (thisVariables) {
            thisVariables.forEach((variable) => {
                fetchedVariables.add(variable);
            });
        }

        for (const templateNode of this.templates) {
            const template = MythicNodeHandler.registry.mob.getNode(templateNode[0]);
            if (template) {
                const templateVariables = (template as MobMythicNode).variables;
                if (templateVariables) {
                    templateVariables.forEach((variable) => {
                        fetchedVariables.add(variable);
                    });
                }
            }
        }

        return fetchedVariables;
    }

    get missingVariables(): Set<string> {
        const variables = this.variables;
        const thisVariables = this.metadata.get('variables') as Set<string> | undefined;
        thisVariables?.forEach((thisVariable) => {
            variables.delete(thisVariable);
        });
        return variables;
    }
}

export class ItemMythicNode extends TemplatableMythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        const type = this.matchSingleEntry(body, /^\s*Type:\s*(?<entry>.*)/gm);
        if (type && ['block', 'furniture'].includes(type.name.toLowerCase())) {
            this.metadata.set('type', type.name.toLowerCase());
        }
    }
}

// Represents a MythicNode for stats, extending functionality to include parent stats
// and trigger stats as additional edges.
export class StatMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        this.matchList(body, /(?<=ParentStats:)(\s*- [\w_\-]+\s.*(?:\n|$))*/gm).forEach(
            (template) => {
                if (this.templates.has(template.name)) {
                    createDiagnostic(NodeRawDiagnostic)(
                        this,
                        template.range,
                        `Duplicate template ${template.name} found in ${this.registry.type} ${this.name.text}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                }
                this.templates.set(template.name, [template.range]);
            }
        );

        this.matchList(body, /(?<=TriggerStats:)(\s*- [\w_\-]+\s.*(?:\n|$))*/gm).forEach(
            (outStat) => {
                const outStatName = outStat.name.split(' ')[0];
                if (this.hasEdge('stat', outStatName)) {
                    createDiagnostic(NodeRawDiagnostic)(
                        this,
                        outStat.range,
                        `Duplicate TriggerStat ${outStatName} found in ${this.registry.type} ${this.name.text}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                }
                this.addEdge('stat', outStatName, outStat.range);
            }
        );
    }
}

// Represents a MythicNode for random spawns, adding functionality to handle mob types
// and templates specific to random spawn configurations.
export class RandomSpawnMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        const typelist: CompactNodeReference[] = [];
        this.matchList(body, /(?<=Types:)(\s*- [\w_\-]+\s\d+\s*)*/gm).forEach((mob) => {
            typelist.push({
                name: mob.name.split(' ')[0],
                range: mob.range,
            });
        });

        (typelist.length > 0 ? typelist : this.matchTemplate(body, /^\s*Type(s)?:.*/gm)).forEach(
            (mob) => {
                if (this.hasEdge('mob', mob.name)) {
                    createDiagnostic(NodeRawDiagnostic)(
                        this,
                        mob.range,
                        `Duplicate mob ${mob.name} found in ${this.registry.type} ${this.name.text}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                }
                this.addEdge('mob', mob.name, mob.range);
            }
        );
    }
}

class ArchetypeMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        this.matchList(body, /(?<=BaseStats:)(\s*- [\w_\-]+\s.*(?:\n|$))*/gm).forEach((stat) => {
            const statName = stat.name.split(' ')[0];
            this.addEdge('stat', statName, stat.range);
        });

        this.matchList(body, /(?<=StatModifiers:)(\s*- [\w_\-]+\s.*(?:\n|$))*/gm).forEach(
            (stat) => {
                const statName = stat.name.split(' ')[0];
                this.addEdge('stat', statName, stat.range);
            }
        );

        this.matchList(body, /(?<=Bindings:)(\s*- [\w_\-]+\s.*(?:\n|$))*/gm).forEach((skill) => {
            const skillName = skill.name.split(' ')[1];
            this.addEdge('metaskill', skillName, skill.range);
        });
    }
}

class ReagentMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        const regexes: RegExp[] = [
            /^\s*MaxValue:\s*stat\.(?<entry>.*)/gm,
            /^\s*MinValue:\s*stat\.(?<entry>.*)/gm,
        ];

        regexes.forEach((regex) => {
            const stat = this.matchSingleEntry(body, regex);
            if (stat) {
                this.addEdge('stat', stat.name, stat.range);
            }
        });
    }
}

class AchievementMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        this.matchMultipleEntries(body, /^\s*MobType:\s*(?<entry>.*)/gm).forEach((mob) => {
            if (this.hasEdge('mob', mob.name)) {
                createDiagnostic(NodeRawDiagnostic)(
                    this,
                    mob.range,
                    `Duplicate Mob ${mob.name} found in ${this.registry.type} ${this.name.text}`,
                    vscode.DiagnosticSeverity.Warning
                );
            }
            this.addEdge('mob', mob.name, mob.range);
        });
    }
}

const mockRange = new vscode.Range(0, 0, 0, 0);
export class MockMythicNode extends MythicNode {
    constructor(registry: MythicNodeRegistry, name: string, creator: MythicNode) {
        const document = vscode.workspace.textDocuments[0];
        const range = creator.range;
        const description = {
            text: undefined,
            range: mockRange,
        };
        const body = {
            text: undefined,
            range: mockRange,
        };
        const mockName = {
            text: name,
            range: creator.name.range,
        };
        super(registry, document, range, description, mockName, body);
    }
    get hash(): string {
        return `Mock:${this.name.text}@${this.registry.type}`;
    }
}

export class MythicNodeRegistry {
    readonly type: registryKey;
    referenceAttributes: Set<string> = new Set();
    referenceMap: Map<string, Set<string>> = new Map();
    nodes: NodeEntry = new Map();
    nodesByDocument: Map<string, MythicNode[]> = new Map();
    diagnosticsByDocument: Map<string, vscode.Diagnostic[]> = new Map();
    decoratorRegex: RegExp;
    backingDataset: string | undefined;

    constructor(
        registry: keyof typeof MythicNodeHandler.registry,
        private clazz: typeof MythicNode = MythicNode,
        backingDataset?: string
    ) {
        this.type = registry;
        this.decoratorRegex = new RegExp(`^\\s*#\\s?@${registry}?\\s*[\\w\\-_]*\\s*:.+`, 'gm');
        this.backingDataset = backingDataset;
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

    hasNode(name: string): boolean {
        return (
            this.nodes.has(name) ||
            (this.backingDataset === undefined
                ? false
                : !!ScribeEnumHandler.getEnum(this.backingDataset)?.has(name, true))
        );
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

    clearDiagnosticsByDocument(uri: vscode.Uri): void {
        ScribeDiagnostics.delete(uri);
        const diagnostics = this.diagnosticsByDocument.get(uri.toString());
        if (diagnostics && diagnostics.length > 0) {
            diagnostics.forEach((diagnostic) => {
                Log.trace(`Unregistered ${this.type} ${diagnostic.message} in ${uri.toString()}`);
            });
        }
        this.diagnosticsByDocument.delete(uri.toString());
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

            const node = new this.clazz(
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
    updateDocument(document: vscode.TextDocument): void {
        this.clearDocument(document.uri);
        this.scanDocument(document);
        if (!getDiagnosticsPolicyConfig('enabled')) {
            return;
        }
        this.checkForBrokenEdges(document.uri);
        this.updateDiagnostics(document.uri);
    }

    updateDiagnostics(uri: vscode.Uri) {
        ScribeDiagnostics.set(uri, this.diagnosticsByDocument.get(uri.toString()));
    }

    clearDocument(uri: vscode.Uri): void {
        this.clearNodesByDocument(uri);
        this.clearDiagnosticsByDocument(uri);
    }

    checkForBrokenEdges(uri: vscode.Uri): void {
        const nodes = this.nodesByDocument.get(uri.toString());
        if (!nodes) {
            return;
        }
        for (const node of nodes.values()) {
            for (const [registry, entries] of Object.entries(node.outEdge)) {
                for (const [entry, ranges] of entries) {
                    const edgeNode =
                        MythicNodeHandler.registry[registry as registryKey].hasNode(entry);
                    if (edgeNode) {
                        continue;
                    }
                    for (const range of ranges) {
                        createDiagnostic(NodeDiagnostic)(
                            node,
                            range,
                            `Unresolved ${registry} at ${node.name.text} -> ${entry}`,
                            vscode.DiagnosticSeverity.Warning
                        );
                    }
                }
            }
        }
    }
}

let attributeRegex: RegExp;
function updateAttributeRegex() {
    const attributes = new Set<string>();
    for (const type of registryKey) {
        for (const attribute of MythicNodeHandler.registry[type].referenceAttributes) {
            attributes.add(attribute);
        }
    }
    attributeRegex = new RegExp(
        `(?<=[\\{;]\\s*)(?<attribute>${Array.from(attributes).join('|')})\\s*=\\s*(?<value>[\\w\\-_]+)(?=\\s*[;\\}])`,
        'gi'
    );
}

export namespace MythicNodeHandler {
    export const registry: Record<registryKey, MythicNodeRegistry> = {
        metaskill: new MythicNodeRegistry('metaskill', MetaskillMythicNode),
        mob: new MythicNodeRegistry('mob', MobMythicNode),
        item: new MythicNodeRegistry('item', ItemMythicNode, 'material'),
        droptable: new MythicNodeRegistry('droptable'),
        stat: new MythicNodeRegistry('stat', StatMythicNode),
        pin: new MythicNodeRegistry('pin'),
        placeholder: new MythicNodeRegistry('placeholder'),
        randomspawn: new MythicNodeRegistry('randomspawn', RandomSpawnMythicNode),
        archetype: new MythicNodeRegistry('archetype', ArchetypeMythicNode),
        reagent: new MythicNodeRegistry('reagent', ReagentMythicNode),
        menu: new MythicNodeRegistry('menu'),
        achievement: new MythicNodeRegistry('achievement', AchievementMythicNode),
    };

    export function getRegistry(key: string): MythicNodeRegistry | undefined {
        if (!(key in registry)) {
            return undefined;
        }
        return registry[key as keyof typeof registry];
    }

    export function clearNodes(): void {
        for (const key in registry) {
            MythicNodeHandler.registry[key as keyof typeof registry].clearNodes();
        }
    }

    type ProcessFileResult = [registryKey, vscode.TextDocument] | null;
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
        updateAttributeRegex();

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

        time.step();
        const files = await vscode.workspace.findFiles(
            include,
            exclude && exclude !== '' ? exclude : undefined
        );
        Log.custom(vscode.LogLevel.Trace, 'Time Report', `Document Find Time: ${time.step()} ms`);

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
        Log.custom(vscode.LogLevel.Trace, 'Time Report', `Document Open Time: ${time.step()} ms`);

        for (const [type, file] of openedFiles) {
            registry[type].scanDocument(file);
        }
        Log.custom(vscode.LogLevel.Trace, 'Time Report', `Document Scan Time: ${time.step()} ms`);

        if (getDiagnosticsPolicyConfig('enabled')) {
            for (const [type, file] of openedFiles) {
                registry[type].checkForBrokenEdges(file.uri);
                registry[type].updateDiagnostics(file.uri);
            }
        }
        Log.custom(
            vscode.LogLevel.Trace,
            'Time Report',
            `Document Node Check Time: ${time.step()} ms`
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
