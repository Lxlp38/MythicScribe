import { FileObjectMap, FileObjectTypes, EnumType, generateIntInRange } from '../objectInfos';


export const ItemFileObjects: FileObjectMap = {
	"Id": {
		type: FileObjectTypes.ENUM,
		dataset: EnumType.MATERIAL,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#id",
		description: "The base material to use for your item",
	},
	"Template": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#template",
		description: "Items can use Templating like mobs, while referencing other items. Only one template can be used at a time",
	},
	"Display": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#display",
		description: "Sets the display name of the item",
	},
	"Lore": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#lore",
		description: "Sets the lore of the item. Allows for placeholders and color gradients",
	},
	"CustomModelData": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#custommodeldata",
		description: "Sets the CustomModelData tag on the item",
	},
	"Durability": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#durability",
		description: "Sets the amount of durability to take off the item",
	},
	"Attributes": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#attributes",
		description: "Allows the addition of item attributes, such as health, to certain armor slots",
		keys: {
			"All": {
				type: FileObjectTypes.KEY_LIST,
			},
			"MainHand": {
				type: FileObjectTypes.KEY_LIST,
			},
			"OffHand": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Head": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Chest": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Legs": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Feet": {
				type: FileObjectTypes.KEY_LIST,
			}
		}
	},
	"Amount": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#amount",
		description: "Sets the default amount of items to give when this item is being called by the plugin",
		values: generateIntInRange(1, 12, 1),
	},
	"Options": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#options",
		description: "A special field that includes various item options, such as color or append type",
	},
	"Enchantments": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#enchantments",
		description: "Adds enchantments to items. A list of available enchantments is provided in the documentation",
	},
	"Hide": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#hide",
		description: "Allows specific details, like enchantments, to be hidden from the item tooltip",
	},
	"PotionEffects": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#potioneffects",
		description: "Sets the potion effects of the item, applicable to potions, splash potions, and tipped arrows",
	},
	"BannerLayers": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#bannerlayers",
		description: "Sets the banner layers for a banner or shield",
	},
	"CanPlaceOn": {
		type: FileObjectTypes.LIST,
		dataset: EnumType.MATERIAL,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canplaceon",
		description: "Specifies blocks on which this item can be placed in adventure mode",
	},
	"CanBreak": {
		type: FileObjectTypes.LIST,
		dataset: EnumType.MATERIAL,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canbreak",
		description: "Specifies blocks that this item can break in adventure mode",
	},
	"Group": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#group",
		description: "Defines the group for browsing items with '/mm items browse'",
	},
	"NBT": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#nbt",
		description: "Adds custom NBT tags to items for data storage or compatibility with other plugins",
	},
	"ArmorTrimNBT": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#armor-trim-nbt",
		description: "Sets custom armor trim for items, like iron chestplates, with specified materials and patterns",
	},
	"Firework": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#firework",
		description: "Configures firework or firework_charge items with colors, flicker, trail, etc.",
	},
	"Book": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book",
		description: "Configures written books with title, author, and multiple pages",
	},
	"Food": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#food",
		description: "Configures food items with attributes like nutrition, saturation, and effects",
		keys: {
			"Nutrition": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(1, 20, 1),
			},
			"Saturation": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(1, 20, 1),
			},
			"EatSeconds": {
				type: FileObjectTypes.FLOAT,
				values: generateIntInRange(1, 10, 1),
			},
			"CanAlwaysEat": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Effects": {
				type: FileObjectTypes.LIST,
			}
		}
	},
	"Skills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Usage",
		description: "Sets the skills of the item",
	},
	"FurnitureSkills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#furniture-skills",
		description: "Sets the furniture skills of the item",
	},
	"CustomDurability": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/CustomDurability",
		description: "Sets the custom durability of the item",
		keys: {
			"Durability": {
				type: FileObjectTypes.INTEGER,
			},
		}
	},
	"Recipes": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Recipes",
		description: "Sets the recipes of the item",
	},
	"AugmentationSlots": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Augments",
		description: "Sets the augmentation slots of the item",
	},
	"EquipmentSet": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Sets",
		description: "Sets the set of the item",
	},
	"CustomBlock": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks",
		description: "Sets the custom block of the item",
		keys: {
			"Type": {
				type: FileObjectTypes.STRING,
			},
			"Id": {
				type: FileObjectTypes.INTEGER,
			},
			"Texture": {
				type: FileObjectTypes.STRING,
			},
			"Hardness": {
				type: FileObjectTypes.INTEGER,
			},
			"Tools": {
				type: FileObjectTypes.LIST,
			},
			"Parent": {
				type: FileObjectTypes.STRING,
			},
			"Textures": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Variant": {
				type: FileObjectTypes.LIST,
			}
		}
	},
	"Type": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis",
		description: "Sets the type of the item",
	},
	"Furniture": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture",
		description: "Sets the furniture of the item",
		keys: {
			"Material": {
				type: FileObjectTypes.ENUM,
				dataset: EnumType.MATERIAL,
			},
			"Model": {
				type: FileObjectTypes.INTEGER,
			},
			"Type": {
				type: FileObjectTypes.STRING,
			},
			"Health": {
				type: FileObjectTypes.INTEGER,
			},
			"Hitbox": {
				type: FileObjectTypes.KEY,
				keys: {
					"Height": {
						type: FileObjectTypes.INTEGER,
					},
					"Width": {
						type: FileObjectTypes.INTEGER,
					},
				}
			},
			"CanRotate": {
				type: FileObjectTypes.BOOLEAN,
			},
			"GlowingItem": {
				type: FileObjectTypes.BOOLEAN,
			},
			"DropSelf": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Color": {
				type: FileObjectTypes.STRING,
			},
			"Colorable": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Placement": {
				type: FileObjectTypes.STRING,
			},
			"Diagonalable": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Barriers": {
				type: FileObjectTypes.LIST,
			},
			"Lights": {
				type: FileObjectTypes.LIST,
			},
			"Seats": {
				type: FileObjectTypes.LIST,
			},
			"Drops": {
				type: FileObjectTypes.LIST,
			},
			"DefaultState": {
				type: FileObjectTypes.STRING,
			},
			"States": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Height": {
				type: FileObjectTypes.INTEGER,
			},
			"Width": {
				type: FileObjectTypes.INTEGER,
			},
			"Billboard": {
				type: FileObjectTypes.STRING,
			},
			"Brightness": {
				type: FileObjectTypes.INTEGER,
			},
			"InterpolationDelay": {
				type: FileObjectTypes.INTEGER,
			},
			"InterpolationDuration": {
				type: FileObjectTypes.INTEGER,
			},
			"Transform": {
				type: FileObjectTypes.STRING,
			},
			"Scale": {
				type: FileObjectTypes.VECTOR,
			},
			"GlowingFrame": {
				type: FileObjectTypes.BOOLEAN,
			}
		}
	},
	"Inventory": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Bags",
		description: "Thets the bag options",
		keys: {
			"Title": {
				type: FileObjectTypes.STRING,
			},
			"Size": {
				type: FileObjectTypes.INTEGER,
				values: generateIntInRange(9, 54, 9),
			}
		}
	},
};
