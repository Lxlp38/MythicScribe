import * as vscode from 'vscode';
import * as yamlutils from './yamlutils';
import { previousSymbol } from './yamlutils';
import { FileObject, FileObjectMap, FileObjectTypes, Mechanic, MechanicDataset } from '../../objectInfos';


export function checkShouldComplete(document: vscode.TextDocument, position: vscode.Position, context: vscode.CompletionContext, symbol: string[]): boolean {

    // called via invocation
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(document, position);
        if (symbol.includes(mypreviousSpecialSymbol)) {
            return true;
        }
        return false;
    }

    // called via trigger character
    const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
    if (symbol.includes(charBefore0)) {
        return true;
    }
    return false

}

export function addMechanicCompletions(target: MechanicDataset, completionItems: vscode.CompletionItem[]) {

    target.forEach((item: Mechanic) => {
        item.name.forEach((name: string) => {
            const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
            completionItem.detail = `${item.description}`;
            completionItem.kind = vscode.CompletionItemKind.Function;
            completionItem.insertText = new vscode.SnippetString(name + "{$0}");
            completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
            completionItems.push(completionItem);
        });

    });


}



export function fileCompletions(document: vscode.TextDocument, position: vscode.Position, objectmap: FileObjectMap): vscode.CompletionItem[] | undefined {
    const keys = yamlutils.getParentKeys(document, position.line).reverse();

    if (keys.length == 0) {
        return undefined;
    }

    const result = fileCompletionFindNodesOnLevel(objectmap, keys.slice(1), 1);
    if (!result) {
        return undefined;
    }
    const defaultindentation = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.options.tabSize as number : 2;
    const [keyobjects, level] = result;
    const thislineindentation = yamlutils.getIndentation(document.lineAt(position.line).text);
    const indentation = " ".repeat((level-thislineindentation/2) * defaultindentation);


    if (!keyobjects) {
        return undefined;
    }

    if (keyobjects.type) {
        return fileCompletionForFileObject(keyobjects as FileObject, indentation);
    }
    else {
        return fileCompletionForFileObjectMap(keyobjects as FileObjectMap, indentation);
    }

}

function fileCompletionFindNodesOnLevel(objectmap: FileObjectMap, keys: string[], level: number): [FileObjectMap | FileObject, number] | null {
    if (keys.length == 0) {
        return [objectmap, level];
    }

    const key = keys[0];

    const selectedObject = objectmap[key as keyof typeof objectmap];

    if (selectedObject) {
        if (selectedObject.keys) {
            const result = fileCompletionFindNodesOnLevel(selectedObject.keys, keys.slice(1), level+1)
            return result;
        }
        if (selectedObject.type === FileObjectTypes.KEY_LIST) {
            return [selectedObject, level+1];
        }
        if (selectedObject.type  === FileObjectTypes.LIST) {
            return [selectedObject, level];
        }
        return [objectmap, level];
    }

    return null;
}

function fileCompletionForFileObjectMap(objectMap: FileObjectMap, indentation: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    Object.entries(objectMap).forEach(([key, value]) => {
        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        completionItem.kind = vscode.CompletionItemKind.File;
        if (value.type == FileObjectTypes.LIST) {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ":\n" + indentation + "- $0");
        }
        else if (value.type == FileObjectTypes.BOOLEAN) {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ": ${1|true,false|}");
        }
        else if (value.type == FileObjectTypes.KEY) {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ":\n" + indentation + "  $1");
        }
        else if (value.type == FileObjectTypes.KEY_LIST) {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ":\n" + indentation + "  $1: $2");
        }
        else {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ": $0");
        }
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    });

    return completionItems;

}

function fileCompletionForFileObject(object: FileObject, indentation: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (object.type === FileObjectTypes.LIST) {
        const completionItem = new vscode.CompletionItem("-", vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation + "- $0");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    }
    else if (object.type === FileObjectTypes.KEY_LIST) {
        const completionItem = new vscode.CompletionItem("New Key", vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation + "$1: $2");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    }


    return completionItems;
}