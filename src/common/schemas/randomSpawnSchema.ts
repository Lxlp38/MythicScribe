import { DefaultPlugins, Schema, SchemaElementTypes } from '@common/objectInfos';
import { generateNumbersInRange, inheritSchemaOptions } from '@common/utils/schemautils';

export const RandomSpawnSchema: Schema = {
    Action: {
        type: SchemaElementTypes.ENUM,
        dataset: 'RANDOMSPAWNACTION',
        description: 'The type of randomspawn action to use for this randomspawn.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Types: {
        type: SchemaElementTypes.LIST,
        description:
            'Defines the type of mob(s) to be spawned. Can be an array/multiple mob types.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
        dataset: 'MOB',
        values: generateNumbersInRange(0, 100, 5, false, 1),
    },
    Level: {
        type: SchemaElementTypes.INTEGER,
        description:
            'The level the specified mob(s) should spawn with. Must be a fixed number, will not parse number ranges. May be overridden by world scaling settings (see below for options).',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Chance: {
        type: SchemaElementTypes.FLOAT,
        description: 'The chance for the mob(s) to spawn. Defaults to 1 [1].',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
        values: generateNumbersInRange(0, 1, 0.05, true),
    },
    Priority: {
        type: SchemaElementTypes.INTEGER,
        description:
            'The priority used to determine which randomspawn to prefer when multiple mobs are chosen to be spawned at the same spawn point. Rule of thumb: a higher priority number = higher chance to be selected when multiple mobs are chosen.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
        values: generateNumbersInRange(1, 10, 1, false),
    },
    UseWorldScaling: {
        type: SchemaElementTypes.BOOLEAN,
        description:
            "Whether the spawned mob's level should be affected by the world scaling settings. Defaults to true.",
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions',
        description:
            'The list of conditions that will be evaluated against the spawn location/replaced entity before the mob can be spawned.',
    },
    Worlds: {
        type: SchemaElementTypes.STRING,
        description:
            'The names of worlds in which the randomspawns should be applied. Can be an array/multiple worlds. These names correspond to how your Minecraft worlds are named in the game files.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Biomes: {
        type: SchemaElementTypes.STRING,
        description:
            'The biomes the specified mobtype(s) can spawn inside of. Can be an array/multiple biomes.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Reason: {
        type: SchemaElementTypes.ENUM,
        description:
            'The reason of minecraft-randomspawn to be matched. Can be an array/multiple reasons. If this option exists, the randomspawn will only work if it matches one of the specified reasons.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
        dataset: 'SPAWNREASON',
    },
    PositionType: {
        type: SchemaElementTypes.ENUM,
        description:
            'Whether this RandomSpawn should use land or sea points to spawn. Only works with Action: ADD.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
        dataset: 'RANDOMSPAWNPOSITIONTYPE',
    },
    Cooldown: {
        type: SchemaElementTypes.FLOAT,
        description:
            'The interval, in seconds, that must elapse between the spawning of two mobs by this same RandomSpawn. Added in MythicMobs 5.2.0.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
    Structures: {
        type: SchemaElementTypes.LIST,
        description:
            'A list of structures in which the mob can spawn. If set, the mob will be able to spawn only there.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    },
};

inheritSchemaOptions(
    RandomSpawnSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Random-Spawns',
    DefaultPlugins.MythicMobs
);
