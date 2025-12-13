import * as vscode from 'vscode';

import { PromiseCallbackProvider } from './providers/callbackProvider';

export const stateControlBooleanProvider = new PromiseCallbackProvider<
    'doUpdateGithubDataset',
    boolean
>();

export const edcsUriProvider = new PromiseCallbackProvider<'edcsUri', vscode.Uri>();
