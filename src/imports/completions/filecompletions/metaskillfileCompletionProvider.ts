import * as vscode from 'vscode';
import { MetaskillFileObjects } from '../../../objectInfos';
import { enableFileSpecificSuggestions } from '../../utils/configutils';
import { fileCompletions } from '../../utils/completionhelper';

export function metaskillFileCompletionProvider(){
    const SkillFileCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    
                if (enableFileSpecificSuggestions() === false) {
                    return undefined;
                }
    
                if (!/^\s*$/.test(document.lineAt(position.line).text)) {
                    return undefined;
                }
                
                return fileCompletions(document, position, MetaskillFileObjects);
            }
        }, "\n"
    );
    
    return SkillFileCompletionProvider;

}

