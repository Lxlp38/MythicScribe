import * as vscode from 'vscode';
import * as yamlutils from './yamlutils';
import { previousSymbol } from './yamlutils';
import { FileObject, FileObjectMap, FileObjectTypes, Mechanic, MechanicDataset, ObjectType } from '../../objectInfos';


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
    console.log(keys);

    if (keys.length == 0) {
        return undefined;
    }
    const indentation = "  ".repeat(keys.length);

    const keyobjects: FileObjectMap | FileObject | null = fileCompletionFindNodesOnLevel(objectmap, keys.slice(1));
    console.log(keyobjects);

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

function fileCompletionFindNodesOnLevel(objectmap: FileObjectMap, keys: string[]): FileObjectMap | FileObject | null {
    if (keys.length == 0) {
        return objectmap;
    }

    console.log(keys);

    const key = keys[0];

    const selectedObject = objectmap[key as keyof typeof objectmap];

    if (selectedObject) {
        if (selectedObject.keys) {
            return fileCompletionFindNodesOnLevel(selectedObject.keys, keys.slice(1));
        }
        return selectedObject;
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
        completionItem.insertText = new vscode.SnippetString(indentation.slice(4) + "- $0");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    }
    else if (object.type === FileObjectTypes.KEY_LIST) {
        const completionItem = new vscode.CompletionItem("New Key", vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation.slice(2) + "$1: $2");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    }


    return completionItems;
}