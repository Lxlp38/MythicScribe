import { type DecorationMap, DecorationProvider } from '@common/providers/decorationProvider';
import { checkFileType } from '@common/subscriptions/SubscriptionHelper';
import { ConfigProvider } from '@common/utils/configutils';
import * as vscode from 'vscode';
import { scribeCodeLensProvider } from '@common/providers/codeLensProvider';

import { executeFunctionAfterActivation } from '@common/../MythicScribe';

import { MythicNode, MythicNodeHandler } from '../MythicNode';

export type NodeDecorationType = Parameters<
    typeof ConfigProvider.registry.decorationOptions.get
>[0];
export class NodeDecorations extends DecorationProvider<NodeDecorationType, NodeDecorationType> {
    constructor() {
        super();
        executeFunctionAfterActivation((context) => {
            this.registry.soundPlayback.gutterIconPath = vscode.Uri.joinPath(
                context.extensionUri,
                'assets',
                'utils',
                'minecraftsounds.png'
            );
        });
        return;
    }
    registry: Record<NodeDecorationType, vscode.DecorationRenderOptions> = {
        delayTracking: {
            after: {
                color: 'gray',
                margin: '0 0 0 1em',
            },
        },
        soundPlayback: {
            gutterIconPath: undefined,
            gutterIconSize: 'contain',
        },
    };

    public addNodeDecoration(
        node: MythicNode,
        index: Parameters<typeof this.addDecoration>[1],
        input: Parameters<typeof this.addDecoration>[2],
        options?: Parameters<typeof this.addDecoration>[3],
        codeLens?: Omit<vscode.CodeLens, 'range'> & { range?: vscode.Range }
    ) {
        if (!ConfigProvider.registry.decorationOptions.get(input)) {
            return;
        }
        const uri = node.document.uri.toString();
        if (!node.registry.decorationsByDocument.has(uri)) {
            node.registry.decorationsByDocument.set(uri, new Map<string, DecorationMap>());
        }
        const decorations = node.registry.decorationsByDocument.get(uri)!;
        const range = this.addDecoration(decorations, index, input, options);
        if (codeLens) {
            if (!codeLens.range) {
                codeLens.range = range;
            }
            scribeCodeLensProvider.addCodeLensToDocument(
                node.document.uri,
                codeLens as vscode.CodeLens
            );
        }
    }

    protected getDecorationTypeKey(input: NodeDecorationType): NodeDecorationType {
        return input;
    }
    protected createDecorationType(input: NodeDecorationType): vscode.TextEditorDecorationType {
        return vscode.window.createTextEditorDecorationType(this.registry[input]);
    }
}

export const nodeDecorations = new NodeDecorations();

export function updateActiveEditorDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const type = checkFileType(editor.document.uri)?.key;
    if (!type) {
        return;
    }
    const temp = MythicNodeHandler.registry[type].decorationsByDocument.get(
        editor.document.uri.toString()
    );
    if (!temp) {
        return;
    }
    for (const [_key, decoration] of temp) {
        editor.setDecorations(decoration.decorationType, []);
        if (decoration.options.length > 0) {
            editor.setDecorations(decoration.decorationType, decoration.options);
        }
    }
    scribeCodeLensProvider.refresh();
}
