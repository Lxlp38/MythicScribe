import * as vscode from 'vscode';
import { checkFileType } from '@common/subscriptions/SubscriptionHelper';
import { ConfigProvider } from '@common/providers/configProvider';
import { openDocumentTactfully } from '@common/utils/uriutils';

import { MythicNodeHandler } from '../MythicNode';
import { nodeDecorations, updateActiveEditorDecorations } from './NodeDecorations';
import { executeFunctionAfterActivation } from '../../../MythicScribe';

let eventsLoaded = false;

const disposables: vscode.Disposable[] = [];

export function loadNodeEvents() {
    if (eventsLoaded) {
        return;
    }
    eventsLoaded = true;
    vscode.workspace.onDidSaveTextDocument(
        (document) => {
            if (!document || !document.uri) {
                return;
            }
            if (!ConfigProvider.registry.fileParsingPolicy.get('parseOnSave')) {
                return;
            }
            const type = checkFileType(document.uri)?.key;
            if (type) {
                MythicNodeHandler.registry[type].updateDocument(document);

                const activeEditor = vscode.window.activeTextEditor;
                if (
                    activeEditor &&
                    activeEditor.document.uri.toString() === document.uri.toString()
                ) {
                    updateActiveEditorDecorations();
                }
            }
        },
        undefined,
        disposables
    );

    vscode.workspace.onDidChangeTextDocument(
        (event) => {
            if (event.contentChanges.length === 0) {
                return;
            }
            if (
                event.document.uri === vscode.window.activeTextEditor?.document.uri &&
                event.document.uri !== undefined
            ) {
                const startLine = event.contentChanges[0].range.start.line;

                if (event.contentChanges[0].text.includes('\n')) {
                    for (let i = startLine; i < event.document.lineCount; i++) {
                        nodeDecorations.removeDecorationsConditionally(
                            ['delayTracking', 'soundPlayback', 'specificSoundPlayback'],
                            vscode.window.activeTextEditor,
                            (option) => option.range.start.line <= i
                        );
                    }
                } else {
                    nodeDecorations.removeDecorationsOnLine(
                        vscode.window.activeTextEditor,
                        startLine,
                        'delayTracking'
                    );
                }
            }
            if (!ConfigProvider.registry.fileParsingPolicy.get('parseOnModification')) {
                return;
            }
            const type = checkFileType(event.document.uri)?.key;
            if (type) {
                MythicNodeHandler.registry[type].updateDocument(event.document);
            }
        },
        undefined,
        disposables
    );

    vscode.workspace.onDidRenameFiles(
        async (event) => {
            for (const { oldUri, newUri } of event.files) {
                const oldType = checkFileType(oldUri)?.key;
                const newType = checkFileType(newUri)?.key;

                if (oldType) {
                    MythicNodeHandler.registry[oldType].clearDocument(oldUri);
                }

                if (newType) {
                    const newDocument = await openDocumentTactfully(newUri);
                    if (!newDocument) {
                        continue;
                    }
                    MythicNodeHandler.registry[newType].updateDocument(newDocument);
                }
            }
        },
        undefined,
        disposables
    );

    vscode.workspace.onDidCreateFiles(async (event) => {
        for (const file of event.files) {
            const document = await openDocumentTactfully(file);
            if (!document) {
                continue;
            }
            const type = checkFileType(document.uri)?.key;
            if (type) {
                MythicNodeHandler.registry[type].updateDocument(document);
            }
        }
    });

    vscode.workspace.onDidDeleteFiles(
        async (event) => {
            for (const file of event.files) {
                const type = checkFileType(file)?.key;
                if (type) {
                    MythicNodeHandler.registry[type].clearDocument(file);
                }
            }
        },
        undefined,
        disposables
    );

    vscode.window.onDidChangeVisibleTextEditors(
        () => {
            updateActiveEditorDecorations();
        },
        undefined,
        disposables
    );

    executeFunctionAfterActivation((context) => {
        context.subscriptions.push(...disposables);
    });
}
