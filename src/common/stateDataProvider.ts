import * as vscode from 'vscode';

import {
    DefaultingPromiseCallbackProvider,
    PromiseCallbackProvider,
} from './providers/callbackProvider';
import { Schema } from './objectInfos';

export const filesToUpdateProvider = new DefaultingPromiseCallbackProvider<
    string,
    'shouldUpdate' | 'isFineAsIs'
>();

export const edcsUriProvider = new PromiseCallbackProvider<'edcsUri', vscode.Uri>();

export const enumDataProvider = new PromiseCallbackProvider<
    string,
    Map<string, Map<string, string>>
>();

export const schemaProvider = new PromiseCallbackProvider<string, Map<string, () => Schema>>();
