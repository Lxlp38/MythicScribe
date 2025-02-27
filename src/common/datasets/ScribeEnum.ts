import * as vscode from 'vscode';

import { minecraftVersion } from '../utils/configutils';
import { ScribeCloneableFile, fetchJsonFromLocalFile, fetchJsonFromURL } from './datasets';
import { ctx } from '../../MythicScribe';
import { ScribeLogger } from '../utils/logger';
import { Attribute } from './ScribeMechanic';
import { insertColor } from '../color/colorprovider';
import { localEnums, scriptedEnums, volatileEnums } from './enumSources';

export abstract class AbstractScribeEnum {
    readonly identifier: string;
    readonly path: string;
    protected dataset: Map<string, EnumDatasetValue> = new Map<string, EnumDatasetValue>();
    protected commalist: string = '';
    protected addedAttributes: Attribute[] = [];

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
    getAttributes(): Attribute[] {
        return this.addedAttributes;
    }
    updateDataset(data: Enum[]): void {
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
            ScribeLogger.debug(`Enum ${this.identifier} added ${attributeMap.size} attributes`);
        }
        ScribeLogger.debug(
            `Mapped Enum ${this.identifier.toLowerCase()}`,
            'with',
            this.getDataset().size.toString(),
            'entries'
        );
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
    private func: () => void;
    constructor(identifier: string, func: () => void) {
        super(identifier, '');
        this.func = func;
    }
    getDataset(): Map<string, EnumDatasetValue> {
        this.func();
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
        this.addScriptedEnum(scriptedEnums.Color, insertColor);
        this.addScriptedEnum(scriptedEnums.RGBColor, () => insertColor(undefined, '255,255,255'));
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
        ScribeLogger.debug(`Registered Enum ${identifier}`);
    },

    addLambdaEnum(key: string, values: string[]) {
        const maybeEnum = ScribeEnumHandler.enums.get(key.toLowerCase());
        if (maybeEnum) {
            ScribeLogger.debug(`Lambda Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new LambdaScribeEnum(key.toLowerCase(), values);
        ScribeEnumHandler.enums.set(key.toLowerCase(), enumObject);
        ScribeLogger.debug(`Registered Lambda Enum ${key}`);
        return enumObject;
    },

    addScriptedEnum(key: string, func: () => void) {
        const maybeEnum = ScribeEnumHandler.enums.get(key.toLowerCase());
        if (maybeEnum) {
            ScribeLogger.debug(`Scripted Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new ScriptedEnum(key.toLowerCase(), func);
        ScribeEnumHandler.enums.set(key.toLowerCase(), enumObject);
        ScribeLogger.debug(`Registered Scripted Enum ${key}`);
        return enumObject;
    },

    emptyDatasets(): void {
        ScribeEnumHandler.enums.clear();
        ScribeLogger.debug('Emptied Enum Datasets');
    },
};
