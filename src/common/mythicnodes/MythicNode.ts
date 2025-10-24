import * as vscode from 'vscode';
import pLimit from 'p-limit';
import {
    fromPlaceholderNodeIdentifierToRegistryKey,
    parseWrittenPlaceholder,
} from '@common/datasets/ScribePlaceholder';
import { ConditionActions } from '@common/schemas/conditionActions';
import { EnumDatasetValue, ScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { MythicMechanic, ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';
import { scribeCodeLensProvider as nodeLens } from '@common/providers/codeLensProvider';

import {
    createNodeDiagnostic,
    NodeDiagnostic,
    NodeRawDiagnostic,
    NodeDiagnosticCollection,
} from '../providers/diagnosticProvider';
import { checkFileType } from '../subscriptions/SubscriptionHelper';
import { getLogger } from '../providers/loggerProvider';
import { ConfigProvider } from '../providers/configProvider';
import { timeCounter } from '../utils/timeUtils';
import { executeGetObjectLinkedToAttribute } from '../utils/cursorutils';
import { registryKey } from '../objectInfos';
import { nodeDecorations, updateActiveEditorDecorations } from './utils/NodeDecorations';
import { loadNodeEvents } from './utils/NodeEvents';
import { DocumentDataMap } from './utils/NodeDataStructures';
import { getMechanicFromComment } from './comment-parser/comment-parser';

export type NodeEntry = Map<string, MythicNode>;
type NodeReferenceValue = Map<string, vscode.Range[]>;
type NodeReference = Partial<Record<registryKey, NodeReferenceValue>>;

type CompactNodeReference = { name: string; range: vscode.Range };

type SoundMap = {
    sound: string;
    pitch?: string;
    volume?: string;
};

interface NodeBaseElement {
    text: string | undefined;
    range: vscode.Range;
}

interface NodeElement extends NodeBaseElement {
    text: string;
}

enum ParserIntructions {
    // Disable parsing for the file
    DISABLE_PARSING = '# mythicscribe-disable file-parsing',
}

const NodeRegex =
    /(?<descriptionkey>(?<description>(?:^#.*$\r?\n\r?)*)^(?<key>[\w\-\_]+):)(?<body>(?:.*(?:\r?\n\r?(?!((^#.*$\r?\n\r?)*)^([\w\-\_]+):))?)*)/gm;

let attributeRegex: RegExp;
const soundMechanicInfo = {
    mechanic: [] as string[],
    sound: [] as string[],
    pitch: [] as string[],
    volume: [] as string[],
    defaults: {
        sound: '',
        pitch: '',
        volume: '',
    },
};

loadNodeEvents();

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
        this.processDescription();

        if (!this.body.text) {
            return;
        }

        for (const type of registryKey) {
            this.matchDecorators(this.body.text, type).forEach((decorator) => {
                this.addEdge(type, decorator.name, decorator.range);
            });
        }

        // Remove comments from the body text
        this.body.text = this.body.text
            .split('\n')
            .map((line) => line.replace(/(^|\s)\s*#.*/m, ''))
            .join('\n');

        this.findNodeEdges(this.body.text);

        body.text = undefined;
    }

    protected processDescription(): void {
        if (this.description.text) {
            for (const type of registryKey) {
                this.matchDecorators(this.description.text, type).forEach((decorator) => {
                    this.addEdge(type, decorator.name, decorator.range);
                });
            }
        }

        this.description.text = this.description.text?.replace(/^#/gm, '');
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

        this.matchPlaceholders(body);

        this.matchSounds(body);
    }

    // Match all sound mechanics so that the decoration can be added
    private matchSounds(body: string) {
        const soundMechanics = this.matchSimpleMechanics(body, soundMechanicInfo.mechanic);
        for (const mechanic of soundMechanics) {
            const sound = mechanic.args
                .find((arg) => soundMechanicInfo.sound.includes(arg.attribute.trim().toLowerCase()))
                ?.value.replace(/^minecraft:/gm, '');
            if (!sound) {
                continue;
            }
            const firstsound = (
                ScribeEnumHandler.getEnum('sound')?.getDataset().get(sound.toLowerCase()) as
                    | (EnumDatasetValue & { sounds: string[] })
                    | undefined
            )?.sounds[0];
            if (!firstsound) {
                continue;
            }
            const pitchTemp = mechanic.args.find((arg) =>
                soundMechanicInfo.pitch.includes(arg.attribute.trim().toLowerCase())
            )?.value;
            const pitch = pitchTemp
                ? Math.min(Math.max(parseFloat(pitchTemp), 0.5), 2.0)
                : undefined;

            const volumeTemp = mechanic.args.find((arg) =>
                soundMechanicInfo.volume.includes(arg.attribute.trim().toLowerCase())
            )?.value;
            const volume = volumeTemp
                ? Math.min(Math.max(parseFloat(volumeTemp), 0), 1)
                : undefined;

            const soundMap = {
                sound: firstsound || soundMechanicInfo.defaults.sound,
                pitch: pitch && !isNaN(pitch) ? pitch.toString() : soundMechanicInfo.defaults.pitch,
                volume:
                    volume && !isNaN(volume)
                        ? volume.toString()
                        : soundMechanicInfo.defaults.volume,
            };
            if (!this.metadata.has('soundPlayback')) {
                this.metadata.set('soundPlayback', []);
            }
            (this.metadata.get('soundPlayback') as SoundMap[]).push(soundMap);

            nodeDecorations.addNodeDecoration(
                this,
                mechanic.range,
                'specificSoundPlayback',
                undefined,
                {
                    range: mechanic.range,
                    isResolved: true,
                    command: {
                        title: `▶ Play sound`,
                        command: 'MythicScribe.external.minecraftsounds.playback',
                        arguments: [
                            undefined,
                            {
                                s0: soundMap.sound,
                                p0: soundMap.pitch,
                                v0: soundMap.volume,
                            },
                        ],
                    },
                }
            );
        }

        const soundPlaybacks = this.metadata.get('soundPlayback') as SoundMap[] | undefined;
        if (!soundPlaybacks || soundPlaybacks.length === 0) {
            return;
        }
        const soundList: Record<string, string> = {};
        soundPlaybacks.forEach((sound, index) => {
            soundList[`s${index}`] = sound.sound || soundMechanicInfo.defaults.sound;
            soundList[`p${index}`] = sound.pitch || soundMechanicInfo.defaults.pitch;
            soundList[`v${index}`] = sound.volume || soundMechanicInfo.defaults.volume;
        });
        nodeDecorations.addNodeDecoration(this, this.name.range, 'soundPlayback', undefined, {
            range: this.name.range,
            isResolved: true,
            command: {
                title: `▶ Play all sounds`,
                command: 'MythicScribe.external.minecraftsounds.playback',
                arguments: [undefined, soundList],
            },
        });
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
        const skillShortcutRegex = /(?<=-\sskill:)([\w\-_]+)/g;
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

    private matchPlaceholders(body: string) {
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

    private matchSimpleMechanics(
        body: string,
        names: string[]
    ): { name: string; range: vscode.Range; args: { attribute: string; value: string }[] }[] {
        const acc: ReturnType<typeof this.matchSimpleMechanics> = [];
        const regex = new RegExp(`- (?<name>${names.join('|')}){(?<args>.*)}`, 'gm');
        const matches = body.matchAll(regex);
        for (const match of matches) {
            const range = this.normalizeRelativeRange(
                this.calculateRelativeRangeFromBody(body, match)
            );
            const name = match.groups!.name;
            const args: { attribute: string; value: string }[] = [];
            match.groups!.args?.split(';').map((arg) => {
                const [attribute, value] = arg.split('=').map((s) => s.trim());
                if (attribute && value) {
                    args.push({ attribute, value });
                }
            });
            acc.push({ name, range, args });
        }
        return acc;
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

const SkillParameterRegex = /<skill\.(?<parameter>[\w_\-]+)>/gms;

// Represents a MythicNode specifically for metaskills, extending the base functionality
// to include condition actions as additional edges.
export class MetaskillMythicNode extends MythicNode {
    public mechanic: MythicMechanic | undefined;
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);
        this.matchConditionActions(body).forEach((action) => {
            this.addEdge('metaskill', action);
        });

        const spell = this.matchSingleEntry(body, /^\s*Spell:\s*(?<entry>.*)/gm);
        if (spell && spell.name.toLowerCase() === 'true') {
            this.metadata.set('spell', true);
        }

        if (ConfigProvider.registry.decorationOptions.get('delayTracking')) {
            this.matchDelays(body);
        }

        if (!this.metadata.has('lambdaMechanic')) {
            const skillParameters = body.matchAll(SkillParameterRegex);
            if (skillParameters) {
                const params: Set<string> = new Set();
                for (const match of skillParameters) {
                    const placeholder = match.groups?.parameter;
                    if (placeholder) {
                        params.add(placeholder);
                    }
                }
                if (params.size > 0) {
                    nodeDecorations.addNodeDecoration(
                        this,
                        this.name.range,
                        'createMetaskillDocumentation',
                        undefined,
                        {
                            range: this.name.range,
                            isResolved: true,
                            command: {
                                title: `🛈 Create Metaskill Documentation`,
                                command: 'MythicScribe.createMetaskillDocumentation',
                                arguments: [params, this.description.range.start],
                            },
                        }
                    );
                }
            }
        }
    }

    protected processDescription(): void {
        super.processDescription();
        if (this.description.text?.includes('@mechanic')) {
            const parseableComment = this.description.text.split('@mechanic', 2);
            const mechanic = getMechanicFromComment(parseableComment[1], this);
            if (mechanic) {
                this.metadata.set(
                    'lambdaMechanic',
                    new MythicMechanic(mechanic, ScribeMechanicHandler.registry.mechanic)
                );
            }
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

    private matchDelays(body: string): void {
        type delay = { integer: number; string: string; intra: number };
        const delays: delay[] = [{ integer: 0, string: '', intra: 0 }];
        const regex = /(- delay ([^\s]*))|\[|\]|(^\s*[^#:\s]+:)/gm;
        const matches = body.matchAll(regex);

        function findDelays(match: RegExpExecArray): boolean {
            if (match[0] === '[') {
                delays.push({
                    integer: delays[delays.length - 1].integer,
                    string: delays[delays.length - 1].string,
                    intra: delays[delays.length - 1].intra,
                });
                return false;
            } else if (match[0] === ']') {
                if (delays.length === 1) {
                    return false;
                }
                delays.pop();
                return false;
            } else if (match[3]) {
                delays.length = 0;
                delays.push({
                    integer: 0,
                    string: '',
                    intra: 0,
                });
                return false;
            } else if (!match[2]) {
                return false;
            }

            const delayString = match[2].trim();
            const delayInteger = parseInt(delayString);

            if (isNaN(delayInteger)) {
                delays[delays.length - 1].string +=
                    (delays[delays.length - 1].string.length > 0 ? '+' : '') + delayString;
            } else {
                if (delayInteger === 0) {
                    delays[delays.length - 1].intra += 1;
                } else {
                    delays[delays.length - 1].integer += delayInteger;
                    delays[delays.length - 1].intra = 0;
                }
            }
            return true;
        }

        for (const match of matches) {
            if (!findDelays(match)) {
                continue;
            }
            const lastDelay = delays[delays.length - 1];

            let text = '⟶ ';
            let status = [0, 0, 0];
            if (lastDelay.integer > 0) {
                text += lastDelay.integer;
                status[0] = 1;
            }
            if (lastDelay.string.length > 0) {
                if (status[0] === 1) {
                    text += '+';
                }
                text += lastDelay.string;
                status[1] = 1;
            }
            if (lastDelay.intra > 0) {
                if (status[0] === 1 || status[1] === 1) {
                    text += ' ticks and ';
                }
                text += `${lastDelay.intra} intraticks`;
                status[2] = 1;
            } else {
                text += ' ticks';
            }

            if (status.every((s) => s === 0)) {
                continue;
            }

            nodeDecorations.addNodeDecoration(
                this,
                this.normalizeRelativeRange(this.calculateRelativeRangeFromBody(body, match)),
                'delayTracking',
                {
                    renderOptions: {
                        after: {
                            contentText: text,
                        },
                    },
                }
            );
        }
    }
}

// Represents a MythicNode that supports templates, adding functionality to handle
// and validate templates within the node body.
export class TemplatableMythicNode extends MythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);
        this.matchTemplate(body).forEach((template) => {
            if (this.templates.has(template.name)) {
                createNodeDiagnostic(NodeRawDiagnostic)(
                    this,
                    template.range,
                    `Duplicate template ${template.name} found in ${this.registry.type} ${this.name.text}`,
                    vscode.DiagnosticSeverity.Warning
                );
            }
            this.templates.set(template.name, [this.normalizeRelativeRange(template.range)]);
        });
    }
}

const variablesRegex =
    /^\r?\n?(?<indent>\s*)Variables:\r?\n(?<variables>((\k<indent> +.*\r?\n)|(\s*?\r?\n)|^\s*#.*)*)/m;
const variableEntryRegex = /^\s*(?<variable>[\w\-_]+)\s*:/gm;

export class MobMythicNode extends TemplatableMythicNode {
    protected findNodeEdges(body: string): void {
        super.findNodeEdges(body);

        const variables = this.matchVariables(body);
        if (variables) {
            this.metadata.set('variables', variables);
        }
    }

    private matchVariables(body: string) {
        const variableBody = body.match(variablesRegex);
        if (!variableBody) {
            return;
        }
        const templateVariables: Set<string> = new Set();
        const variables = variableBody.groups?.variables.matchAll(variableEntryRegex);
        if (variables) {
            for (const variable of variables) {
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

        const equipmentSet = this.matchSingleEntry(body, /^\s*EquipmentSet:\s*(?<entry>.*)/gm);
        if (equipmentSet) {
            this.addEdge('equipmentset', equipmentSet.name, equipmentSet.range);
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
                    createNodeDiagnostic(NodeRawDiagnostic)(
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
                    createNodeDiagnostic(NodeRawDiagnostic)(
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
                    createNodeDiagnostic(NodeRawDiagnostic)(
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
                createNodeDiagnostic(NodeRawDiagnostic)(
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
    documentDataMap = new DocumentDataMap();
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
        this.documentDataMap.get(documentUri).addNode(node);
        getLogger().trace(
            `Registered ${this.type} ${node.name.text} in ${node.document.uri.toString()}`
        );
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
        this.documentDataMap.clear();
    }

    clearNodesByDocument(uri: vscode.Uri): void {
        const uriString = uri.toString();
        const documentData = this.documentDataMap.get(uriString);
        const nodesToRemove = documentData.nodes;
        if (nodesToRemove) {
            nodesToRemove.forEach((node) => {
                getLogger().trace(`Unregistered ${this.type} ${node.name.text} in ${uriString}`);
                this.nodes.delete(node.name.text);
            });
        }
        documentData.clearNodes();
    }

    clearDiagnosticsByDocument(uri: vscode.Uri): void {
        NodeDiagnosticCollection.delete(uri);
        const uriString = uri.toString();
        const documentData = this.documentDataMap.get(uriString);
        const diagnostics = documentData.diagnostics;
        if (diagnostics && diagnostics.length > 0) {
            diagnostics.forEach((diagnostic) => {
                getLogger().trace(
                    `Unregistered ${this.type} ${diagnostic.message} in ${uriString}`
                );
            });
        }
        documentData.clearDiagnostics();
    }

    // clearDecorationsByDocument(uri: vscode.Uri): void {
    //     const uriString = uri.toString();
    //     const documentData = this.documentDataMap.get(uriString);
    //     const activeEditor = vscode.window.activeTextEditor;
    //     if (activeEditor && activeEditor.document.uri.toString() === uriString) {
    //         const decorations = documentData.decorations;
    //         if (decorations) {
    //             for (const [_key, decoration] of decorations) {
    //                 activeEditor.setDecorations(decoration.decorationType, []);
    //             }
    //         }
    //     }
    //     documentData.clearDecorations();
    // }

    scanDocument(document: vscode.TextDocument): void {
        if (document.lineAt(0).text === ParserIntructions.DISABLE_PARSING) {
            getLogger().debug(`Parsing disabled for ${document.uri.toString()}`);
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
        if (!ConfigProvider.registry.diagnosticsPolicy.get('enabled')) {
            return;
        }
        this.checkForBrokenEdges(document.uri);
        this.updateDiagnostics(document.uri);
    }

    updateDiagnostics(uri: vscode.Uri) {
        NodeDiagnosticCollection.set(uri, this.documentDataMap.get(uri.toString()).diagnostics);
    }

    clearDocument(uri: vscode.Uri): void {
        this.documentDataMap.clearDocument(uri.toString());
        nodeDecorations.resetCacheForDocument(uri);
        nodeLens.clearCodeLensesForDocument(uri);
    }

    checkForBrokenEdges(uri: vscode.Uri): void {
        const nodes = this.documentDataMap.get(uri.toString()).nodes;
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
                        createNodeDiagnostic(NodeDiagnostic)(
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

function updateGlobalVariables() {
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

    const soundMechanic = ScribeMechanicHandler.registry.mechanic.getMechanicByName('sound');
    if (soundMechanic) {
        for (const name of soundMechanic.name) {
            soundMechanicInfo.mechanic.push(name);
        }

        const soundAttribute = soundMechanic.getAttributeByName('sound');
        soundMechanicInfo.defaults.sound =
            soundAttribute?.default_value || 'entity.zombie.attack_iron_door';
        for (const sound of soundAttribute?.name || []) {
            soundMechanicInfo.sound.push(sound);
        }

        const volumeAttribute = soundMechanic.getAttributeByName('volume');
        soundMechanicInfo.defaults.volume = volumeAttribute?.default_value || '1';
        for (const volume of volumeAttribute?.name || []) {
            soundMechanicInfo.volume.push(volume);
        }

        const pitchAttribute = soundMechanic.getAttributeByName('pitch');
        soundMechanicInfo.defaults.pitch = pitchAttribute?.default_value || '1';
        for (const pitch of pitchAttribute?.name || []) {
            soundMechanicInfo.pitch.push(pitch);
        }
    }
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
        equipmentset: new MythicNodeRegistry('equipmentset'),
        archetype: new MythicNodeRegistry('archetype', ArchetypeMythicNode),
        reagent: new MythicNodeRegistry('reagent', ReagentMythicNode),
        menu: new MythicNodeRegistry('menu'),
        achievement: new MythicNodeRegistry('achievement', AchievementMythicNode),
    };

    export function getRegistry(key: keyof typeof registry): MythicNodeRegistry {
        return registry[key];
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
        updateGlobalVariables();

        const time = timeCounter();
        getLogger().debug('Scanning all documents');

        // Find the relevant documents
        const include =
            (ConfigProvider.registry.fileParsingPolicy.get('parsingGlobPattern') as
                | string
                | undefined) || '**/*.{yaml,yml}';

        const exclude = ConfigProvider.registry.fileParsingPolicy.get('excludeGlobPattern') as
            | string
            | undefined;

        getLogger().debug(`Parsing files with include: ${include} and exclude: ${exclude}`);

        time.step();
        const files = await vscode.workspace.findFiles(
            include,
            exclude && exclude !== '' ? exclude : undefined
        );
        getLogger().log(
            `Document Find Time: ${time.step()} ms`,
            vscode.LogLevel.Debug,
            'Time Report'
        );

        // Process all files, filtering out those that are not relevant and opening up the rest
        const limitAmount = ConfigProvider.registry.fileParsingPolicy.get(
            'parallelParsingLimit'
        ) as number;
        if (limitAmount <= 0) {
            getLogger().warn('File Parsing disabled because parallelParsingLimit is set to <=0');
            return;
        }
        const limit = pLimit(limitAmount);

        const tasks = files.map((file) => limit(() => processFile(file)));
        const results = await Promise.allSettled(tasks);
        getLogger().debug(`Found ${results.length} files`);
        const openedFiles = results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter((result) => result !== null);
        getLogger().debug(`Opened ${openedFiles.length} files`);
        const rejected = results.filter((result) => result.status === 'rejected');
        if (rejected.length > 0) {
            getLogger().debug(`Failed to open ${rejected.length} files`);
            rejected.forEach((rejection, index) =>
                getLogger().debug(`Reason ${index}: ${rejection.reason}`)
            );
        }
        getLogger().log(
            `Document Open Time: ${time.step()} ms`,
            vscode.LogLevel.Debug,
            'Time Report'
        );

        // Scan all opened files
        for (const [type, file] of openedFiles) {
            registry[type].scanDocument(file);
        }
        getLogger().log(
            `Document Scan Time: ${time.step()} ms`,
            vscode.LogLevel.Debug,
            'Time Report'
        );

        if (ConfigProvider.registry.diagnosticsPolicy.get('enabled')) {
            for (const [type, file] of openedFiles) {
                registry[type].checkForBrokenEdges(file.uri);
                registry[type].updateDiagnostics(file.uri);
            }
            getLogger().log(
                `Document Node Check Time: ${time.step()} ms`,
                vscode.LogLevel.Debug,
                'Time Report'
            );
        }

        getLogger().log(
            `Total Time for File Parsing: ${time.stop()}`,
            vscode.LogLevel.Debug,
            'Time Report'
        );
        getLogger().debug('Finished scanning all documents');
        updateActiveEditorDecorations();
    }
}
