import * as vscode from 'vscode';
import { Schema } from '@common/objectInfos';
import { MobSchema } from '@common/schemas/mobSchema';
import { StatSchema } from '@common/schemas/statSchema';
import { ItemSchema } from '@common/schemas/itemSchema';
import { MetaskillSchema } from '@common/schemas/metaskillSchema';
import { DroptableSchema } from '@common/schemas/droptableSchema';
import { RandomSpawnSchema } from '@common/schemas/randomSpawnSchema';
import { generateNumbersInRange } from '@common/utils/schemautils';
import { ReagentSchema } from '@common/schemas/reagentSchema';
import { MenuSchema } from '@common/schemas/menuSchema';
import { AchievementSchema } from '@common/schemas/achievementSchema';
import { PlaceholderSchema } from '@common/schemas/placeholderSchema';
import { EquipmentSetSchema } from '@common/schemas/equipmentsetSchema';

import { minecraftVersion } from '../utils/configutils';
import { ScribeCloneableFile, fetchJsonFromLocalFile, fetchJsonFromURL } from './datasets';
import { ctx } from '../../MythicScribe';
import Log from '../utils/logger';
import { AbstractScribeMechanicRegistry, Attribute, ScribeMechanicHandler } from './ScribeMechanic';
import { insertColor } from '../color/colorprovider';
import { localEnums, scriptedEnums, volatileEnums } from './enumSources';
import { MythicNode, MythicNodeHandler, NodeEntry } from '../mythicnodes/MythicNode';
import { timeCounter } from '../utils/timeUtils';

const enumLoadedEventEmitter = new vscode.EventEmitter<AbstractScribeEnum>();
export const onEnumLoaded = enumLoadedEventEmitter.event;

let enumLoadedFunctionCallbacks: Map<string, (arg0: AbstractScribeEnum) => void> | undefined;
function getEnumLoadedFunctionCallbacks() {
    if (enumLoadedFunctionCallbacks === undefined) {
        enumLoadedFunctionCallbacks = new Map<string, (arg0: AbstractScribeEnum) => void>();
    }
    return enumLoadedFunctionCallbacks;
}
export function addEnumLoadedFunction(key: string, callback: (arg0: AbstractScribeEnum) => void) {
    getEnumLoadedFunctionCallbacks().set(key, callback);
}

export abstract class AbstractScribeEnum {
    readonly identifier: string;
    readonly path: string;
    protected dataset: Map<string, EnumDatasetValue> = new Map<string, EnumDatasetValue>();
    protected commalist: string = '';
    protected addedAttributes: Attribute[] = [];
    private loaded: boolean = false;

    constructor(identifier: string, path: string) {
        this.identifier = identifier;
        this.path = path;
    }

    updateCommaList(): void {
        this.commalist = Array.from(this.dataset.keys()).join(',');
    }
    getCommaList(): string {
        return this.commalist;
    }
    getDataset(): Map<string, EnumDatasetValue> {
        return this.dataset;
    }
    has(key: string, caseInsensitive = false): boolean {
        return (
            this.dataset.has(key) ||
            (caseInsensitive &&
                Array.from(this.dataset.keys()).some((k) => k.toLowerCase() === key.toLowerCase()))
        );
    }
    async waitForDataset(): Promise<Map<string, EnumDatasetValue>> {
        if (this.loaded) {
            return this.dataset;
        }
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.loaded) {
                    clearInterval(interval);
                    resolve(this.dataset);
                }
            }, 100);
        });
    }
    getAttributes(): Attribute[] {
        return this.addedAttributes;
    }
    setDataset(data: Enum[]): void {
        this.loaded = false;
        this.dataset = new Map(Object.entries(data));
        this.finalizeDataset();
    }
    expandDataset(data: Map<string, EnumDatasetValue>): void {
        Log.debug(`Expanding Enum ${this.identifier} with ${data.size} entries`);
        this.loaded = false;
        const newDataset = new Map(Object.entries(data));
        newDataset.forEach((value, key) => {
            this.dataset.set(key, value);
        });
        this.finalizeDataset();
    }
    finalizeDataset(): void {
        const attributeMap = new Map<string, Attribute>();
        this.dataset.forEach((value) => {
            if (value.name) {
                value.name.forEach((name) => {
                    this.dataset.set(name, value);
                });
            }
            if (value.attributes) {
                for (const attribute of value.attributes) {
                    attributeMap.set(attribute.name.join(','), attribute);
                }
            }
        });
        this.updateCommaList();
        if (attributeMap.size > 0) {
            this.addedAttributes = Array.from(attributeMap.values());
            Log.debug(`Enum ${this.identifier} added ${attributeMap.size} attributes`);
        }
        Log.debug(
            `Mapped Enum ${this.identifier.toLowerCase()}`,
            'with',
            this.getDataset().size.toString(),
            'entries'
        );
        this.loaded = true;
        enumLoadedEventEmitter.fire(this);
        getEnumLoadedFunctionCallbacks().get(this.identifier)?.(this);
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}

export class StaticScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, path);
        fetchJsonFromLocalFile<Enum>(vscode.Uri.parse(path)).then((data) => this.setDataset(data));
    }
}
class LocalScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        const localPath = vscode.Uri.joinPath(ctx.extensionUri, 'data', path);
        super(identifier, localPath.fsPath);
        new ScribeCloneableFile<Enum>(localPath).get().then((data) => this.setDataset(data));
    }
}
class VolatileScribeEnum extends LocalScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, 'versions/' + ScribeEnumHandler.version + '/' + path);
    }
}
export class WebScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, path);
        fetchJsonFromURL<Enum>(path).then((data) => this.setDataset(data || []));
    }
}
class LambdaScribeEnum extends AbstractScribeEnum {
    constructor(key: string, values: string[]) {
        super(key, '');
        const val = values.reduce((acc: { [key: string]: EnumDatasetValue }, curr) => {
            acc[curr] = { description: '' };
            return acc;
        }, {});
        this.dataset = new Map(Object.entries(val));
        this.updateCommaList();
    }
}

class ScriptedEnum extends AbstractScribeEnum {
    private callback: () => Map<string, EnumDatasetValue> | void;
    constructor(identifier: string, callback: () => Map<string, EnumDatasetValue> | void) {
        super(identifier, '');
        this.callback = callback;
    }
    getDataset(): Map<string, EnumDatasetValue> {
        const ret = this.callback();
        if (ret) {
            return ret;
        }
        return new Map();
    }
}

export interface Enum {
    [key: string]: EnumDatasetValue;
}
export interface EnumDatasetValue {
    description?: string;
    name?: string[];
    attributes?: Attribute[];
}

export const ScribeEnumHandler = {
    version: minecraftVersion(),
    enums: new Map<string, AbstractScribeEnum>(),

    enumDefinitions: [
        {
            clazz: VolatileScribeEnum,
            items: volatileEnums,
        },
        {
            clazz: LocalScribeEnum,
            items: localEnums,
        },
    ],

    loadEnumDatasets(): void {
        ScribeEnumHandler.emptyDatasets();
        const time = timeCounter();
        const targetVersion = minecraftVersion();
        this.version = targetVersion;
        Log.debug('Loading Enum Datasets. Target Minecraft Version:', targetVersion);
        this.enumDefinitions.forEach(({ clazz, items }) => {
            items.forEach((item) => {
                if (Array.isArray(item)) {
                    const [identifier, path] = item;
                    this.addEnum(clazz, identifier, path);
                } else {
                    const identifier = item.split('/').pop()!.split('.')[0];
                    this.addEnum(clazz, identifier, item);
                }
            });
        });
        this.initializeScriptedEnums();
        Log.debug('Loaded Enum Datasets in', time.stop());
    },

    getEnum(identifier: string): AbstractScribeEnum | undefined {
        return ScribeEnumHandler.enums.get(identifier.toLowerCase());
    },

    addEnum(
        oclass: new (identifier: string, path: string) => AbstractScribeEnum,
        identifier: string,
        path: string
    ) {
        const enumObject = new oclass(identifier.toLowerCase(), path);
        if (ScribeEnumHandler.enums.has(identifier.toLowerCase())) {
            Log.debug(`Enum ${identifier} already exists, adding new values to it instead`);
            this.expandEnum(identifier, enumObject);
            return;
        }
        ScribeEnumHandler.enums.set(identifier.toLowerCase(), enumObject);
        Log.debug(`Registered Enum ${identifier}`);
    },

    async expandEnum(identifier: string, enumObject: AbstractScribeEnum) {
        const existing = ScribeEnumHandler.enums.get(identifier.toLowerCase())!;
        const newDataset = await enumObject.waitForDataset();
        existing.expandDataset(newDataset);
    },

    addLambdaEnum(key: string, values: string[]) {
        const maybeEnum = ScribeEnumHandler.enums.get(key.toLowerCase());
        if (maybeEnum) {
            Log.debug(`Lambda Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new LambdaScribeEnum(key.toLowerCase(), values);
        ScribeEnumHandler.enums.set(key.toLowerCase(), enumObject);
        Log.debug(`Registered Lambda Enum ${key}`);
        return enumObject;
    },

    addScriptedEnum(key: string, func: () => void) {
        const maybeEnum = ScribeEnumHandler.enums.get(key.toLowerCase());
        if (maybeEnum) {
            Log.debug(`Scripted Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new ScriptedEnum(key.toLowerCase(), func);
        ScribeEnumHandler.enums.set(key.toLowerCase(), enumObject);
        Log.debug(`Registered Scripted Enum ${key}`);
        return enumObject;
    },

    emptyDatasets(): void {
        ScribeEnumHandler.enums.clear();
        Log.debug('Emptied Enum Datasets');
    },

    initializeScriptedEnums(): void {
        this.addLambdaEnum(scriptedEnums.Boolean, ['true', 'false']);
        this.addScriptedEnum(scriptedEnums.Color, insertColor);
        this.addScriptedEnum(scriptedEnums.RGBColor, () => insertColor(undefined, '255,255,255'));

        // mechanic List-related datasets
        this.addScriptedEnum(scriptedEnums.MechanicList, () =>
            fromMechanicRegistryToEnum(ScribeMechanicHandler.registry.mechanic)
        );
        this.addScriptedEnum(scriptedEnums.TargeterList, () =>
            fromMechanicRegistryToEnum(ScribeMechanicHandler.registry.targeter)
        );
        this.addScriptedEnum(scriptedEnums.TriggerList, () =>
            fromMechanicRegistryToEnum(ScribeMechanicHandler.registry.trigger)
        );
        this.addScriptedEnum(scriptedEnums.ConditionList, () =>
            fromMechanicRegistryToEnum(ScribeMechanicHandler.registry.condition)
        );

        // Special cases
        this.addScriptedEnum(scriptedEnums.Item, () => {
            const mythicitems = fromMythicNodeToEnum(MythicNodeHandler.registry.item.getNodes());
            const paperitems = ScribeEnumHandler.getEnum('material')!.getDataset();
            return new Map([...mythicitems, ...paperitems]);
        });
        this.addScriptedEnum(scriptedEnums.Targeter, () =>
            fromMechanicRegistryToEnum(
                ScribeMechanicHandler.registry.targeter,
                (name) => '@' + name
            )
        );
        this.addScriptedEnum(scriptedEnums.Trigger, () =>
            fromMechanicRegistryToEnum(ScribeMechanicHandler.registry.trigger, (name) => '~' + name)
        );
        this.addScriptedEnum(scriptedEnums.ReagentValue, () => {
            const ret = fromMythicNodeToEnum(MythicNodeHandler.registry.stat.getNodes());
            const ret2 = new Map<string, EnumDatasetValue>();
            ret.forEach((value, key) => {
                ret2.set('stat.' + key, value);
            });
            generateNumbersInRange(0, 5, 1, true).forEach((value) => {
                ret2.set(value, { description: '' });
            });
            return ret2;
        });
        this.addScriptedEnum(scriptedEnums.Spell, () => {
            const metaskills = MythicNodeHandler.registry.metaskill.getNodes();
            const spells: NodeEntry = new Map();
            metaskills.forEach((value, key) => {
                if (value.metadata.get('spell') === true) {
                    spells.set(key, value);
                }
            });
            return fromMythicNodeToEnum(spells);
        });
        this.addScriptedEnum(scriptedEnums.Furniture, () => {
            const items = MythicNodeHandler.registry.item.getNodes();
            const furnitures: NodeEntry = new Map();
            items.forEach((value, key) => {
                if (value.getTemplatedMetadata<string>('type') === 'furniture') {
                    furnitures.set(key, value);
                }
            });
            return fromMythicNodeToEnum(furnitures);
        });
        this.addScriptedEnum(scriptedEnums.CustomBlock, () => {
            const items = MythicNodeHandler.registry.item.getNodes();
            const customBlocks: NodeEntry = new Map();
            items.forEach((value, key) => {
                if (value.getTemplatedMetadata<string>('type') === 'block') {
                    customBlocks.set(key, value);
                }
            });
            return fromMythicNodeToEnum(customBlocks);
        });
        this.addScriptedEnum(scriptedEnums.Block, () => {
            const customBlocks = ScribeEnumHandler.getEnum(scriptedEnums.CustomBlock)!.getDataset();
            const paperitems = ScribeEnumHandler.getEnum('material')!.getDataset();
            return new Map([...customBlocks, ...paperitems]);
        });

        // Node-related datasets
        this.addScriptedEnum(scriptedEnums.Mob, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.mob.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.MythicItem, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.item.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Metaskill, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.metaskill.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Droptable, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.droptable.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Stat, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.stat.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Pin, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.pin.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.CustomPlaceholder, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.placeholder.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.RandomSpawn, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.randomspawn.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.EquipmentSet, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.equipmentset.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Archetype, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.archetype.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Reagent, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.reagent.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Menu, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.menu.getNodes())
        );

        // Schemas
        this.addScriptedEnum(scriptedEnums.MobSchema, () => fromSchemaToEnum(MobSchema));
        this.addScriptedEnum(scriptedEnums.ItemSchema, () => fromSchemaToEnum(ItemSchema));
        this.addScriptedEnum(scriptedEnums.MetaskillSchema, () =>
            fromSchemaToEnum(MetaskillSchema)
        );
        this.addScriptedEnum(scriptedEnums.DroptableSchema, () =>
            fromSchemaToEnum(DroptableSchema)
        );
        this.addScriptedEnum(scriptedEnums.StatSchema, () => fromSchemaToEnum(StatSchema));
        this.addScriptedEnum(scriptedEnums.RandomSpawnSchema, () =>
            fromSchemaToEnum(RandomSpawnSchema)
        );
        this.addScriptedEnum(scriptedEnums.PlaceholderSchema, () =>
            fromSchemaToEnum(PlaceholderSchema)
        );
        this.addScriptedEnum(scriptedEnums.EquipmentSetSchema, () =>
            fromSchemaToEnum(EquipmentSetSchema)
        );
        this.addScriptedEnum(scriptedEnums.ReagentSchema, () => fromSchemaToEnum(ReagentSchema));
        this.addScriptedEnum(scriptedEnums.MenuSchema, () => fromSchemaToEnum(MenuSchema));
        this.addScriptedEnum(scriptedEnums.AchievementSchema, () =>
            fromSchemaToEnum(AchievementSchema)
        );
    },
};

function fromMechanicRegistryToEnum(
    registry: AbstractScribeMechanicRegistry,
    nameParser: (name: string) => string = (name) => name
): Map<string, EnumDatasetValue> {
    const mechanics: Map<string, EnumDatasetValue> = new Map();
    registry.getMechanics().forEach((mechanic) => {
        mechanic.name.forEach((name) => {
            mechanics.set(nameParser(name), { description: mechanic.description });
        });
    });
    return mechanics;
}

function fromMythicNodeToEnum(nodes: Map<string, MythicNode>): Map<string, EnumDatasetValue> {
    const metaskills: Map<string, EnumDatasetValue> = new Map();
    nodes.forEach((node) => {
        metaskills.set(node.name.text, { description: node.description.text || '' });
    });
    return metaskills;
}

function fromSchemaToEnum(schema: Schema): Map<string, EnumDatasetValue> {
    const schemaEnum: Map<string, EnumDatasetValue> = new Map();
    Object.entries(schema).forEach(([key, value]) => {
        schemaEnum.set(key, { description: value.description });
    });
    return schemaEnum;
}
