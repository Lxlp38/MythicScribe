import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { keyAliases, ObjectInfo, ObjectType } from '../../objectInfos';
import { addMechanicCompletions, checkShouldComplete } from '../utils/completionhelper';


export function targeterCompletionProvider(){
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {
        
                const keys = yamlutils.getParentKeys(document, position);
                if (!keyAliases["Skills"].includes(keys[0])) {
                    return undefined;
                }

                if (!checkShouldComplete(document, position, context, ["@"])) {
                    return undefined;
                }
                    
                const completionItems: vscode.CompletionItem[] = [];
    

                addMechanicCompletions(ObjectInfo[ObjectType.TARGETER].dataset, completionItems);
                    
                return completionItems;
            }
        }, "@"
    )
}
