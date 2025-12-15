import * as vscode from 'vscode';
import { PromiseCallbackProvider } from '@common/providers/callbackProvider';
import { getMinecraftVersion } from '@common/providers/configProvider';
import { fetchJsonFromURL, fetchJsonFromLocalFile } from '@common/utils/uriutils';
import { HangingObject } from '@common/utils/HangingObject';
import { MinecraftVersions } from '@common/packageData';

import { ScribeCloneableFile } from './ScribeCloneableFile';
import { getLogger } from '../providers/loggerProvider';
import { insertColor } from '../color/colorprovider';
import { localEnums, scriptedEnums } from './enumSources';
import { timeCounter } from '../utils/timeUtils';
import { Attribute } from './types/Attribute';
import { EnumDatasetValue, Enum } from './types/Enum';
import { atlasDataNode, AbstractAtlasNodeImpl, AtlasFileNodeImpl } from './AtlasNode';

const enumLoadedEventEmitter = new vscode.EventEmitter<AbstractScribeEnum>();
export const onEnumLoaded = enumLoadedEventEmitter.event;

export abstract class AbstractScribeEnum {
    readonly identifier: string;
    readonly path: string;
    protected dataset: Map<string, EnumDatasetValue> = new Map<string, EnumDatasetValue>();
    protected commalist: string = '';
    protected addedAttributes: Attribute[] = [];
    private loaded: boolean = false;

    constructor({ identifier, path }: { identifier: string; path: string }) {
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
        getLogger().debug(`Expanding Enum ${this.identifier} with ${data.size} entries`);
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
            getLogger().debug(`Enum ${this.identifier} added ${attributeMap.size} attributes`);
        }
        getLogger().debug(
            `Mapped Enum ${this.identifier.toLowerCase()}`,
            'with',
            this.getDataset().size.toString(),
            'entries'
        );
        // getLogger().trace(
        //     `Enum ${this.identifier} Dataset:`,
        //     JSON.stringify(Object.fromEntries(this.getDataset()))
        // );
        this.loaded = true;
        enumLoadedEventEmitter.fire(this);
        // getEnumLoadedFunctionCallbacks().get(this.identifier)?.(this);
        getScribeEnumHandler().enumCallback.run(this.identifier, this);
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}

export class StaticScribeEnum extends AbstractScribeEnum {
    constructor({ identifier, path }: { identifier: string; path: string }) {
        super({ identifier, path });
        fetchJsonFromLocalFile<Enum>(vscode.Uri.parse(path)).then((data) => this.setDataset(data));
    }
}
class FileScribeEnum extends AbstractScribeEnum {
    constructor({
        context,
        atlasNode,
    }: {
        context: vscode.ExtensionContext;
        atlasNode: AtlasFileNodeImpl;
    }) {
        const localPath = vscode.Uri.joinPath(context.extensionUri, atlasNode.path);
        super({ identifier: atlasNode.identifier, path: localPath.fsPath });
        new ScribeCloneableFile<Enum>(context, atlasNode)
            .get()
            .then((data) => this.setDataset(data));
    }
}
export class WebScribeEnum extends AbstractScribeEnum {
    constructor({ identifier, path }: { identifier: string; path: string }) {
        super({ identifier, path });
        fetchJsonFromURL<Enum>(path).then((data) => this.setDataset(data || []));
    }
}
class LambdaScribeEnum extends AbstractScribeEnum {
    constructor(key: string, values: string[]) {
        super({ identifier: key, path: '' });
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
    constructor({
        identifier,
        callback,
    }: {
        identifier: string;
        callback: () => Map<string, EnumDatasetValue> | void;
    }) {
        super({ identifier, path: '' });
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

export function generateVolatileEnumAtlasNodes(version?: MinecraftVersions) {
    const targetVersion = version || getMinecraftVersion();
    return atlasDataNode.getNode('versions')?.getNode(targetVersion)?.getFiles() || [];
}

export class ScribeEnumHandlerImpl {
    enums = new Map<string, AbstractScribeEnum>();
    enumCallback = new PromiseCallbackProvider<string, AbstractScribeEnum>();

    public context = new HangingObject<vscode.ExtensionContext>();

    loadEnumDatasets(): void {
        this.emptyDatasets();
        const time = timeCounter();
        const targetVersion = getMinecraftVersion();
        getLogger().debug('Loading Enum Datasets. Target Minecraft Version:', targetVersion);

        localEnums.forEach((item) => {
            this.addAtlasNodeEnum(FileScribeEnum, item);
        });

        const volatileFiles = generateVolatileEnumAtlasNodes(targetVersion);

        volatileFiles.forEach((item) => {
            this.addAtlasNodeEnum(FileScribeEnum, item);
        });

        this.initializeScriptedEnums();
        getLogger().debug('Loaded Enum Datasets in', time.stop());
    }

    getEnum(identifier: string): AbstractScribeEnum | undefined {
        return this.enums.get(identifier.toLowerCase());
    }

    getEnumList(): string[] {
        return Array.from(this.enums.keys());
    }

    addAtlasNodeEnum(
        oclass: new (params: {
            context: vscode.ExtensionContext;
            atlasNode: AtlasFileNodeImpl;
        }) => AbstractScribeEnum,
        atlasNode: AtlasFileNodeImpl
    ) {
        const enumObject = new oclass({
            atlasNode,
            context: this.context.value,
        });
        this.handleNewEnum(enumObject, atlasNode.identifier);
    }

    addEnum(
        oclass: new (params: {
            identifier: string;
            path: string;
            context: vscode.ExtensionContext;
            atlasNode?: AbstractAtlasNodeImpl;
        }) => AbstractScribeEnum,
        identifier: string,
        path: string
    ) {
        const enumObject = new oclass({
            identifier,
            path,
            context: this.context.value,
        });
        this.handleNewEnum(enumObject, identifier);
    }

    private handleNewEnum(enumObject: AbstractScribeEnum, identifier: string) {
        if (this.enums.has(identifier.toLowerCase())) {
            getLogger().debug(`Enum ${identifier} already exists, adding new values to it instead`);
            this.expandEnum(identifier, enumObject);
            return;
        }
        this.enums.set(identifier.toLowerCase(), enumObject);
        getLogger().debug(`Registered Enum ${identifier}`);
    }

    async expandEnum(identifier: string, enumObject: AbstractScribeEnum) {
        const existing = this.enums.get(identifier.toLowerCase())!;
        const newDataset = await enumObject.waitForDataset();
        existing.expandDataset(newDataset);
    }

    addLambdaEnum(key: string, values: string[]) {
        const maybeEnum = this.enums.get(key.toLowerCase());
        if (maybeEnum) {
            getLogger().debug(`Lambda Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new LambdaScribeEnum(key.toLowerCase(), values);
        this.enums.set(key.toLowerCase(), enumObject);
        getLogger().debug(`Registered Lambda Enum ${key}`);
        return enumObject;
    }

    addScriptedEnum(key: string, func: () => void) {
        const maybeEnum = this.enums.get(key.toLowerCase());
        if (maybeEnum) {
            getLogger().debug(`Scripted Enum ${key} already exists`);
            return maybeEnum;
        }
        const enumObject = new ScriptedEnum({ identifier: key.toLowerCase(), callback: func });
        this.enums.set(key.toLowerCase(), enumObject);
        getLogger().debug(`Registered Scripted Enum ${key}`);
        return enumObject;
    }

    emptyDatasets(): void {
        this.enums.clear();
        getLogger().debug('Emptied Enum Datasets');
    }

    initializeScriptedEnums(): void {
        this.addLambdaEnum(scriptedEnums.Boolean, ['true', 'false']);
        this.addScriptedEnum(scriptedEnums.Color, insertColor);
        this.addScriptedEnum(scriptedEnums.RGBColor, () => insertColor(undefined, '255,255,255'));
    }
}

export let ScribeEnumHandler: ScribeEnumHandlerImpl | undefined;
export function getScribeEnumHandler(): ScribeEnumHandlerImpl {
    if (!ScribeEnumHandler) {
        ScribeEnumHandler = new ScribeEnumHandlerImpl();
    }
    return ScribeEnumHandler;
}
