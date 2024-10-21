import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export enum ObjectType {
	MECHANIC = 'Mechanic',
	ATTRIBUTE = 'Attribute',
	TARGETER = 'Targeter',
	CONDITION = 'Condition',
	INLINECONDITION = 'Inline Condition',
}

export const mechanicsDatasetPath = path.join(__dirname, '../data/MythicMobs_Mechanics_dataset.json');
export const mechanicsDataset = JSON.parse(fs.readFileSync(mechanicsDatasetPath, 'utf8'));

export const targetersDatasetPath = path.join(__dirname, '../data/MythicMobs_Targeters_dataset.json');
export const targetersDataset = JSON.parse(fs.readFileSync(targetersDatasetPath, 'utf8'));

export const conditionsDatasetPath = path.join(__dirname, '../data/MythicMobs_Conditions_dataset.json');
export const conditionsDataset = JSON.parse(fs.readFileSync(conditionsDatasetPath, 'utf8'));


export const ObjectInfo = {
	[ObjectType.MECHANIC]: {
		dataset: mechanicsDataset,
		regex: /(?<=\s- )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.ATTRIBUTE]: {
		dataset: mechanicsDataset,
		regex: /(?<=[{;])\w+(?==)/gm,
	},
	[ObjectType.TARGETER]: {
		dataset: targetersDataset,
		regex: /(?<=\s@)[\w:]+/gm,
	},
	[ObjectType.CONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm,
	},
	[ObjectType.INLINECONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm,
	},
}

export const ConditionActions = {
	"true": {
		"type": "check",
	},
	"false": {
		"type": "check",
	},
	"cast": {
		"type": "metaskill",
	},
	"castinstead": {
		"type": "metaskill",
	},
	"orElseCast": {
		"type": "metaskill",
	},
	"power": {
		"type": "float",
	}
}

export const SkillFileObjects = {
	"Skills": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#skills",
		"description": "The list of the mechanics that will be executed by the metaskill.",
	},
	"Conditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions",
		"description": "The list of conditions that will evaluate the caster of the metaskill before execution.",
	},
	"TargetConditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#targetconditions",
		"description": "The list of conditions that will evaluate the target of the metaskill before execution",
	},
	"TriggerConditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#triggerconditions",
		"description": "The list of conditions that will evaluate the trigger of the metaskill before execution",
	},
	"Cooldown": {
		"type": "float",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cooldown",
		"description": "The cooldown of the metaskill (in seconds).",
	},
	"CancelIfNoTargets": {
		"type": "bool",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cancelifnotargets",
		"description": "Whether the metaskill should be cancelled if there are no targets.",
	},
	"FailedConditionsSkill": {
		"type": "string",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#failedconditionsskill",
		"description": "The name of the metaskill to cast if the conditions fail.",
	},
	"OnCooldownSkill": {
		"type": "string",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#oncooldownskill",
		"description": "The name of the metaskill to cast if the metaskill is on cooldown.",
	},
}