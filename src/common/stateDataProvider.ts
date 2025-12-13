import * as vscode from 'vscode';

import { PromiseCallbackProvider } from './providers/callbackProvider';
import { Schema } from './objectInfos';

export const stateControlBooleanProvider = new PromiseCallbackProvider<
    'doUpdateGithubDataset',
    boolean
>();

export const edcsUriProvider = new PromiseCallbackProvider<'edcsUri', vscode.Uri>();

export const enumDataProvider = new PromiseCallbackProvider<
    string,
    Map<string, Map<string, string>>
>();

export const schemaProvider = new PromiseCallbackProvider<string, Map<string, () => Schema>>();
