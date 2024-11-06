import * as vscode from 'vscode';
import { ItemFileObjects } from '../../../objectInfos';
import { enableFileSpecificSuggestions } from '../../utils/configutils';
import { fileCompletions } from '../../utils/completionhelper';

export function itemFileCompletionProvider(){
    const ItemFileCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    
                if (enableFileSpecificSuggestions() === false) {
                    return undefined;
                }
    
                if (!/^\s*$/.test(document.lineAt(position.line).text)) {
                    return undefined;
                }

                return fileCompletions(document, position, ItemFileObjects);
            }
        }, "\n"
    );
    
    return ItemFileCompletionProvider;

}

