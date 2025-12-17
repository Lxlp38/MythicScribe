import * as vscode from 'vscode';

export const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/'; // GitHub URL to fetch data from

export const GITHUB_API_COMMITS_BASE_URL =
    'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=';
export const GITHUB_API_COMMITS_URL =
    'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';
export const retriggerCompletionsCommand: vscode.Command = {
    command: 'editor.action.triggerSuggest',
    title: 'Re-trigger completions...',
};

export const atlasJsonRemoteUrl =
    'https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/data/atlas.json';
