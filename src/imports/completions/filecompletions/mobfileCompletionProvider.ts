import * as vscode from 'vscode';
import { MobFileObjects } from '../../../schemas/mobFileObjects';
import { generateFileCompletion, listCompletion } from '../../utils/completionhelper';
import { getParentKeys } from '../../utils/yamlutils';
import { EnumDatasetValue, EnumInfo, EnumType } from '../../../objectInfos';

export function mobFileCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        'mythicscript',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                return generateFileCompletion(document, position, context, MobFileObjects);
            }
        }, "\n"
    );
}