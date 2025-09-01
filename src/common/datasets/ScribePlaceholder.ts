import * as vscode from 'vscode';
import { registryKey } from '@common/objectInfos';
import { globalCallbacks } from '@common/providers/callbackProvider';

import { ScribeEnumHandler, AbstractScribeEnum, EnumDatasetValue } from './ScribeEnum';
import { generateNumbersInRange } from '../utils/schemautils';
import { MythicAttribute } from './ScribeMechanic';
import { retriggerCompletionsCommand } from '../utils/completionhelper';

interface MetaKeyword {
    description: string;
    originType: string;
    returnType: string;
}

class PlaceholderSegment {
    public identifier: string;
    constructor(identifier: string) {
        this.identifier = identifier.toLowerCase();
    }
    get(): string[] {
        return [this.identifier];
    }
    toString(): string {
        return this.identifier;
    }
}

class ScriptedPlaceholderSegment extends PlaceholderSegment {
    constructor(identifier: string, get: () => string[], isOwnValue?: (value: string) => boolean) {
        super('{' + identifier.toLowerCase() + '}');
        this.get = get;
        if (isOwnValue) {
            this.isOwnValue = isOwnValue;
        }
        ScriptedPlaceholderSegmentHandler.addSegment(this);
    }

    isOwnValue(value: string): boolean {
        return this.get().includes(value);
    }
}

const ScriptedPlaceholderSegmentHandler = {
    segments: new Map<string, ScriptedPlaceholderSegment>(),
    addSegment(segment: ScriptedPlaceholderSegment) {
        this.segments.set(segment.identifier.toLowerCase(), segment);
    },
    getSegment(identifier: string): ScriptedPlaceholderSegment | undefined {
        return this.segments.get(identifier.toLowerCase());
    },
    clearSegments() {
        this.segments.clear();
    },
};

class Placeholder {
    public args: PlaceholderSegment[] = [];
    public attributes: MythicAttribute[] = [];

    constructor(...args: string[]) {
        args.forEach((arg) => {
            const segment = ScriptedPlaceholderSegmentHandler.getSegment(arg);
            if (segment) {
                this.args.push(segment);
            } else {
                this.args.push(new PlaceholderSegment(arg));
            }
        });
    }

    getPlaceholderNodes(): PlaceholderNode[] {
        return this.args.map((arg, index) => {
            const node = new PlaceholderNode(arg);
            if (index === this.args.length - 1) {
                node.isEnd = true;
            }
            return node;
        });
    }
}

export class PlaceholderNode {
    public value: PlaceholderSegment;
    public attributes: MythicAttribute[] = [];
    public children: Record<string, PlaceholderNode> = {};
    constructor(value: PlaceholderSegment) {
        this.value = value;
    }
    public isEnd: boolean = false;

    toString(): string {
        return this.value.toString();
    }

    addNodes(nodes: PlaceholderNode[]) {
        const headNode = nodes.shift();
        if (headNode) {
            const headNodeHash = headNode.toString();
            const existingNode = this.children[headNodeHash];
            if (existingNode) {
                existingNode.addNodes(nodes);
            } else {
                this.children[headNodeHash] = headNode;
                headNode.addNodes(nodes);
            }
        }
    }

    mergeNode(node: PlaceholderNode) {
        Object.values(node.children).forEach((child) => {
            const existingChild = this.children[child.toString()];
            if (existingChild) {
                existingChild.mergeNode(child);
            } else {
                this.children[child.toString()] = child;
            }
        });
    }

    getChild(key: string): PlaceholderNode | undefined {
        return this.children[key];
    }

    printTree(indent = 0): string {
        let output = ' '.repeat(indent) + this.toString() + ' -> ' + this.value.get() + '\n';
        Object.values(this.children).forEach((child) => {
            output += child.printTree(indent + 2);
        });
        return output;
    }

    generateCompletions(): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        Object.values(this.children).forEach((child) => {
            child.value.get().forEach((value) => {
                const completion = new vscode.CompletionItem(
                    value,
                    vscode.CompletionItemKind.Field
                );
                if (Object.keys(child.children).length > 0) {
                    if (child.isEnd) {
                        completions.push(
                            new vscode.CompletionItem(value + '>', vscode.CompletionItemKind.Field)
                        );
                    }
                    completion.insertText = new vscode.SnippetString(value + '.');
                    completion.command = retriggerCompletionsCommand;
                } else {
                    completion.insertText = new vscode.SnippetString(value + '>');
                }
                completions.push(completion);
            });
        });

        return completions;
    }
}

export const ScribePlaceholderRoot = new PlaceholderNode(new PlaceholderSegment('root'));

function parsePlaceholder(placeholder: string): Placeholder {
    const args = placeholder.split('.');
    return new Placeholder(...args);
}

export function removeLastPlaceholderSegment(placeholder: string): string {
    const segments = placeholder.split('.');
    segments.pop();
    return segments.join('.');
}

export function getLastNodeFromPlaceholder(placeholder: string): PlaceholderNode | undefined {
    // Split the placeholder string on dots
    const segments = placeholder.split('.');
    // Start from the root of the placeholder tree
    let currentNode = ScribePlaceholderRoot;

    for (const seg of segments) {
        // Find the child node that matches the current segment
        let nextNode = findMatchingChildNodeByValue(currentNode, seg);

        // If no matching child was found, return undefined.
        if (!nextNode) {
            return undefined;
        }

        // Move to the next node in the tree.
        currentNode = nextNode;
    }

    return currentNode;
}

export function findMatchingChildNodeByValue(
    node: PlaceholderNode,
    value: string
): PlaceholderNode | undefined {
    const foundNode = node.children[value];
    if (foundNode) {
        return foundNode;
    }
    return Object.values(node.children).find((child) => {
        if (child.value instanceof ScriptedPlaceholderSegment) {
            return child.value.isOwnValue(value);
        }
        return false;
    });
}

export function parseWrittenPlaceholder(placeholder: string): PlaceholderNode[] {
    placeholder = placeholder.replace(/>\s*$/, '').replace(/^\s*</g, '');
    const nodes: PlaceholderNode[] = [];
    const segments = placeholder.split('.');
    let currentNode = ScribePlaceholderRoot;

    for (const seg of segments) {
        const nextNode = findMatchingChildNodeByValue(currentNode, seg);

        if (!nextNode) {
            return nodes;
        }

        nodes.push(nextNode);
        currentNode = nextNode;
    }

    return nodes;
}

export function fromPlaceholderNodeIdentifierToRegistryKey(
    target: string | PlaceholderNode
): registryKey | undefined {
    const identifier = typeof target === 'string' ? target : target.value.identifier;
    let maybeRegistryKey = '';
    switch (identifier) {
        case '{mythicitem}':
            return 'item';
        case '{customplaceholder}':
            return 'placeholder';
    }
    if (identifier.startsWith('{') && identifier.endsWith('}')) {
        maybeRegistryKey = identifier.slice(1, -1).toLowerCase();
        if ((registryKey as readonly string[]).includes(maybeRegistryKey)) {
            return maybeRegistryKey as registryKey;
        }
    }
    return undefined;
}

globalCallbacks.activation.registerCallback('pre-activation', () => {
    ScribeEnumHandler.enumCallback.registerCallback('placeholder', (target: AbstractScribeEnum) => {
        initializePlaceholders(target.getDataset());
    });
    ScribeEnumHandler.enumCallback.registerCallback(
        'variableplaceholdermetakeyword',
        (target: AbstractScribeEnum) => {
            initializeMetaKeywords(target.getDataset() as Map<string, MetaKeyword>);
        }
    );
});

export async function initializePlaceholders(placeholderDataset: Map<string, EnumDatasetValue>) {
    ScriptedPlaceholderSegmentHandler.clearSegments();

    // Generate scripted placeholder segments from enums
    ScribeEnumHandler.enums.forEach((enumNode) => {
        new ScriptedPlaceholderSegment(enumNode.identifier, () =>
            Array.from(enumNode.getDataset().keys())
        );
    });
    // Generate scripted placeholder segments for common types
    new ScriptedPlaceholderSegment(
        'Integer',
        () => generateNumbersInRange(0, 10, 1).map((num) => num.toString()),
        (value) => !isNaN(parseInt(value))
    );
    new ScriptedPlaceholderSegment(
        'Float',
        () => generateNumbersInRange(0, 10, 0.5, true).map((num) => num.toString()),
        (value) => !isNaN(parseFloat(value))
    );
    new ScriptedPlaceholderSegment(
        'Double',
        () => generateNumbersInRange(0, 10, 0.5, true).map((num) => num.toString()),
        (value) => !isNaN(parseFloat(value))
    );
    new ScriptedPlaceholderSegment(
        'IntegerRange',
        () => ['1to2', '-1to2', '-2to-1'],
        (value) => /^-?\d+to-?\d+$/.test(value)
    );
    new ScriptedPlaceholderSegment(
        'FloatRange',
        () => ['1.0to2.0', '-1.0to2.0', '-2.0to-1.0'],
        (value) => /^-?\d+(\.\d+)?to-?\d+(\.\d+)?$/.test(value)
    );
    new ScriptedPlaceholderSegment(
        'Map',
        () => ['key1=value1', 'key2=value2', 'key1=value1;key2=value2'],
        (value) => /^((.*=.*);)*(.*=.*)$/m.test(value)
    );
    new ScriptedPlaceholderSegment(
        'List',
        () => ['value1', 'value1,value2', 'value1,value2,value3'],
        (value) => /^(.*,)*(.*)$/.test(value)
    );
    new ScriptedPlaceholderSegment(
        'Set',
        () => ['value1', 'value1,value2', 'value1,value2,value3'],
        (value) => /^(.*,)*(.*)$/.test(value)
    );
    new ScriptedPlaceholderSegment(
        'Vector',
        () => ['1,2,3', '1.0,2.0,3.0'],
        (value) => /^\d+(\.\d+),\d+(\.\d+),\d+(\.\d+)$/.test(value)
    );

    ['VariableName', 'Text', 'Value', 'Key', 'Namespace'].forEach((name) => {
        new ScriptedPlaceholderSegment(
            name,
            () => [],
            () => true
        );
    });

    // Generate placeholder nodes for all placeholder enums
    for (const key of placeholderDataset.keys()) {
        ScribePlaceholderRoot.addNodes(parsePlaceholder(key).getPlaceholderNodes());
    }

    // Add the Custom Placeholder placeholder. I wrote that right.
    ScribePlaceholderRoot.addNodes(
        parsePlaceholder('placeholder.{CustomPlaceholder}').getPlaceholderNodes()
    );
}

interface MetaKeywordData {
    input: string;
    nodes: PlaceholderNode[];
    output: string;
}

export const ScribePlaceholderMetaKeywordsRoot: MetaKeywordData[] = [];

export async function initializeMetaKeywords(mkDataset: Map<string, MetaKeyword>) {
    for (const [key, value] of mkDataset.entries()) {
        ScribePlaceholderMetaKeywordsRoot.push({
            input: value.originType,
            nodes: parsePlaceholder(key).getPlaceholderNodes(),
            output: value.returnType,
        });
    }

    const universalNodes = ScribePlaceholderMetaKeywordsRoot.filter((mk) => mk.input === 'ALL');
    universalNodes.forEach((mk) => {
        ScribePlaceholderMetaKeywordsRoot.forEach((otherMk) => {
            otherMk.nodes[otherMk.nodes.length - 1].addNodes(Array.from(mk.nodes));
        });
    });

    const polymorphicNodes = ScribePlaceholderMetaKeywordsRoot.filter((mk) => mk.output === 'ALL');
    polymorphicNodes.forEach((mk) => {
        ScribePlaceholderMetaKeywordsRoot.forEach((otherMk) => {
            mk.nodes[mk.nodes.length - 1].addNodes(Array.from(otherMk.nodes));
        });
    });

    ScribePlaceholderMetaKeywordsRoot.forEach((mk) => {
        ScribePlaceholderMetaKeywordsRoot.forEach((otherMk) => {
            if (mk.input === otherMk.output) {
                otherMk.nodes[otherMk.nodes.length - 1].addNodes(Array.from(mk.nodes));
            }
        });
    });

    ['caster', 'target', 'skill', 'world', 'global'].forEach((name) => {
        const variablePlaceholderLastNode = ScribePlaceholderRoot.getChild(name)
            ?.getChild('var')
            ?.getChild('{variablename}');

        if (variablePlaceholderLastNode) {
            ScribePlaceholderMetaKeywordsRoot.forEach((mk) => {
                variablePlaceholderLastNode.addNodes(Array.from(mk.nodes));
            });
        }
    });
}
