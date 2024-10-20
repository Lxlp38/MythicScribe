// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { hoverProvider } from './imports/hovers/hoverprovider';

import { inlineConditionCompletionProvider } from './imports/completions/inlineconditionCompletionProvider';
import { mechanicCompletionProvider } from './imports/completions/mechanicsCompletionProvider';
import { conditionCompletionProvider } from './imports/completions/conditionsCompletionProvider';
import { targeterCompletionProvider } from './imports/completions/targeterCompletionProvider';
import { attributeCompletionProvider } from './imports/completions/attributeCompletionProvider';
import { SkillFileCompletionProvider } from './imports/completions/skillfileCompletionProvider';
import { inlineMetaskillCompletionProvider } from './imports/completions/inlinemetaskillCompletionProvider';

import { mechaniclineCompletionProvider } from './imports/completions/mechaniclineCompletionProvider';

import { removeBracketsTextListener } from './imports/textchanges/bracketsremover';
import { shortcutsProvider } from './imports/textchanges/shortcuts';
import { enableEmptyBracketsAutomaticRemoval, enableShortcuts } from './imports/utils/configutils';


export function activate(context: vscode.ExtensionContext) {

	console.log('MythicScribe is active');


	// Hovers	
	context.subscriptions.push(hoverProvider);

	// Completions
	context.subscriptions.push(mechanicCompletionProvider);
	context.subscriptions.push(attributeCompletionProvider);
	context.subscriptions.push(targeterCompletionProvider);
	context.subscriptions.push(inlineConditionCompletionProvider);
	context.subscriptions.push(conditionCompletionProvider);

	context.subscriptions.push(SkillFileCompletionProvider);
	
	context.subscriptions.push(inlineMetaskillCompletionProvider);
	context.subscriptions.push(mechaniclineCompletionProvider);

	// Text Changes
	if(enableEmptyBracketsAutomaticRemoval()) {
		context.subscriptions.push(removeBracketsTextListener);
	}

	if (enableShortcuts()) {
		context.subscriptions.push(shortcutsProvider);
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }