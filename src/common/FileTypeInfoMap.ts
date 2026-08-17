import { Schema, registryKey } from '@common/objectInfos';
import {
    fileRegexConfigCache,
    checkMythicMobsFile,
    checkFileEnabled,
} from '@common/providers/configProvider';
import { AchievementSchema } from '@common/schemas/achievementSchema';
import { EnchantmentSchema } from '@common/schemas/enchantmentSchema';
import { ArchetypeSchema } from '@common/schemas/archetypeSchema';
import { TalentTreeFileSchema } from '@common/schemas/talentTreeSchema';
import { DroptableSchema } from '@common/schemas/droptableSchema';
import { EquipmentSetSchema } from '@common/schemas/equipmentsetSchema';
import { ItemSchema } from '@common/schemas/itemSchema';
import { MenuSchema } from '@common/schemas/menuSchema';
import { MetaskillSchema } from '@common/schemas/metaskillSchema';
import { MobSchema } from '@common/schemas/mobSchema';
import { PlaceholderSchema } from '@common/schemas/placeholderSchema';
import { RandomSpawnSchema } from '@common/schemas/randomSpawnSchema';
import { ReagentSchema } from '@common/schemas/reagentSchema';
import { ExperienceCurveSchema } from '@common/schemas/experienceCurveSchema';
import { ExperienceSourceSchema } from '@common/schemas/experienceSourceSchema';
import { PointSchema } from '@common/schemas/pointSchema';
import { StatSchema } from '@common/schemas/statSchema';
import * as vscode from 'vscode';

interface FileTypeInfo {
    schema?: Schema;
    key: registryKey;
    configKey: keyof typeof fileRegexConfigCache;
}
export const FileTypeInfoMap: {
    [K in registryKey]: FileTypeInfo;
} = {
    metaskill: {
        schema: MetaskillSchema,
        key: 'metaskill',
        configKey: 'Metaskill',
    },
    mob: {
        schema: MobSchema,
        key: 'mob',
        configKey: 'Mob',
    },
    item: {
        schema: ItemSchema,
        key: 'item',
        configKey: 'Item',
    },
    droptable: {
        schema: DroptableSchema,
        key: 'droptable',
        configKey: 'Droptable',
    },
    stat: {
        schema: StatSchema,
        key: 'stat',
        configKey: 'Stat',
    },
    pin: {
        schema: undefined,
        key: 'pin',
        configKey: 'Pin',
    },
    placeholder: {
        schema: PlaceholderSchema,
        key: 'placeholder',
        configKey: 'Placeholder',
    },
    randomspawn: {
        schema: RandomSpawnSchema,
        key: 'randomspawn',
        configKey: 'RandomSpawn',
    },
    equipmentset: {
        schema: EquipmentSetSchema,
        key: 'equipmentset',
        configKey: 'EquipmentSet',
    },
    archetype: {
        schema: ArchetypeSchema,
        key: 'archetype',
        configKey: 'Archetype',
    },
    talenttree: {
        schema: TalentTreeFileSchema,
        key: 'talenttree',
        configKey: 'TalentTree',
    },
    reagent: {
        schema: ReagentSchema,
        key: 'reagent',
        configKey: 'Reagent',
    },
    experiencecurve: {
        schema: ExperienceCurveSchema,
        key: 'experiencecurve',
        configKey: 'ExperienceCurve',
    },
    experiencesource: {
        schema: ExperienceSourceSchema,
        key: 'experiencesource',
        configKey: 'ExperienceSource',
    },
    point: {
        schema: PointSchema,
        key: 'point',
        configKey: 'Point',
    },
    menu: {
        schema: MenuSchema,
        key: 'menu',
        configKey: 'Menu',
    },
    achievement: {
        schema: AchievementSchema,
        key: 'achievement',
        configKey: 'Achievement',
    },
    enchantment: {
        schema: EnchantmentSchema,
        key: 'enchantment',
        configKey: 'Enchantment',
    },
};

export function checkFileType(uri: vscode.Uri): FileTypeInfo | undefined {
    if (!checkMythicMobsFile(uri)) {
        return undefined;
    }
    for (const info of Object.values(FileTypeInfoMap)) {
        if (info.configKey && checkFileEnabled(uri, info.configKey)) {
            return info;
        }
    }
    return undefined;
}
