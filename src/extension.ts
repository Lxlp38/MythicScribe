// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { hoverProvider } from './imports/hoverprovider';
import { mechanicsCompletionProvider, attributeCompletionProvider } from './imports/completionprovider';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "mythicscribe" is now active!');


	// Hover provider for mechanics and attributes
	
	context.subscriptions.push(hoverProvider);

	// Register the provider
	context.subscriptions.push(mechanicsCompletionProvider);
	context.subscriptions.push(attributeCompletionProvider);


}

// This method is called when your extension is deactivated
export function deactivate() { }