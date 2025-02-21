import * as vscode from 'vscode';

class ScribeColorProvider implements vscode.DocumentColorProvider {
    getRange(i: number, match: RegExpExecArray): vscode.Range {
        const startPos = new vscode.Position(i, match.index);
        const endPos = new vscode.Position(i, match.index + match[0].length);
        return new vscode.Range(startPos, endPos);
    }
    provideDocumentColors(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const colorHexRegex = /(?<=\S)#[A-Fa-f0-9]{6}/g;
        const colorRgbRegex = /(\d{1,3}),(\d{1,3}),(\d{1,3})/g;
        const colors: vscode.ColorInformation[] = [];

        // Alpha
        // 0.999 --> HEX
        // 1 --> RGB

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            let match;
            while ((match = colorHexRegex.exec(line.text)) !== null) {
                // Convert hex color to VS Code's Color object
                const color = new vscode.Color(
                    parseInt(match[0][1] + match[0][2], 16) / 255,
                    parseInt(match[0][3] + match[0][4], 16) / 255,
                    parseInt(match[0][5] + match[0][6], 16) / 255,
                    0.999
                );

                colors.push(new vscode.ColorInformation(this.getRange(i, match), color));
            }

            while ((match = colorRgbRegex.exec(line.text)) !== null) {
                const r = parseInt(match[1], 10);
                const g = parseInt(match[2], 10);
                const b = parseInt(match[3], 10);

                if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                    const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
                    colors.push(new vscode.ColorInformation(this.getRange(i, match), color));
                }
            }
        }

        return colors;
    }

    provideColorPresentations(
        color: vscode.Color,
        _context: { document: vscode.TextDocument; range: vscode.Range },
        _token: vscode.CancellationToken
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
