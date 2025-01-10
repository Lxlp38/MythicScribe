import * as vscode from 'vscode';

import { AbstractScribeHandler } from '../handlers/AbstractScribeHandler';
import { datasetSource } from '../utils/configutils';
import { checkGithubDatasets, loadLocalDatasets } from './datasets';
import { ScribeEnumHandler } from './ScribeEnum';
import { loadCustomDatasets } from './customDatasets';

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

export class ScribeMechanicHandler extends AbstractScribeHandler {
    static pathMap: {
        mechanic: vscode.Uri;
        targeter: vscode.Uri;
        condition: vscode.Uri;
        trigger: vscode.Uri;
        aitarget: vscode.Uri;
        aigoal: vscode.Uri;
    };

    static createInstance(): AbstractScribeHandler {
        return new ScribeMechanicHandler();
    }

    protected constructor() {
        super();
        ScribeMechanicHandler.pathMap = getPathMap(AbstractScribeHandler.context.extensionUri);
        ScribeMechanicHandler.loadDatasets();
    }

    static async loadDatasets() {
        ScribeMechanicHandler.emptyDatasets();

        if (datasetSource() === 'GitHub') {
            await checkGithubDatasets();
        } else {
            await loadLocalDatasets();
        }
        await loadCustomDatasets();
    }

    static emptyDatasets() {
        Promise.all([
            ScribeMechanicRegistry.getInstance<ScribeMechanicRegistry>().emptyDatasets(),
            ScribeTargeterRegistry.getInstance<ScribeTargeterRegistry>().emptyDatasets(),
            ScribeConditionRegistry.getInstance<ScribeConditionRegistry>().emptyDatasets(),
            ScribeTriggerRegistry.getInstance<ScribeTriggerRegistry>().emptyDatasets(),
            ScribeAITargetRegistry.getInstance<ScribeAITargetRegistry>().emptyDatasets(),
            ScribeAIGoalRegistry.getInstance<ScribeAIGoalRegistry>().emptyDatasets(),
        ]);
    }
}

export type MechanicDataset = Mechanic[];

export abstract class AbstractScribeMechanicRegistry extends AbstractScribeHandler {
    readonly regex: RegExp = /null/;
    readonly type: ObjectType = ObjectType.MECHANIC;
    private mechanics: MythicMechanic[] = [];
    private mechanicsNameMap: Map<string, MythicMechanic> = new Map();
    private mechanicsClassMap: Map<string, MythicMechanic> = new Map();

    async addMechanic(...mechanic: Mechanic[]) {
        mechanic.forEach((m) => {
            const mythicMechanic = new MythicMechanic(m, this);
            this.mechanics.push(mythicMechanic);
            m.name.forEach((name) => {
                this.mechanicsNameMap.set(name.toLowerCase(), mythicMechanic);
            });
            this.mechanicsClassMap.set(m.class.toLowerCase(), mythicMechanic);
        });
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

    async emptyDatasets() {
        this.mechanics = [];
        this.mechanicsNameMap.clear();
        this.mechanicsClassMap.clear();
    }
}
export class ScribeMechanicRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.MECHANIC;
    protected static createInstance(): ScribeMechanicRegistry {
        return new ScribeMechanicRegistry();
    }
}
export class ScribeTargeterRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s=]@)[\w:]+/gm;
    readonly type: ObjectType = ObjectType.TARGETER;
    protected static createInstance(): ScribeTargeterRegistry {
        return new ScribeTargeterRegistry();
    }
}
export class ScribeConditionRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.CONDITION;
    protected static createInstance(): ScribeConditionRegistry {
        return new ScribeConditionRegistry();
    }
}
export class ScribeInlineConditionRegistry extends ScribeConditionRegistry {
    readonly regex: RegExp = /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm;
    readonly type: ObjectType = ObjectType.INLINECONDITION;
    protected static createInstance(): ScribeInlineConditionRegistry {
        return new ScribeInlineConditionRegistry();
    }
    getMechanics(): MythicMechanic[] {
        return ScribeConditionRegistry.getInstance<ScribeConditionRegistry>().getMechanics();
    }
    getMechanicByName(name: string): MythicMechanic | undefined {
        return ScribeConditionRegistry.getInstance<ScribeConditionRegistry>().getMechanicByName(
            name
        );
    }
    getMechanicByClass(name: string): MythicMechanic | undefined {
        return ScribeConditionRegistry.getInstance<ScribeConditionRegistry>().getMechanicByClass(
            name
        );
    }
}
export class ScribeTriggerRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s~)on[\w:]+/gm;
    readonly type: ObjectType = ObjectType.TRIGGER;
    protected static createInstance(): ScribeTriggerRegistry {
        return new ScribeTriggerRegistry();
    }
}
export class ScribeAITargetRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AITARGET;
    protected static createInstance(): ScribeAITargetRegistry {
        return new ScribeAITargetRegistry();
    }
}
export class ScribeAIGoalRegistry extends AbstractScribeMechanicRegistry {
    readonly regex: RegExp = /(?<=\s- )[\w:]+/gm;
    readonly type: ObjectType = ObjectType.AIGOAL;
    protected static createInstance(): ScribeAIGoalRegistry {
        return new ScribeAIGoalRegistry();
    }
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
    protected attributes: MythicAttribute[];
    protected attributesNameMap: Map<string, MythicAttribute> = new Map();
    private hasAlreadyInheritedAttributes: boolean = false;

    constructor(mechanic: Mechanic, registry: AbstractScribeMechanicRegistry) {
        this.registry = registry;
        this.plugin = mechanic.plugin;
        this.class = mechanic.class;
        this.extends = mechanic.extends;
        this.implements = mechanic.implements;
        this.name = mechanic.name;
        this.description = mechanic.description;
        this.link = mechanic.link;
        this.attributes = mechanic.attributes.map((a) => new MythicAttribute(a, this));
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

    public getAttributeByName(name: string): MythicAttribute | undefined {
        if (!this.hasAlreadyInheritedAttributes) {
            this.inheritAttributes();
        }
        return this.attributesNameMap.get(name.toLowerCase());
    }

    private inheritAttributes() {
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
            attr.name.forEach((name) => {
                this.attributesNameMap.set(name.toLowerCase(), attr);
            });
        });
        this.hasAlreadyInheritedAttributes = true;
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
    static readonly regex = /(?<=[{;])\w+(?==)/gm;
    readonly mechanic: MythicMechanic;
    readonly name: string[];
    readonly type: string;
    readonly enum?: string;
    readonly list?: boolean;
    readonly description: string;
    readonly link: string;
    readonly default_value: string;
    readonly inheritable?: boolean;

    constructor(attribute: Attribute, mechanic: MythicMechanic) {
        this.mechanic = mechanic;
        this.name = attribute.name;
        this.type = attribute.type;
        this.enum = attribute.enum;
        this.list = attribute.list;
        this.description = attribute.description;
        this.default_value = attribute.default_value;
        this.inheritable = attribute.inheritable;
        this.link = mechanic.link;
        this.checkForLambdaEnum();
    }

    private async checkForLambdaEnum() {
        if (this.enum && this.enum.includes(',')) {
            const values = this.enum.split(',');
            ScribeEnumHandler.addLambdaEnum(this.enum, values);
        }
    }
}

function getPathMap(extensionUri: vscode.Uri) {
    return {
        mechanic: vscode.Uri.joinPath(extensionUri, 'data', 'mechanics'),
        targeter: vscode.Uri.joinPath(extensionUri, 'data', 'targeters'),
        condition: vscode.Uri.joinPath(extensionUri, 'data', 'conditions'),
        trigger: vscode.Uri.joinPath(extensionUri, 'data', 'triggers'),
        aitarget: vscode.Uri.joinPath(extensionUri, 'data', 'aitargets'),
        aigoal: vscode.Uri.joinPath(extensionUri, 'data', 'aigoals'),
    };
}
