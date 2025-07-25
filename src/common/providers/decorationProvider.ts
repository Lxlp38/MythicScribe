import { ActiveFileTypeInfo } from '@common/subscriptions/SubscriptionHelper';
import * as vscode from 'vscode';

export type DecorationMap = {
    decorationType: vscode.TextEditorDecorationType;
    options: vscode.DecorationOptions[];
    //options?: vscode.DecorationRenderOptions;
};

type Uri = ReturnType<typeof vscode.Uri.toString>;

export abstract class DecorationProvider<T, D extends string = string> extends vscode.Disposable {
    protected decorationTypeMap = new Map<D, vscode.TextEditorDecorationType>();
    protected oldDecorations = new Map<Uri, DecorationMap>();
    protected textEditorNeedsUpdate: boolean = false;
    protected oldDecorationsMap = new Map<Uri, Map<string, DecorationMap>>();

    protected onDidChangeActiveTextEditorRetCondition: () => boolean = () => true;
    private changeActiveTextEditorListener: vscode.Disposable;

    constructor() {
        super(() => {
            this.onDispose();
        });
        this.changeActiveTextEditorListener = vscode.window.onDidChangeActiveTextEditor(
            this.onDidChangeActiveTextEditor.bind(this)
        );
    }

    private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
        if (!this.onDidChangeActiveTextEditorRetCondition() && !ActiveFileTypeInfo.enabled) {
            return;
        }
        if (editor && this.textEditorNeedsUpdate) {
            const doc = this.oldDecorationsMap.get(editor.document.uri.toString());
            if (doc) {
                this.updateDecorations(doc);
            }
        }
    }

    protected abstract getDecorationTypeKey(input: T): D;

    protected abstract createDecorationType(input: T): vscode.TextEditorDecorationType;

    protected getDecoration(input: T): [vscode.TextEditorDecorationType, string] {
        const key = this.getDecorationTypeKey(input);
        if (this.decorationTypeMap.has(key)) {
            return [this.decorationTypeMap.get(key)!, key];
        }
        const decoration = this.createDecorationType(input);
        this.decorationTypeMap.set(key, decoration);
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
        this.decorationTypeMap.forEach((value) => {
            value.dispose();
        });
        this.decorationTypeMap.clear();
        this.oldDecorations.forEach((value) => {
            value.decorationType.dispose();
        });
        this.oldDecorations.clear();
        this.oldDecorationsMap.forEach((map) => {
            map.forEach((value) => {
                value.decorationType.dispose();
            });
        });
        this.oldDecorationsMap.clear();
        this.textEditorNeedsUpdate = true;
    }

    public updateDecorations(
        decorations: Map<string, DecorationMap>,
        document?: vscode.TextDocument
    ) {
        if (document) {
            if (decorations.size === 0) {
                this.oldDecorationsMap.delete(document.uri.toString());
            } else {
                this.oldDecorationsMap.set(document.uri.toString(), decorations);
            }
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            this.textEditorNeedsUpdate = true;
            return;
        }
        this.oldDecorations.forEach((value) => {
            activeEditor.setDecorations(value.decorationType, []);
        });
        this.oldDecorations.clear();
        decorations.forEach((value) => {
            activeEditor.setDecorations(value.decorationType, value.options);
            this.oldDecorations.set(value.decorationType.key, value);
        });
        this.textEditorNeedsUpdate = false;
    }

    protected onDispose() {
        this.clearDecorations();
        this.changeActiveTextEditorListener.dispose();
    }
}
