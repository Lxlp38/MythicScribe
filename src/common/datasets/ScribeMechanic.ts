import * as vscode from 'vscode';
import { getDirectoryFiles } from '@node/datasets/ScribeMechanic';

import { checkEnabledPlugin } from '../utils/configutils';
import { AbstractScribeEnum, ScribeEnumHandler } from './ScribeEnum';
import { ctx } from '../../MythicScribe';
import { ScribeCloneableFile } from './datasets';
import { addMechanicCompletions } from '../utils/completionhelper';
import { attributeSpecialValues } from './enumSources';
import { MythicNodeHandler } from '../mythicnodes/MythicNode';
import { registryKey } from '../objectInfos';
import { timeCounter } from '../utils/timeUtils';
import Log from '../utils/logger';

export enum ObjectType {
    MECHANIC = 'Mechanic',
    ATTRIBUTE = 'Attribute',
    TARGETER = 'Targeter',
    CONDITION = 'Condition',
    INLINECONDITION = 'Inline Condition',
    TRIGGER = 'Trigger',
    AITARGET = 'AITarget',
    AIGOAL = 'AIGoal',
}

export type MechanicDataset = Mechanic[];

export abstract class AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /null/;
    readonly type: ObjectType = ObjectType.MECHANIC;
    readonly folder: string = 'null';
    readonly files: string[] = [];
    readonly defaultExtend: string | undefined = undefined;
    private mechanics: MythicMechanic[] = [];
    private mechanicsNameMap: Map<string, MythicMechanic> = new Map();
    private mechanicsClassMap: Map<string, MythicMechanic> = new Map();
    private mechanicCompletionsCache: vscode.CompletionItem[] = [];
    get mechanicCompletions() {
        return this.mechanicCompletionsCache;
    }

    get localPath(): string {
        return vscode.Uri.joinPath(ctx.extensionUri, 'data', this.folder).toString();
    }

    async addMechanic(...mechanic: Mechanic[]) {
        mechanic.forEach((m) => {
            if (!checkEnabledPlugin(m.plugin)) {
                return;
            }
            const mythicMechanic = new MythicMechanic(m, this);
            this.mechanics.push(mythicMechanic);
            m.name.forEach((name) => {
                this.mechanicsNameMap.set(name.toLowerCase(), mythicMechanic);
            });
            this.mechanicsClassMap.set(m.class.toLowerCase(), mythicMechanic);
            addMechanicCompletions(
                [mythicMechanic],
                this.mechanicCompletionsCache,
                this.defaultExtend
            );
        });
        const uniquePlugins = Array.from(new Set(mechanic.map((m) => m.plugin))).sort();
        Log.debug(
            `Added ${mechanic.length} ${this.type}s. The registering Plugins are: ${uniquePlugins.join(', ')}`
        );
        return;
    }

    regexMatches(text: string): boolean {
        return this.regex.test(text);
    }

    getMechanics(): MythicMechanic[] {
        return this.mechanics;
    }

    getMechanicByName(name: string): MythicMechanic | undefined {
        return this.mechanicsNameMap.get(name.toLowerCase());
    }

    getMechanicByClass(name: string): MythicMechanic | undefined {
        return this.mechanicsClassMap.get(name.toLowerCase());
    }

    emptyDatasets() {
        this.mechanics = [];
        this.mechanicsNameMap.clear();
        this.mechanicsClassMap.clear();
        this.mechanicCompletionsCache = [];
    }

    async loadDataset() {
        const time = timeCounter();
        Log.debug(`Loading ${this.type} Dataset`);
        const directoryFiles: vscode.Uri[] = await getDirectoryFiles(this);
        const files = directoryFiles.map((file) => new ScribeCloneableFile<Mechanic>(file));
        const promises = files.map((file) => file.get());
        const result = await Promise.allSettled(promises);
        const loadDatasetPromises = result.map((promise) => {
            if (promise.status === 'fulfilled') {
                return this.addMechanic(...promise.value);
            }
            Log.error(`Failed to load ${this.type} dataset: ${promise.reason}`);
            return;
        });
        await Promise.allSettled(loadDatasetPromises);
        Log.debug(`Loaded ${this.type} Dataset in`, time.stop());
        return;
    }
}
class ScribeMechanicRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.MECHANIC;
    readonly folder: string = 'mechanics';
    readonly files = ['MythicMobs', 'MythicCrucible', 'ModelEngine'];
}
class ScribeTargeterRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s=]@)[\w:]+/gm;
    readonly type: ObjectType = ObjectType.TARGETER;
    readonly folder: string = 'targeters';
    readonly files = ['MythicMobs', 'MythicCrucible', 'ModelEngine'];
}
class ScribeConditionRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.CONDITION;
    readonly folder: string = 'conditions';
    readonly files = ['MythicMobs', 'ModelEngine'];
}
class ScribeInlineConditionRegistry extends ScribeConditionRegistry {
    readonly regex: RegExp = /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm;
    readonly type: ObjectType = ObjectType.INLINECONDITION;
    getMechanics(): MythicMechanic[] {
        return ScribeMechanicHandler.registry.condition.getMechanics();
    }
    getMechanicByName(name: string): MythicMechanic | undefined {
        return ScribeMechanicHandler.registry.condition.getMechanicByName(name);
    }
    getMechanicByClass(name: string): MythicMechanic | undefined {
        return ScribeMechanicHandler.registry.condition.getMechanicByClass(name);
    }
    async loadDataset(): Promise<void> {
        return;
    }
}
class ScribeTriggerRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s~)on[\w:]+/gm;
    readonly type: ObjectType = ObjectType.TRIGGER;
    readonly folder: string = 'triggers';
    readonly files = ['MythicMobs', 'MythicCrucible'];
}
class ScribeAITargetRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AITARGET;
    readonly folder: string = 'aitargets';
    readonly files = ['MythicMobs'];
    readonly defaultExtend: string = 'WrappedPathfindingGoal';
}
class ScribeAIGoalRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AIGOAL;
    readonly folder: string = 'aigoals';
    readonly files = ['MythicMobs'];
    readonly defaultExtend: string = 'WrappedPathfindingGoal';
}

export interface Mechanic {
    plugin: string;
    class: string;
    extends?: string;
    implements?: string[];
    name: string[];
    description: string;
    link: string;
    attributes: Attribute[];
}

export class MythicMechanic {
    readonly registry: AbstractScribeMechanicRegistry;

    readonly plugin: string;
    readonly class: string;
    readonly extends?: string;
    readonly implements?: string[];
    readonly name: string[];
    readonly description: string;
    readonly link: string;

    protected myAttributes: MythicAttribute[] = [];
    protected attributes: MythicAttribute[] = [];
    protected attributesNameMap: Map<string, MythicAttribute> = new Map();

    private hasAlreadyInheritedAttributes: boolean = false;

    public enumAddedAttributesCache: string[] = [];

    constructor(mechanic: Mechanic, registry: AbstractScribeMechanicRegistry) {
        this.registry = registry;
        this.plugin = mechanic.plugin;
        this.class = mechanic.class;
        this.extends = mechanic.extends;
        this.implements = mechanic.implements;
        this.name = mechanic.name;
        this.description = mechanic.description;
        this.link = mechanic.link;
        mechanic.attributes.map((a) => this.addAttribute(a));
        this.myAttributes = this.attributes;
    }

    public getMyAttributes(): MythicAttribute[] {
        return this.myAttributes;
    }

    public getAttributes(): MythicAttribute[] {
        if (!this.hasAlreadyInheritedAttributes) {
            this.inheritAttributes();
        }
        return this.attributes;
    }

    public addAttribute(attribute: Attribute) {
        const newAttribute = new MythicAttribute(attribute, this);
        this.attributes.push(newAttribute);
        this.addAttributeToNameMap(newAttribute);
    }

    public getAttributeByName(name: string): MythicAttribute | undefined {
        if (!this.hasAlreadyInheritedAttributes) {
            this.inheritAttributes();
        }
        return this.attributesNameMap.get(name.trim().toLowerCase());
    }

    public inheritAttributes() {
        if (!this.extends) {
            this.finalizeAttributes();
            return;
        }
        const parentMechanic = this.registry.getMechanicByClass(this.extends);
        if (!parentMechanic) {
            this.finalizeAttributes();
            return;
        }
        let parentMechanicAttributes = parentMechanic.getAttributes();
        parentMechanicAttributes = parentMechanicAttributes.filter(
            (attr) => attr.inheritable !== false
        );
        this.attributes = this.attributes.concat(parentMechanicAttributes);
        this.finalizeAttributes();
    }

    private finalizeAttributes() {
        this.attributes.forEach((attr) => {
            this.addAttributeToNameMap(attr);
        });
        this.hasAlreadyInheritedAttributes = true;
    }

    private addAttributeToNameMap(attribute: MythicAttribute) {
        attribute.name.forEach((name) => {
            if (this.attributesNameMap.has(name.toLowerCase())) {
                return;
            }
            this.attributesNameMap.set(name.toLowerCase(), attribute);
        });
    }
}

export interface Attribute {
    name: string[];
    type: string;
    enum?: string;
    list?: boolean;
    description: string;
    link: string;
    default_value: string;
    inheritable?: boolean;
}

export class MythicAttribute {
    static readonly regex = /(?<=[{;])\s*\w+(?=\s*=)/gm;
    readonly mechanic: MythicMechanic;
    readonly name: string[];
    readonly type: string;
    readonly enum?: AbstractScribeEnum;
    readonly list?: boolean;
    readonly description: string;
    readonly link: string;
    readonly default_value: string;
    readonly inheritable?: boolean;
    readonly specialValue?: attributeSpecialValues;

    constructor(attribute: Attribute, mechanic: MythicMechanic) {
        this.mechanic = mechanic;
        this.name = attribute.name;
        this.type = attribute.type;
        this.description = attribute.description;
        this.default_value = attribute.default_value;
        this.inheritable = attribute.inheritable;
        this.link = mechanic.link;

        if (attribute.list) {
            this.list = attribute.list;
        }

        if (!attribute.enum) {
            return;
        }

        if (attribute.enum.toLowerCase() in attributeSpecialValues) {
            this.specialValue =
                attributeSpecialValues[
                    attribute.enum.toLowerCase() as keyof typeof attributeSpecialValues
                ];
            Log.trace(
                `Attribute ${this.name[0]} from mechanic ${this.mechanic.class} has special value ${attribute.enum}`
            );
            return;
        }

        this.enum = attribute.enum.includes(',')
            ? ScribeEnumHandler.addLambdaEnum(attribute.enum, attribute.enum.split(','))
            : ScribeEnumHandler.getEnum(attribute.enum);
        this.addEnumAttributesToMechanic(this.enum, mechanic);
    }

    private addEnumAttributesToMechanic(
        scribeEnum: AbstractScribeEnum | undefined,
        mechanic: MythicMechanic
    ) {
        if (!scribeEnum) {
            return;
        }
        const attributes = scribeEnum.getAttributes();
        if (attributes.length === 0) {
            return;
        }
        if (mechanic.enumAddedAttributesCache.includes(scribeEnum.identifier)) {
            Log.debug(
                `Enum ${scribeEnum.identifier} has already added attributes to the mechanic ${mechanic.class}`
            );
            return;
        }
        mechanic.enumAddedAttributesCache.push(scribeEnum.identifier);
        scribeEnum.getAttributes().forEach((attr) => mechanic.addAttribute(attr));
    }
}

export const ScribeMechanicHandler = {
    registry: {
        mechanic: new ScribeMechanicRegistry(),
        targeter: new ScribeTargeterRegistry(),
        condition: new ScribeConditionRegistry(),
        inlinecondition: new ScribeInlineConditionRegistry(),
        trigger: new ScribeTriggerRegistry(),
        aitarget: new ScribeAITargetRegistry(),
        aigoal: new ScribeAIGoalRegistry(),
    },

    async loadMechanicDatasets() {
        const time = timeCounter();
        Log.debug('Loading Mechanic Datasets');
        ScribeMechanicHandler.emptyDatasets();
        const promises = Object.values(ScribeMechanicHandler.registry).map((registry) =>
            registry.loadDataset()
        );
        await Promise.allSettled(promises);
        Log.debug('Loaded Mechanic Datasets in', time.stop());
        return;
    },

    finalize() {
        this.finalizeAllAttributes();
        this.updateNodeRegistry();
    },

    finalizeAllAttributes() {
        Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
            registry.getMechanics().forEach((mechanic) => mechanic.inheritAttributes())
        );
        Log.debug('Finalized all Mechanic Attributes');
    },

    updateNodeRegistry() {
        Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
            registry.getMechanics().forEach((mechanic) => {
                mechanic
                    .getAttributes()
                    .forEach((attr) => updateNodeRegistryAttribute(attr, mechanic));
            })
        );
        Log.debug('Updated Node Registry with Enum References');
    },

    emptyDatasets() {
        Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
            registry.emptyDatasets()
        );
        Log.debug('Mechanic Datasets emptied');
    },
};

function updateNodeRegistryAttribute(attr: MythicAttribute, mechanic = attr.mechanic) {
    if (!attr.enum || !registryKey.includes(attr.enum.identifier as registryKey)) {
        return;
    }

    const key = attr.enum.identifier as registryKey;
    if (!key) {
        return;
    }

    for (const n of mechanic.name) {
        if (!MythicNodeHandler.registry[key].referenceMap.has(n)) {
            MythicNodeHandler.registry[key].referenceMap.set(n, new Set());
        }
        for (const name of attr.name) {
            MythicNodeHandler.registry[key].referenceMap.get(n)?.add(name);
        }
    }
    const correctedNames = attr.name.map((n) =>
        n.replaceAll('(', '\\(').replaceAll(')', '\\)').replaceAll('$', '\\$')
    );
    for (const n of correctedNames) {
        MythicNodeHandler.registry[key].referenceAttributes.add(n);
    }
}
