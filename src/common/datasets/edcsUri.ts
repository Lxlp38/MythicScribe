import { edcsUriProvider } from '@common/stateDataProvider';
import * as vscode from 'vscode';

export let edcsUri: vscode.Uri;
export function setEdcsUri(ctx: vscode.ExtensionContext) {
    edcsUriProvider.clear('edcsUri');
    edcsUri = vscode.Uri.joinPath(ctx.globalStorageUri, 'extensionDatasetsClonedStorage/');
    edcsUriProvider.run('edcsUri', edcsUri);
}
