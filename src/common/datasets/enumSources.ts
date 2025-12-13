import atlasJson from './atlas.json';

export type AtlasNode = { name: string } & (
    | { type: 'file' }
    | { type: 'directory'; children: AtlasNode[] }
);

class AtlasregistryNode {
    public type: 'file' | 'directory';
    public name: string;
    public children?: AtlasregistryNode[];
    constructor(public node: AtlasNode) {
        this.type = node.type;
        this.name = node.name;
        if (node.type === 'directory' && node.children) {
            this.children = node.children.map((child) => new AtlasregistryNode(child));
        }
    }

    public getNode(path: string): AtlasregistryNode | null {
        const parts = path.split('/').filter((part) => part.length > 0);
        let currentNode: AtlasregistryNode = this;

        for (const part of parts) {
            if (currentNode.type !== 'directory' || !currentNode.children) {
                return null;
            }

            const nextNode = currentNode.children.find((child) => child.name === part);
            if (!nextNode) {
                return null;
            }

            currentNode = nextNode;
        }

        return currentNode;
    }

    public getFirstChild(): AtlasregistryNode | null {
        if (this.type === 'directory' && this.children && this.children.length > 0) {
            return this.children[0];
        }
        return null;
    }
    public getLastChild(): AtlasregistryNode | null {
        if (this.type === 'directory' && this.children && this.children.length > 0) {
            return this.children[this.children.length - 1];
        }
        return null;
    }

    public getFiles(removeSelfName: boolean = true): string[] {
        if (this.type === 'file') {
            return [removeSelfName ? '' : this.name];
        } else if (this.type === 'directory' && this.children) {
            let paths: string[] = [];
            for (const child of this.children) {
                const childFiles = child.getFiles(false);
                paths = paths.concat(
                    childFiles.map((p) => (removeSelfName ? '' : this.name + '/') + p)
                );
            }
            return paths;
        }
        return [];
    }

    public printTree(indent: string = ' '): void {
        // eslint-disable-next-line no-console
        console.log(`${indent}- ${this.name} (${this.type})`);
        if (this.type === 'directory' && this.children) {
            for (const child of this.children) {
                child.printTree(indent + '  ');
            }
        }
    }
}

export const atlasRegistry = new AtlasregistryNode(atlasJson as AtlasNode);

export const volatileEnums: string[] =
    atlasRegistry.getNode('versions/')?.getLastChild()?.getFiles() || [];

export const localEnums: string[] = atlasRegistry.getNode('mythic/')?.getFiles(false) || [];

export enum scriptedEnums {
    Color = 'color',
    RGBColor = 'rgbcolor',
    Boolean = 'boolean',

    // List of all mechanic types
    MechanicList = 'mechaniclist',
    TargeterList = 'targeterlist',
    TriggerList = 'triggerlist',
    ConditionList = 'conditionlist',

    // Node-related datasets
    Mob = 'mob',
    Metaskill = 'metaskill',
    Droptable = 'droptable',
    Stat = 'stat',
    Pin = 'pin',
    CustomPlaceholder = 'customplaceholder',
    RandomSpawn = 'randomspawn',
    EquipmentSet = 'equipmentset',
    MythicItem = 'mythicitem',
    Archetype = 'archetype',
    Reagent = 'reagent',
    Menu = 'menu',
    Achievement = 'achievement',

    // Specialized datasets
    Item = 'item',
    Targeter = 'targeter',
    Trigger = 'trigger',
    ReagentValue = 'reagentvalue',
    Spell = 'spell',
    Furniture = 'furniture',
    CustomBlock = 'customblock',
    Block = 'block',

    // First "level" of the schemas, without nested keys
    MobSchema = 'mobschema',
    ItemSchema = 'itemschema',
    MetaskillSchema = 'metaskillschema',
    DroptableSchema = 'droptableschema',
    StatSchema = 'statschema',
    RandomSpawnSchema = 'randomspawnschema',
    PlaceholderSchema = 'placeholderschema',
    EquipmentSetSchema = 'equipmentsetschema',
    ReagentSchema = 'reagentschema',
    MenuSchema = 'menuschema',
    AchievementSchema = 'achievementschema',
}

export enum attributeSpecialValues {
    conditions = 'conditions',
}
