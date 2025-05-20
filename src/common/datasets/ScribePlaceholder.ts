import * as vscode from 'vscode';
import { registryKey } from '@common/objectInfos';

import { generateNumbersInRange } from '../utils/schemautils';
import { MythicAttribute } from './ScribeMechanic';
import { retriggerCompletionsCommand } from '../utils/completionhelper';
import {
    AbstractScribeEnum,
    addEnumLoadedFunction,
    EnumDatasetValue,
    ScribeEnumHandler,
} from './ScribeEnum';

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
        super('{' + identifier + '}');
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
        this.segments.set(segment.identifier, segment);
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
    public children: PlaceholderNode[] = [];
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
            const existingNode = this.children.find((child) => child.toString() === headNodeHash);
            if (existingNode) {
                existingNode.addNodes(nodes);
            } else {
                this.children.push(headNode);
                headNode.addNodes(nodes);
            }
        }
    }

    printTree(indent = 0): string {
        let output = ' '.repeat(indent) + this.toString() + ' -> ' + this.value.get() + '\n';
        this.children.forEach((child) => {
            output += child.printTree(indent + 2);
        });
        return output;
    }

    generateCompletions(): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        this.children.forEach((child) => {
            child.value.get().forEach((value) => {
                const completion = new vscode.CompletionItem(
                    value,
                    vscode.CompletionItemKind.Field
                );
                if (child.children.length > 0) {
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
    const foundNode = node.children.find((child) => child.toString() === value);
    if (foundNode) {
        return foundNode;
    }
    return node.children.find((child) => {
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
        if (registryKey.includes(maybeRegistryKey as registryKey)) {
            return maybeRegistryKey as registryKey;
        }
    }
    return undefined;
}

addEnumLoadedFunction('placeholder', (target: AbstractScribeEnum) => {
    initializePlaceholders(target.getDataset());
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
        'IntegerRange',
        () => ['1to2', '-1to2', '-2to-1'],
        (value) => /^-?\d+to-?\d+$/.test(value)
    );
    new ScriptedPlaceholderSegment(
        'FloatRange',
        () => ['1.0to2.0', '-1.0to2.0', '-2.0to-1.0'],
        (value) => /^-?\d+(\.\d+)?to-?\d+(\.\d+)?$/.test(value)
    );

    // Generate placeholder nodes for all placeholder enums
    for (const key of placeholderDataset.keys()) {
        ScribePlaceholderRoot.addNodes(parsePlaceholder(key).getPlaceholderNodes());
    }

    // Add the Custom Placeholder placeholder. I wrote that right.
    ScribePlaceholderRoot.addNodes(
        parsePlaceholder('placeholder.{CustomPlaceholder}').getPlaceholderNodes()
    );
}
