import * as vscode from 'vscode';

interface DecorationMap {
    decorationType: vscode.TextEditorDecorationType;
    ranges: vscode.Range[];
}
const decorationTypeMap = new Map<string, vscode.TextEditorDecorationType>();

class ScribeColorProvider implements vscode.DocumentColorProvider {
    readonly colorRegex =
        /(?<=\S)#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])|(?<=Color: )(\d{1,3}),(\d{1,3}),(\d{1,3})/g;
    private oldDecorations = new Map<string, DecorationMap>();
    private textEditorNeedsUpdate: boolean = false;
    private oldDecorationsMap = new Map<string, Map<string, DecorationMap>>();

    constructor() {
        vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor.bind(this));
    }

    private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
        if (editor && this.textEditorNeedsUpdate) {
            const doc = this.oldDecorationsMap.get(editor.document.uri.toString());
            if (doc) {
                this.updateDecorations(doc);
            }
        }
    }

    private getColorKey(color: vscode.Color): string {
        return `${color.red},${color.green},${color.blue}`;
    }

    private fromColorToRGBA(color: vscode.Color, alpha: string = '0.1'): string {
        const r = Math.round(color.red * 255);
        const g = Math.round(color.green * 255);
        const b = Math.round(color.blue * 255);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // private getContrastColor(color: vscode.Color): string {
    //     const luminance = 0.299 * color.red + 0.587 * color.green + 0.114 * color.blue;
    //     return luminance > 0.5 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 0.8)';
    // }

    private createDecoration(color: vscode.Color) {
        return vscode.window.createTextEditorDecorationType({
            light: {
                color: 'rgba(0, 0, 0, 0.8)',
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            color: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: this.fromColorToRGBA(color, '0.2'),
            border: '1px solid ' + this.fromColorToRGBA(color, '0.2'),
            cursor: 'pointer',
        });
    }

    private getDecoration(color: vscode.Color) {
        const key = this.getColorKey(color);
        if (decorationTypeMap.has(key)) {
            return decorationTypeMap.get(key)!;
        }
        const decoration = this.createDecoration(color);
        decorationTypeMap.set(key, decoration);
        return decoration;
    }

    private getRange(i: number, match: RegExpExecArray): vscode.Range {
        const startPos = new vscode.Position(i, match.index);
        const endPos = new vscode.Position(i, match.index + match[0].length);
        return new vscode.Range(startPos, endPos);
    }

    private addColorInformation(
        colors: vscode.ColorInformation[],
        decorations: Map<string, DecorationMap>,
        i: number,
        match: RegExpExecArray,
        color: vscode.Color
    ) {
        const range = this.getRange(i, match);
        colors.push(new vscode.ColorInformation(range, color));
        const decorationType = this.getDecoration(color);
        const key = this.getColorKey(color);
        if (!decorations.has(key)) {
            decorations.set(key, {
                decorationType,
                ranges: [],
            });
        }
        decorations.get(key)!.ranges.push(range);
    }

    provideDocumentColors(
        document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const colors: vscode.ColorInformation[] = [];
        const decorations = new Map<string, DecorationMap>();

        // Alpha
        // 0.999 --> HEX
        // 1 --> RGB

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            let match;
            while ((match = this.colorRegex.exec(line.text)) !== null) {
                if (match[0].startsWith('#')) {
                    // Hex color
                    const color = new vscode.Color(
                        parseInt(match[0][1] + match[0][2], 16) / 255,
                        parseInt(match[0][3] + match[0][4], 16) / 255,
                        parseInt(match[0][5] + match[0][6], 16) / 255,
                        0.999
                    );
                    this.addColorInformation(colors, decorations, i, match, color);
                } else {
                    // RGB color
                    const r = parseInt(match[1], 10);
                    const g = parseInt(match[2], 10);
                    const b = parseInt(match[3], 10);

                    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
                        this.addColorInformation(colors, decorations, i, match, color);
                    }
                }
            }
        }
        this.updateDecorations(decorations);
        if (decorations.size === 0) {
            this.oldDecorationsMap.delete(document.uri.toString());
        } else {
            this.oldDecorationsMap.set(document.uri.toString(), decorations);
        }

        return colors;
    }

    private updateDecorations(decorations: Map<string, DecorationMap>) {
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
            activeEditor.setDecorations(value.decorationType, value.ranges);
            this.oldDecorations.set(value.decorationType.key, value);
        });
        this.textEditorNeedsUpdate = false;
    }

    provideColorPresentations(
        color: vscode.Color
    ): vscode.ProviderResult<vscode.ColorPresentation[]> {
        // Convert the color to a hex string
        const toHex = (value: number) => {
            const hex = Math.round(value * 255).toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };

        if (color.alpha === 1) {
            // Convert the color to RGB format
            const r = Math.round(color.red * 255);
            const g = Math.round(color.green * 255);
            const b = Math.round(color.blue * 255);
            const rgbColor = `${r},${g},${b}`;

            return [new vscode.ColorPresentation(rgbColor)];
        }
        // Default to hex format
        const hexColor = `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
        return [new vscode.ColorPresentation(hexColor)];
    }
}

export const scribeColorProvider = new ScribeColorProvider();

export async function insertColor(position?: vscode.Position, color: string = '#000000') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (!position) {
        position = editor.selection.active;
    }

    // Insert the color at the current position
    await editor.edit((editBuilder) => {
        editBuilder.insert(position, color);
    });

    // Move the cursor to the end of the inserted color
    const newPosition = position.translate(0, color.length);
    editor.selection = new vscode.Selection(newPosition, newPosition);

    // Trigger the native color picker
    await vscode.commands.executeCommand('editor.action.showOrFocusStandaloneColorPicker');
}
