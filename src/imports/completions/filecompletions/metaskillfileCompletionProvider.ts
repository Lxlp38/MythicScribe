import * as vscode from 'vscode';
import * as yamlutils from '../../utils/yamlutils';
import { FileObjectTypes, MetaskillFileObjects } from '../../../objectInfos';
import { enableFileSpecificSuggestions, isEnabled, isMetaskillFile } from '../../utils/configutils';
import { fileCompletions } from '../../utils/completionhelper';

export function metaskillFileCompletionProvider(){
    const SkillFileCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
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

