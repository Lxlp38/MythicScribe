import * as vscode from 'vscode';

import { minecraftVersion } from '../utils/configutils';
import { ScribeCloneableFile, fetchJsonFromLocalFile, fetchJsonFromURL } from './datasets';
import { ctx } from '../../MythicScribe';
import { Log } from '../utils/logger';
import { AbstractScribeMechanicRegistry, Attribute, ScribeMechanicHandler } from './ScribeMechanic';
import { insertColor } from '../color/colorprovider';
import { localEnums, scriptedEnums, volatileEnums } from './enumSources';
import { MythicNode, MythicNodeHandler } from '../mythicnodes/MythicNode';
import { timeCounter } from '../utils/timeUtils';

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
    async waitForDataset(): Promise<Map<string, EnumDatasetValue>> {
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
    updateDataset(data: Enum[]): void {
        this.loaded = false;
        this.dataset = new Map(Object.entries(data));
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
    }
    isLoaded(): boolean {
        return this.loaded;
    }
}

export class StaticScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, path);
        fetchJsonFromLocalFile<Enum>(vscode.Uri.parse(path)).then((data) =>
            this.updateDataset(data)
        );
    }
}
class LocalScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        const localPath = vscode.Uri.joinPath(ctx.extensionUri, 'data', path);
        super(identifier, localPath.fsPath);
        new ScribeCloneableFile<Enum>(localPath).get().then((data) => this.updateDataset(data));
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
        fetchJsonFromURL<Enum>(path).then((data) => this.updateDataset(data));
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
    private func: () => Map<string, EnumDatasetValue> | void;
    constructor(identifier: string, func: () => Map<string, EnumDatasetValue> | void) {
        super(identifier, '');
        this.func = func;
    }
    getDataset(): Map<string, EnumDatasetValue> {
        const ret = this.func();
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
        Log.debug('Loading Enum Datasets');
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
        ScribeEnumHandler.enums.set(identifier.toLowerCase(), enumObject);
        Log.debug(`Registered Enum ${identifier}`);
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

        this.addScriptedEnum(scriptedEnums.Targeter, insertTargeterCompletion);

        this.addScriptedEnum(scriptedEnums.Mobs, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.mob.getNodes())
        );
        this.addScriptedEnum(scriptedEnums.Items, () => {
            const mythicitems = fromMythicNodeToEnum(MythicNodeHandler.registry.item.getNodes());
            const paperitems = ScribeEnumHandler.getEnum('material')!.getDataset();
            return new Map([...mythicitems, ...paperitems]);
        });
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
        this.addScriptedEnum(scriptedEnums.CustomPlaceholder, () =>
            fromMythicNodeToEnum(MythicNodeHandler.registry.placeholder.getNodes())
        );
    },
};

function fromMechanicRegistryToEnum(registry: AbstractScribeMechanicRegistry) {
    const mechanics: Map<string, EnumDatasetValue> = new Map();
    registry.getMechanics().forEach((mechanic) => {
        mechanic.name.forEach((name) => {
            mechanics.set(name, { description: mechanic.description });
        });
    });
    return mechanics;
}

function fromMythicNodeToEnum(nodes: Map<string, MythicNode>) {
    const metaskills: Map<string, EnumDatasetValue> = new Map();
    nodes.forEach((node) => {
        metaskills.set(node.name.text, { description: '' });
    });
    return metaskills;
}

async function insertTargeterCompletion() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const position = editor.selection.active;

    // Insert the color at the current position
    await editor.edit((editBuilder) => {
        editBuilder.insert(position, '@');
    });

    vscode.commands.executeCommand('editor.action.triggerSuggest');
}
