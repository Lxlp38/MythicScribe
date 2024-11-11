import { FileObjectMap, FileObjectTypes, EnumType, generateIntInRange } from '../objectInfos';


export const MobFileObjects: FileObjectMap = {
	"Type": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#type",
		description: "The Entity Type of the mob.",
	},
	"Template": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Templates",
		description: "The templates for the mob.",
	},
	"Display": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#display",
		description: "The display name of the mob.",
	},
	"Health": {
		type: FileObjectTypes.FLOAT,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#health",
		description: "The health of the mob.",
	},
	"Damage": {
		type: FileObjectTypes.FLOAT,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#damage",
		description: "The damage of the mob.",
	},
	"Armor": {
		type: FileObjectTypes.FLOAT,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#armor",
		description: "The armor points of the mob.",
	},
	"HealthBar": {
		type: FileObjectTypes.KEY,
		"keys": {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Offset": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(0.1, 2.0, 0.1, true),
			}
		},
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#healthbar",
		description: "The health bar of the mob.",
	},
	"BossBar": {
		type: FileObjectTypes.KEY,
		"keys": {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Title": {
				type: FileObjectTypes.STRING,
			},
			"Range": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(10, 100, 10, true),
			},
			"Color": {
				type: FileObjectTypes.ENUM,
				dataset: EnumType.BARCOLOR,
			},
			"Style": {
				type: FileObjectTypes.ENUM,
				dataset: EnumType.BARSTYLE,
			},
			"CreateFog": {
				type: FileObjectTypes.BOOLEAN,
			},
			"DarkenSky": {
				type: FileObjectTypes.BOOLEAN,
			},
			"PlayMusic": {
				type: FileObjectTypes.BOOLEAN,
			}
		},
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#bossbar",
		description: "The boss bar of the mob.",
	},
	"Faction": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#faction",
		description: "The faction of the mob.",
	},
	"Mount": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#mount",
		description: "The mount of the mob.",
	},
	"Options": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Options",
		description: "The options of the mob.",
	},
	"Modules": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#modules",
		description: "The modules of the mob.",
		keys: {
			"ThreatTable": {
				type: FileObjectTypes.BOOLEAN,
			},
			"ImmunityTable": {
				type: FileObjectTypes.BOOLEAN,
			},
		},
	},
	"AIGoalSelectors": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/AIGoalSelectors",
		description: "The AI goal selectors of the mob.",
	},
	"AITargetSelectors": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/AITargetSelectors",
		description: "The AI target selectors of the mob.",
	},
	"Drops": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Drops",
		description: "The drops of the mob.",
	},
	"DamageModifiers": {
		type: FileObjectTypes.LIST,
		dataset: EnumType.DAMAGECAUSE,
		values: generateIntInRange(-1.0, 2.0, 0.1, true),
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DamageModifiers",
		description: "The damage modifiers of the mob.",
	},
	"Equipment": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Equipment",
		description: "The equipment of the mob.",
	},
	"KillMessages": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/KillMessages",
		description: "The kill messages of the mob.",
	},
	"LevelModifiers": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/LevelModifiers",
		description: "The level modifiers of the mob.",
		keys: {
			"Health": {
				type: FileObjectTypes.FLOAT,
			},
			"Damage": {
				type: FileObjectTypes.FLOAT,
			},
			"Armor": {
				type: FileObjectTypes.FLOAT,
			},
			"KnockbackResistance": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(0.0, 1.0, 0.1, true),
			},
			"Power": {
				type: FileObjectTypes.FLOAT,
			},
			"MovementSpeed": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(0.0, 0.4, 0.05, true),
			}
		}
	},
	"Disguise": {
		type: FileObjectTypes.ENUM,
		dataset: EnumType.ENTITYTYPE,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Disguise",
		description: "The disguise of the mob.",
	},
	"Skills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Skills",
		description: "The skills of the mob.",
	},
	"Nameplate": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Nameplate",
		description: "The nameplate of the mob.",
		keys: {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Offset": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(0.1, 2.0, 0.1, true),
			},
			"Scale": {
				type: FileObjectTypes.VECTOR,
				values: ["1,1,1"],
			},
			"Mounted": {
				type: FileObjectTypes.BOOLEAN,
			},
		}
	},
	"Hearing": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Hearing",
		description: "The hearing of the mob.",
		keys: {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
		}
	},
	"Variables": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Variables",
		description: "The variables of the mob.",
	},
	"Trades": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Trades",
		description: "The trades of the mob.",
	},
};
