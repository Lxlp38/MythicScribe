import * as vscode from 'vscode';
import { getScribeEnumHandler, AbstractScribeEnum } from '@common/datasets/ScribeEnum';
import { retriggerCompletionsCommand } from '@common/constants';

import { isPluginEnabled } from '../providers/configProvider';
import { ScribeCloneableFile } from './ScribeCloneableFile';
import { AtlasNodeImpl, atlasRegistry, attributeSpecialValues, scriptedEnums } from './enumSources';
import { isBoolean } from '../objectInfos';
import { timeCounter } from '../utils/timeUtils';
import { getLogger } from '../providers/loggerProvider';
import { Mechanic } from './types/Mechanic';
import { Attribute } from './types/Attribute';
import { ObjectType } from './types/ObjectType';

export type MechanicDataset = Mechanic[];

class MechanicContainer {
    values: MythicMechanic[] = [];
    nameMap: Map<string, MythicMechanic> = new Map();
    classMap: Map<string, MythicMechanic> = new Map();
    completionsCache: vscode.CompletionItem[] = [];

    clear() {
        this.values = [];
        this.nameMap.clear();
        this.classMap.clear();
        this.completionsCache = [];
    }

    add(mechanic: MythicMechanic, defaultExtend?: string) {
        this.values.push(mechanic);
        mechanic.name.forEach((name) => {
            this.nameMap.set(name.toLowerCase(), mechanic);
        });
        this.classMap.set(mechanic.class.toLowerCase(), mechanic);
        addMechanicCompletions([mechanic], this.completionsCache, defaultExtend);
    }

    getByName(name: string): MythicMechanic | undefined {
        return this.nameMap.get(name.toLowerCase());
    }

    getByClass(name: string): MythicMechanic | undefined {
        return this.classMap.get(name.toLowerCase());
    }
}

class MechanicMultiContainer {
    private containers: Map<string, MechanicContainer> = new Map();
    private nameResolutionMap: Map<string, MechanicContainer> = new Map();
    private classResolutionMap: Map<string, MechanicContainer> = new Map();

    getContainer(id: string): MechanicContainer {
        if (!this.containers.has(id)) {
            this.containers.set(id, new MechanicContainer());
        }
        return this.containers.get(id)!;
    }

    getContainers(): MechanicContainer[] {
        return Array.from(this.containers.values());
    }

    clear() {
        this.containers.clear();
        this.nameResolutionMap.clear();
        this.classResolutionMap.clear();
    }

    clearContainer(id: string) {
        if (this.containers.has(id)) {
            this.containers.get(id)!.clear();
        }
    }

    addToContainer(id: string, mechanic: MythicMechanic) {
        const container = this.getContainer(id);
        container.add(mechanic);
    }

    getByNameFromAllContainers(name: string): MythicMechanic | undefined {
        const lowerName = name.toLowerCase();
        if (this.nameResolutionMap.has(lowerName)) {
            const maybeValue = this.nameResolutionMap.get(lowerName)!.getByName(lowerName);
            if (maybeValue) {
                return maybeValue;
            }
            this.nameResolutionMap.delete(lowerName);
        }
        for (const container of this.containers.values()) {
            const ret = container.getByName(lowerName);
            if (ret) {
                this.nameResolutionMap.set(lowerName, container);
                return ret;
            }
        }
        return undefined;
    }

    getByClassFromAllContainers(name: string): MythicMechanic | undefined {
        const lowerName = name.toLowerCase();
        if (this.classResolutionMap.has(lowerName)) {
            const maybeValue = this.classResolutionMap.get(lowerName)!.getByClass(lowerName);
            if (maybeValue) {
                return maybeValue;
            }
            this.classResolutionMap.delete(lowerName);
        }
        for (const container of this.containers.values()) {
            const ret = container.getByClass(lowerName);
            if (ret) {
                this.classResolutionMap.set(lowerName, container);
                return ret;
            }
        }
        return undefined;
    }

    getCompletionsFromAllContainers(): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        for (const container of this.containers.values()) {
            completions.push(...container.completionsCache);
        }
        return completions;
    }
}

export abstract class AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /null/;
    readonly type: ObjectType = ObjectType.MECHANIC;
    readonly folder: string = 'null';
    readonly defaultExtend: string | undefined = undefined;

    private mechanics: MechanicContainer = new MechanicContainer();
    private lambdaMechanics: MechanicMultiContainer = new MechanicMultiContainer();

    get mechanicCompletions() {
        const completions = [...this.mechanics.completionsCache];
        completions.push(...this.lambdaMechanics.getCompletionsFromAllContainers());
        // console.log(
        //     'Lambda Completions are',
        //     this.lambdaMechanics.getCompletionsFromAllContainers()
        // );
        return completions;
    }

    get mechanicClasses(): string[] {
        return Array.from(this.mechanics.classMap.keys());
    }

    async addMechanic(...mechanic: Mechanic[]) {
        mechanic.forEach((m) => {
            if (!isPluginEnabled(m.plugin)) {
                return;
            }
            const mythicMechanic = new MythicMechanic(m, this);
            this.mechanics.values.push(mythicMechanic);
            m.name.forEach((name) => {
                this.mechanics.nameMap.set(name.toLowerCase(), mythicMechanic);
            });
            this.mechanics.classMap.set(m.class.toLowerCase(), mythicMechanic);
            addMechanicCompletions(
                [mythicMechanic],
                this.mechanics.completionsCache,
                this.defaultExtend
            );
        });
        const uniquePlugins = Array.from(new Set(mechanic.map((m) => m.plugin))).sort();
        getLogger().debug(
            `Added ${mechanic.length} ${this.type}s. The registering Plugins are: ${uniquePlugins.join(', ')}`
        );
        return;
    }

    regexMatches(text: string): boolean {
        return this.regex.test(text);
    }

    getMechanics(): MythicMechanic[] {
        const allMechanics = [...this.mechanics.values];
        for (const container of this.lambdaMechanics.getContainers()) {
            allMechanics.push(...container.values);
        }
        return allMechanics;
    }

    getMechanicByName(name: string): MythicMechanic | undefined {
        const lowerName = name.toLowerCase();
        if (this.mechanics.nameMap.has(lowerName)) {
            return this.mechanics.nameMap.get(lowerName);
        }
        const maybeMechanic = this.lambdaMechanics.getByNameFromAllContainers(lowerName);
        if (maybeMechanic) {
            return maybeMechanic;
        }
        return undefined;
    }

    getMechanicByClass(name: string): MythicMechanic | undefined {
        const lowerName = name.toLowerCase();
        if (this.mechanics.classMap.has(lowerName)) {
            return this.mechanics.classMap.get(lowerName);
        }
        const maybeMechanic = this.lambdaMechanics.getByClassFromAllContainers(lowerName);
        if (maybeMechanic) {
            return maybeMechanic;
        }
        return undefined;
    }

    emptyDatasets() {
        this.mechanics.clear();
        for (const container of this.lambdaMechanics.getContainers()) {
            container.clear();
        }
    }

    addLambdaMechanic(id: string, mechanic: MythicMechanic) {
        this.lambdaMechanics.addToContainer(id, mechanic);
        return;
    }

    clearLambdaContainer(id: string) {
        this.lambdaMechanics.clearContainer(id);
    }

    clearAllLambdaContainers() {
        for (const container of this.lambdaMechanics.getContainers()) {
            container.clear();
        }
    }

    async loadDataset(context: vscode.ExtensionContext) {
        const time = timeCounter();
        getLogger().debug(`Loading ${this.type} Dataset`);
        const node = atlasRegistry.getNode(`${this.folder}`);
        const directoryFiles: AtlasNodeImpl[] = node?.getFiles() || [];
        const files = directoryFiles.map(
            (file) => new ScribeCloneableFile<Mechanic>(context, file)
        );
        const promises = files.map((file) => file.get());
        const result = await Promise.allSettled(promises);
        const loadDatasetPromises = result.map((promise) => {
            if (promise.status === 'fulfilled') {
                return this.addMechanic(...promise.value);
            }
            getLogger().error(`Failed to load ${this.type} dataset: ${promise.reason}`);
            return;
        });
        await Promise.allSettled(loadDatasetPromises);
        getLogger().debug(`Loaded ${this.type} Dataset in`, time.stop());
        return;
    }
}
class ScribeMechanicRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.MECHANIC;
    readonly folder: string = 'mechanics';
}
class ScribeTargeterRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s=]@)[\w:]+/gm;
    readonly type: ObjectType = ObjectType.TARGETER;
    readonly folder: string = 'targeters';
}
class ScribeConditionRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.CONDITION;
    readonly folder: string = 'conditions';
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
}
class ScribeAITargetRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AITARGET;
    readonly folder: string = 'aitargets';
    readonly defaultExtend: string = 'WrappedPathfindingGoal';
}
class ScribeAIGoalRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AIGOAL;
    readonly folder: string = 'aigoals';
    readonly defaultExtend: string = 'WrappedPathfindingGoal';
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
    readonly author?: string;

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
        this.author = mechanic.author;
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
        if (this.hasAlreadyInheritedAttributes) {
            return;
        }
        if (!this.extends) {
            this.finalizeAttributes();
            return;
        }

        let parentMechanic: MythicMechanic | undefined;
        if (this.extends.includes(':')) {
            const extendKeys = this.extends.split(':');
            const parentRegistryKey = extendKeys[0];
            const parentRegistry =
                ScribeMechanicHandler.registry[
                    parentRegistryKey.toLowerCase() as keyof typeof ScribeMechanicHandler.registry
                ];
            parentMechanic = parentRegistry.getMechanicByClass(extendKeys[1]);
        } else {
            parentMechanic = this.registry.getMechanicByClass(this.extends);
        }

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

export class MythicAttribute {
    static readonly regex = /(?<=[{;])\s*\w+(?=\s*=)/gm;
    readonly mechanic: MythicMechanic;
    readonly name: string[];
    readonly type: string;
    readonly enum?: AbstractScribeEnum;
    readonly list: boolean;
    readonly description: string;
    readonly link: string;
    readonly default_value: string;
    readonly inheritable: boolean;
    readonly specialValue?: attributeSpecialValues;

    constructor(attribute: Attribute, mechanic: MythicMechanic) {
        this.mechanic = mechanic;
        this.name = attribute.name;
        this.type = attribute.type;
        this.description = attribute.description;
        this.default_value = attribute.default_value;

        this.link = attribute.link ? attribute.link : mechanic.link;
        this.inheritable = attribute.inheritable || true;
        this.list = attribute.list || false;

        if (!attribute.enum) {
            if (isBoolean(attribute.type)) {
                attribute.enum = scriptedEnums.Boolean;
            } else {
                return;
            }
        }

        if (attribute.enum.toLowerCase() in attributeSpecialValues) {
            this.specialValue =
                attributeSpecialValues[
                    attribute.enum.toLowerCase() as keyof typeof attributeSpecialValues
                ];
            getLogger().trace(
                `Attribute ${this.name[0]} from mechanic ${this.mechanic.class} has special value ${attribute.enum}`
            );
            return;
        }

        this.enum = attribute.enum.includes(',')
            ? getScribeEnumHandler().addLambdaEnum(attribute.enum, attribute.enum.split(','))
            : getScribeEnumHandler().getEnum(attribute.enum);
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
            getLogger().debug(
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

    async loadMechanicDatasets(context: vscode.ExtensionContext) {
        const time = timeCounter();
        getLogger().debug('Loading Mechanic Datasets');
        ScribeMechanicHandler.emptyDatasets();
        const promises = Object.values(ScribeMechanicHandler.registry).map((registry) =>
            registry.loadDataset(context)
        );
        await Promise.allSettled(promises);
        getLogger().debug('Loaded Mechanic Datasets in', time.stop());
        return;
    },

    finalize() {
        this.finalizeAllAttributes();
    },

    finalizeAllAttributes() {
        Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
            registry.getMechanics().forEach((mechanic) => mechanic.inheritAttributes())
        );
        getLogger().debug('Finalized all Mechanic Attributes');
    },

    emptyDatasets() {
        Object.values(ScribeMechanicHandler.registry).forEach((registry) =>
            registry.emptyDatasets()
        );
        getLogger().debug('Mechanic Datasets emptied');
    },
};

export function addMechanicCompletions(
    mechanicList: MythicMechanic[],
    completionItems: vscode.CompletionItem[],
    defaultExtend?: string
) {
    mechanicList.forEach((mechanic: MythicMechanic) => {
        mechanic.name.forEach((name: string) => {
            const completionItem = new vscode.CompletionItem(
                name,
                vscode.CompletionItemKind.Function
            );
            completionItem.detail = `${mechanic.description}`;
            completionItem.kind = vscode.CompletionItemKind.Function;
            if (
                mechanic.getMyAttributes().length === 0 &&
                mechanic.extends &&
                defaultExtend &&
                mechanic.extends === defaultExtend
            ) {
                completionItem.insertText = new vscode.SnippetString(name);
            } else {
                completionItem.insertText = new vscode.SnippetString(name + '{$0}');
                completionItem.command = retriggerCompletionsCommand;
            }
            completionItems.push(completionItem);
        });
    });
}
