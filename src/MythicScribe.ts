import * as vscode from 'vscode';

import * as config from './imports/utils/configutils';

import { hoverProvider } from './imports/hovers/hoverprovider';

import { inlineConditionCompletionProvider } from './imports/completions/inlineconditionCompletionProvider';
import { mechanicCompletionProvider } from './imports/completions/mechanicsCompletionProvider';
import { conditionCompletionProvider } from './imports/completions/conditionsCompletionProvider';
import { targeterCompletionProvider } from './imports/completions/targeterCompletionProvider';
import { attributeCompletionProvider, attributeValueCompletionProvider } from './imports/completions/attributeCompletionProvider';
import { inlineMetaskillCompletionProvider } from './imports/completions/inlinemetaskillCompletionProvider';

import { mechaniclineCompletionProvider } from './imports/completions/mechaniclineCompletionProvider';

import { metaskillFileCompletionProvider } from './imports/completions/metaskillfileCompletionProvider';

import { removeBracketsTextListener } from './imports/textchanges/bracketsremover';
import { shortcutsProvider } from './imports/textchanges/shortcuts';
import { loadGithubDatasets, updateDatasets } from './objectInfos';
import { triggerfileCompletionProvider } from './imports/completions/triggerfileCompletionProvider';

export let ctx: vscode.ExtensionContext;

// Arrays to store all subscriptions
const gloabsubscriptions: vscode.Disposable[] = [];
const skillfilesubscriptions: vscode.Disposable[] = [];
const triggerfilesubscriptions: vscode.Disposable[] = [];


export function activate(context: vscode.ExtensionContext) {

	console.log('MythicScribe is active');

	ctx = context;

	loadGithubDatasets(context)

	// Config
	context.subscriptions.push(config.extensionEnabler);
	if (vscode.window.activeTextEditor) {
		config.updateEnabled(vscode.window.activeTextEditor.document);
	}

}

export function deactivate() { }


// Enable all basic subscriptions
export function enableSubscriptions() {
	console.log('Enabling subscriptions');

	const context = ctx;

	const toEnable = [
		attributeCompletionProvider(),
		attributeValueCompletionProvider(),
		conditionCompletionProvider(),
		inlineConditionCompletionProvider(),
		inlineMetaskillCompletionProvider(),
		mechaniclineCompletionProvider(),
		mechanicCompletionProvider(),
		targeterCompletionProvider(),
		hoverProvider(),
	]

	// Completions	

	// Text Changes
	if (config.enableEmptyBracketsAutomaticRemoval()) {
		console.log('Enabling empty brackets automatic removal');
		toEnable.push(removeBracketsTextListener());
	}

	if (config.enableShortcuts()) {
		toEnable.push(shortcutsProvider());
	}

	toEnable.forEach(subscription => {
		context.subscriptions.push(subscription);
		gloabsubscriptions.push(subscription);
	});
}

// Disable all basic subscriptions
export function disableSubscriptions() {
	console.log('Disabling subscriptions');

	gloabsubscriptions.forEach(subscription => {
		subscription.dispose();
	});
	gloabsubscriptions.length = 0;

	// File Specific
	disableSkillfileSubscriptions();
	disableTriggerFileSubscriptions();
}


// Enable all skillfile subscriptions
let reminder_disableAcceptSuggestionOnEnter = true;
export function enableSkillfileSubscriptions() {
	const context = ctx;
	const toEnable = [];

	if (config.enableFileSpecificSuggestions()) {
		const acceptOnEnter = vscode.workspace.getConfiguration('editor').get('acceptSuggestionOnEnter');
		if (
			reminder_disableAcceptSuggestionOnEnter &&
			vscode.workspace.getConfiguration('MythicScribe').get("disableAcceptSuggestionOnEnter") &&
			acceptOnEnter !== "off") {
			reminder_disableAcceptSuggestionOnEnter = false;
			vscode.window.showInformationMessage('`Accept Completions on Enter` is enabled. Would you like to disable it?', 'Yes', 'No', "Don't ask again")
				.then(selection => {
					if (selection === 'Yes') {
						vscode.workspace.getConfiguration('editor').update('acceptSuggestionOnEnter', 'off', vscode.ConfigurationTarget.Workspace);
						toEnable.push(metaskillFileCompletionProvider());
					}
					else if (selection === "Don't ask again") {
						vscode.workspace.getConfiguration('MythicScribe').update('disableAcceptSuggestionOnEnter', false, vscode.ConfigurationTarget.Workspace);
					}
				});
		} else {
			toEnable.push(metaskillFileCompletionProvider());
		}
	}

	toEnable.forEach(subscription => {
		context.subscriptions.push(subscription);
		skillfilesubscriptions.push(subscription);
	});
}

// Disable all skillfile subscriptions
export function disableSkillfileSubscriptions() {
	skillfilesubscriptions.forEach(subscription => {
		subscription.dispose();
	});
	skillfilesubscriptions.length = 0;
}


// Enable all triggerfile subscriptions
export function enableTriggerFileSubscriptions() {
	const context = ctx;
	const toEnable = [
		triggerfileCompletionProvider()
	];

	toEnable.forEach(subscription => {
		context.subscriptions.push(subscription);
		triggerfilesubscriptions.push(subscription);
	});
}
// Disable all triggerfile subscriptions
export function disableTriggerFileSubscriptions() {
	triggerfilesubscriptions.forEach(subscription => {
		subscription.dispose();
	});
	triggerfilesubscriptions.length = 0;
}