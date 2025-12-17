import atlasJson from '../../../data/atlas.json';

type AtlasBaseNode = { name: string };
export type AtlasFileNode = AtlasBaseNode & { type: 'file'; hash: string };
export type AtlasDirectoryNode = AtlasBaseNode & { type: 'directory'; children: AtlasNode[] };

export type AtlasNode = AtlasFileNode | AtlasDirectoryNode;

export abstract class AbstractAtlasNodeImpl<NodeType extends AtlasNode = AtlasNode> {
    constructor(
        public node: NodeType,
        public root: string
    ) {}

    get path(): string {
        return this.root ? this.root + '/' + this.node.name : this.node.name;
    }

    public abstract getNode(path: string): AbstractAtlasNodeImpl | null;

    public abstract getFiles(): AtlasFileNodeImpl[];
}

export class AtlasDirectoryNodeImpl extends AbstractAtlasNodeImpl<AtlasDirectoryNode> {
    children: AbstractAtlasNodeImpl[];
    constructor(node: AtlasDirectoryNode, root: string) {
        super(node, root);
        this.children = node.children.map((child) => createNode(child, this.path));
    }

    public getNode(path: string): AbstractAtlasNodeImpl | null {
        const parts = path.split('/').filter((part) => part.length > 0);
        let currentNode: AbstractAtlasNodeImpl = this;

        if (parts.length === 0) {
            return currentNode;
        }
        if (parts[0] === this.node.name) {
            parts.shift();
        }

        for (const part of parts) {
            if (!(currentNode instanceof AtlasDirectoryNodeImpl) || !currentNode.children) {
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

    public getFiles(): AtlasFileNodeImpl[] {
        let nodes: AtlasFileNodeImpl[] = [];
        for (const child of this.children) {
            const childFiles = child.getFiles();
            nodes = nodes.concat(childFiles);
        }
        return nodes;
    }

    public printTree(indent: string = ' '): void {
        // eslint-disable-next-line no-console
        console.log(`${indent}- ${this.node.name} (${this.node.type})`);
        for (const child of this.children) {
            if (child instanceof AtlasDirectoryNodeImpl) {
                child.printTree(indent + '  ');
            }
        }
    }
}

export class AtlasRootNodeImpl extends AtlasDirectoryNodeImpl {
    constructor(node: AtlasDirectoryNode) {
        super(node, '');
    }

    public override getNode(path: string): AbstractAtlasNodeImpl | null {
        const parts = path.split('/').filter((part) => part.length > 0);
        if (parts.length === 0) {
            return this;
        }
        if (parts[0] === this.node.name) {
            parts.shift();
        }
        return super.getNode(parts.join('/'));
    }
}

export class AtlasFileNodeImpl extends AbstractAtlasNodeImpl<AtlasFileNode> {
    constructor(node: AtlasFileNode, root: string) {
        super(node, root);
    }

    public getNode(): null {
        return null;
    }

    public getFiles(): AtlasFileNodeImpl[] {
        return [this];
    }

    public getHash(): string {
        return this.node.hash;
    }

    get identifier(): string {
        return this.node.name.split('.')[0].toLowerCase();
    }
}

export function createNode(node: AtlasNode, root: string = '') {
    if (node.type === 'directory') {
        return new AtlasDirectoryNodeImpl(node, root);
    } else {
        return new AtlasFileNodeImpl(node, root);
    }
}

export const atlasDataNode = new AtlasRootNodeImpl(atlasJson as AtlasDirectoryNode);
