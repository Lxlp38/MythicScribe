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
	"Skills" : "list",
	"Conditions": "list",
	"TargetConditions": "list",
	"TriggerConditions": "list",
	"Cooldown": "float",
	"CancelIfNoTargets": "bool",
	"FailedConditionsSkill": "string",
	"OnCooldownSkill": "string",
}