import * as vscode from 'vscode';

import { generateNumbersInRange } from '../utils/schemautils';
import { MythicAttribute } from './ScribeMechanic';
import { retriggerCompletionsCommand } from '../utils/completionhelper';
import { ScribeEnumHandler } from './ScribeEnum';

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

export const ScribePlaceholderHandler = new PlaceholderNode(new PlaceholderSegment('root'));

function parsePlaceholder(placeholder: string): Placeholder {
    const args = placeholder.split('.');
    return new Placeholder(...args);
}

export function removeLastPlaceholderSegment(placeholder: string): string {
    const segments = placeholder.split('.');
    segments.pop();
    return segments.join('.');
}

export function getNodeFromPlaceholder(placeholder: string): PlaceholderNode | undefined {
    // Split the placeholder string on dots
    const segments = placeholder.split('.');
    // Start from the root of the placeholder tree
    let currentNode = ScribePlaceholderHandler;

    for (const seg of segments) {
        // First try to find a child whose toString() directly matches the segment
        let nextNode = currentNode.children.find((child) => child.toString() === seg);

        // If not found, check if there is a scripted placeholder node
        // where the segment is one of the allowed arbitrary values.
        if (!nextNode) {
            nextNode = currentNode.children.find((child) => {
                // Check if this is a scripted segment
                if (child.value instanceof ScriptedPlaceholderSegment) {
                    // Compare against the arbitrary data provided by its value() function.
                    return child.value.isOwnValue(seg);
                }
                return false;
            });
        }

        // If no matching child was found, return undefined.
        if (!nextNode) {
            return undefined;
        }

        // Move to the next node in the tree.
        currentNode = nextNode;
    }

    return currentNode;
}

export async function initializePlaceholders() {
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

    // Generate placeholder nodes for all placeholder enums
    const placeholderDataset = await ScribeEnumHandler.getEnum('placeholder')?.waitForDataset();
    if (!placeholderDataset) {
        return;
    }
    for (const key of placeholderDataset.keys()) {
        ScribePlaceholderHandler.addNodes(parsePlaceholder(key).getPlaceholderNodes());
    }
    ScribePlaceholderHandler.addNodes(
        parsePlaceholder('placeholder.{CustomPlaceholder}').getPlaceholderNodes()
    );
}
