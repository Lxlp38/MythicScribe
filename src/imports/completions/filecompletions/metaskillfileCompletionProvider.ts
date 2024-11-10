import * as vscode from 'vscode';
import { MetaskillFileObjects } from '../../../schemas/metaskillFileObjects';
import { generateFileCompletion } from '../../utils/completionhelper';

export function metaskillFileCompletionProvider(){
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                return generateFileCompletion(document, position, context, MetaskillFileObjects);
            }
        }, "\n"
    );
}

