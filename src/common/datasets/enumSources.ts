import atlasJson from '../../../data/atlas.json';

export type AtlasNode = { name: string } & (
    | { type: 'file'; hash: string }
    | { type: 'directory'; children: AtlasNode[] }
);

export class AtlasNodeImpl {
    public children?: AtlasNodeImpl[];
    constructor(
        public node: AtlasNode,
        public root: string = ''
    ) {
        if (node.type === 'directory' && node.children) {
            this.children = node.children.map(
                (child) =>
                    new AtlasNodeImpl(child, this.root ? this.root + '/' + node.name : node.name)
            );
        }
    }

    get path(): string {
        return this.root ? this.root + '/' + this.node.name : this.node.name;
    }
    get identifier(): string {
        return this.node.name.split('.')[0].toLowerCase();
    }

    public getNode(path: string): AtlasNodeImpl | null {
        const parts = path.split('/').filter((part) => part.length > 0);
        let currentNode: AtlasNodeImpl = this;

        for (const part of parts) {
            if (currentNode.node.type !== 'directory' || !currentNode.children) {
                return null;
            }

            const nextNode = currentNode.children.find((child) => child.node.name === part);
            if (!nextNode) {
                return null;
            }

            currentNode = nextNode;
        }

        return currentNode;
    }

    public getFirstChild(): AtlasNodeImpl | null {
        if (this.node.type === 'directory' && this.children && this.children.length > 0) {
            return this.children[0];
        }
        return null;
    }
    public getLastChild(): AtlasNodeImpl | null {
        if (this.node.type === 'directory' && this.children && this.children.length > 0) {
            return this.children[this.children.length - 1];
        }
        return null;
    }

    public getFiles(): AtlasNodeImpl[] {
        if (this.node.type === 'file') {
            return [this];
        } else if (this.node.type === 'directory' && this.children) {
            let nodes: AtlasNodeImpl[] = [];
            for (const child of this.children) {
                const childFiles = child.getFiles();
                nodes = nodes.concat(childFiles);
            }
            return nodes;
        }
        return [];
    }

    public getHash(): string | null {
        if (this.node.type === 'file') {
            return this.node.hash;
        }
        return null;
    }

    public printTree(indent: string = ' '): void {
        // eslint-disable-next-line no-console
        console.log(`${indent}- ${this.node.name} (${this.node.type})`);
        if (this.node.type === 'directory' && this.children) {
            for (const child of this.children) {
                child.printTree(indent + '  ');
            }
        }
    }
}

export const atlasRegistry = new AtlasNodeImpl(atlasJson as AtlasNode);

export const localEnums: AtlasNodeImpl[] = atlasRegistry.getNode('mythic')?.getFiles() || [];

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
