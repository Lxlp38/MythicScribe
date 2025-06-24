import * as vscode from 'vscode';

type Uri = ReturnType<typeof vscode.Uri.toString>;

export class ScribeCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLensesEmitter.event;

    public codeLenses: Record<Uri, vscode.CodeLens[]> = {};

    constructor() {}

    public addCodeLensToDocument(uri: vscode.Uri, codeLens: vscode.CodeLens): void {
        const uriString = uri.toString();
        if (!this.codeLenses[uriString]) {
            this.codeLenses[uriString] = [];
        }
        this.codeLenses[uriString].push(codeLens);
    }

    public clearCodeLensesForDocument(uri: vscode.Uri): void {
        const uriString = uri.toString();
        if (this.codeLenses[uriString]) {
            this.codeLenses[uriString] = [];
        }
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const uriString = document.uri.toString();
        if (this.codeLenses[uriString]) {
            return this.codeLenses[uriString];
        }
        return [];
    }

    refresh(): void {
        this._onDidChangeCodeLensesEmitter.fire();
    }
}

export const scribeCodeLensProvider = new ScribeCodeLensProvider();
