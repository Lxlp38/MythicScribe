import * as vscode from 'vscode';
import { ItemFileObjects } from '../../../schemas/itemfileObjects';
import { generateFileCompletion } from '../../utils/completionhelper';

export function itemFileCompletionProvider(){
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                return generateFileCompletion(document, position, context, ItemFileObjects);

            }
        }, "\n"
    );
}

