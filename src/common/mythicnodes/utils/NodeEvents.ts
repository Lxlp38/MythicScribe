import * as vscode from 'vscode';
import { checkFileType } from '@common/subscriptions/SubscriptionHelper';
import { ConfigProvider } from '@common/providers/configProvider';
import { openDocumentTactfully } from '@common/utils/uriutils';

import { MythicNodeHandler } from '../MythicNode';
import { updateActiveEditorDecorations } from './NodeDecorations';
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
