import { ActiveFileTypeInfo } from '@common/subscriptions/SubscriptionHelper';
import * as vscode from 'vscode';

export type DecorationMap = {
    decorationType: vscode.TextEditorDecorationType;
    options: vscode.DecorationOptions[];
};

type Uri = ReturnType<typeof vscode.Uri.toString>;

export abstract class DecorationProvider<T, D extends string = string> extends vscode.Disposable {
    protected typeRegistry = new Map<D, vscode.TextEditorDecorationType>();

    // Present status of the decorations for each document
    protected decorationCache = new Map<Uri, Map<string, DecorationMap>>();

    // Decorations that will have to be removed
    protected oldDecorations = new Map<Uri, Set<vscode.TextEditorDecorationType>>();

    protected onDidChangeActiveTextEditorRetCondition: () => boolean = () => true;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        super(() => {
            this.onDispose();
        });
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor.bind(this)),
            vscode.workspace.onDidCloseTextDocument((document) => {
                this.resetCacheForDocument(document.uri);
                this.oldDecorations.delete(document.uri.toString());
            })
        );
    }

    private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            return;
        }
        if (!this.onDidChangeActiveTextEditorRetCondition() && !ActiveFileTypeInfo.enabled) {
            this.clearOldDecorations(editor);
            return;
        }
        const doc = this.decorationCache.get(editor.document.uri.toString());
        if (doc) {
            this.updateDecorations(doc, editor);
        }
    }

    protected abstract getDecorationTypeKey(input: T): D;

    protected abstract createDecorationType(input: T): vscode.TextEditorDecorationType;

    protected getDecoration(input: T): [vscode.TextEditorDecorationType, string] {
        const key = this.getDecorationTypeKey(input);
        if (this.typeRegistry.has(key)) {
            return [this.typeRegistry.get(key)!, key];
        }
        const decoration = this.createDecorationType(input);
        this.typeRegistry.set(key, decoration);
        return [decoration, key];
    }

    protected getRange(i: number, match: RegExpExecArray): vscode.Range {
        const startPos = new vscode.Position(i, match.index);
        const endPos = new vscode.Position(i, match.index + match[0].length);
        return new vscode.Range(startPos, endPos);
    }

    public addDecoration(
        decorations: Map<string, DecorationMap>,
        index: { line: number; match: RegExpExecArray } | vscode.Range,
        input: T,
        options?: Partial<vscode.DecorationOptions>
    ): vscode.Range {
        const range =
            index instanceof vscode.Range ? index : this.getRange(index.line, index.match);
        const [decorationType, key] = this.getDecoration(input);
        if (!decorations.has(key)) {
            decorations.set(key, {
                decorationType,
                options: [],
            });
        }
        decorations.get(key)!.options.push({ ...options, range: range });
        return range;
    }

    protected clearDecorations() {
        this.typeRegistry.forEach((value) => {
            value.dispose();
        });
        this.typeRegistry.clear();
        this.clearAllOldDecorations();
        this.decorationCache.forEach((map) => {
            map.forEach((value) => {
                value.decorationType.dispose();
            });
        });
        this.decorationCache.clear();
    }

    public updateDecorations(
        decorations: Map<string, DecorationMap>,
        editor: vscode.TextEditor | undefined
    ) {
        if (!editor) {
            return;
        }
        this.clearOldDecorations(editor);

        this.decorationCache.set(editor.document.uri.toString(), decorations);

        decorations.forEach((value) => {
            editor.setDecorations(value.decorationType, value.options);
        });
        this.updateOldDecorations(editor, decorations);
    }

    public reapplyDecorations(editor: vscode.TextEditor) {
        const uri = editor.document.uri.toString();
        if (this.decorationCache.has(uri)) {
            const decorations = this.decorationCache.get(uri)!;
            this.updateDecorations(decorations, editor);
            return;
        }
        this.clearOldDecorations(editor);
    }

    protected onDispose() {
        this.clearDecorations();
        this.disposables.forEach((d) => d.dispose());
    }

    public clearAllOldDecorations() {
        this.oldDecorations.forEach((decorationTypes, uri) => {
            const editor = vscode.window.visibleTextEditors.find(
                (e) => e.document.uri.toString() === uri
            );
            if (editor) {
                decorationTypes.forEach((decorationType) => {
                    editor.setDecorations(decorationType, []);
                });
            }
        });
        this.oldDecorations.clear();
    }

    public clearOldDecorations(editor: vscode.TextEditor) {
        const uri = editor.document.uri.toString();
        const old = this.oldDecorations.get(uri);
        if (!old) {
            return;
        }
        old.forEach((decorationType) => {
            editor.setDecorations(decorationType, []);
        });

        this.oldDecorations.delete(uri);
    }
    public updateOldDecorations(
        editor: vscode.TextEditor,
        decorations: Map<string, DecorationMap>
    ) {
        const uri = editor.document.uri.toString();
        if (!this.oldDecorations.has(uri)) {
            this.oldDecorations.set(uri, new Set());
        }
        decorations.forEach((value) => {
            this.oldDecorations.get(uri)!.add(value.decorationType);
        });
    }

    public getCache(): Map<Uri, Map<string, DecorationMap>> {
        return this.decorationCache;
    }

    public resetCacheForDocument(uri: vscode.Uri) {
        const uriString = uri.toString();
        if (this.decorationCache.has(uriString)) {
            this.decorationCache.get(uriString)!.clear();
            this.decorationCache.delete(uriString);
        }
    }

    public removeDecorationsOnLine(
        editor: vscode.TextEditor | undefined,
        line: number,
        type: Parameters<this['removeDecorationsConditionally']>[0]
    ) {
        return this.removeDecorationsConditionally(
            type,
            editor,
            (option) => option.range.start.line === line
        );
    }

    // Preserve decorations that do not match the condition
    public removeDecorationsConditionally(
        type: T | Array<T>,
        editor: vscode.TextEditor | undefined,
        condition: (option: vscode.DecorationOptions) => boolean
    ) {
        if (!editor) {
            return;
        }
        if (Array.isArray(type)) {
            type.forEach((t) => this.removeDecorationsConditionally(t, editor, condition));
            return;
        }
        const [decorationType, key] = this.getDecoration(type);
        const decorations = this.decorationCache.get(editor.document.uri.toString());
        if (decorations && decorations.has(key)) {
            const options = decorations.get(key)!.options.filter((option) => !condition(option));
            if (options.length > 0) {
                decorations.get(key)!.options = options;
                editor.setDecorations(decorationType, options);
            } else {
                decorations.delete(key);
                editor.setDecorations(decorationType, []);
            }
        }
    }
}
