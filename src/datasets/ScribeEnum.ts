import * as vscode from 'vscode';

import { minecraftVersion } from '../utils/configutils';
import { loadLocalEnumDataset, fetchEnumDatasetFromLink } from './datasets';
import { ctx } from '../MythicScribe';

abstract class AbstractScribeEnum {
    readonly identifier: string;
    readonly path: string;
    protected dataset: Map<string, EnumDatasetValue> = new Map<string, EnumDatasetValue>();
    protected commalist: string = '';

    constructor(identifier: string, path: string) {
        this.identifier = identifier;
        this.path = path;
    }

    updateCommaList(): void {
        this.commalist = Array.from(this.dataset.keys()).join(',');
    }
    getCommaList(): string {
        return this.commalist;
    }
    getDataset(): Map<string, EnumDatasetValue> {
        return this.dataset;
    }
}

export class StaticScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, path);
        loadLocalEnumDataset(path).then((data) => {
            this.dataset = new Map(Object.entries(data));
            this.updateCommaList();
            return;
        });
    }
}
class LocalScribeEnum extends StaticScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, vscode.Uri.joinPath(ctx.extensionUri, 'data', path).fsPath);
    }
}
class VolatileScribeEnum extends LocalScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, 'versions/' + ScribeEnumHandler.version + '/' + path);
    }
}
export class WebScribeEnum extends AbstractScribeEnum {
    constructor(identifier: string, path: string) {
        super(identifier, path);
        fetchEnumDatasetFromLink(path).then((data) => {
            this.dataset = new Map(Object.entries(data));
            this.updateCommaList();
            return;
        });
    }
}
export class LambdaScribeEnum extends AbstractScribeEnum {
    constructor(key: string, values: string[]) {
        super(key, '');
        const val = values.reduce((acc: { [key: string]: EnumDatasetValue }, curr) => {
            acc[curr] = { description: '' };
            return acc;
        }, {});
        this.dataset = new Map(Object.entries(val));
        this.updateCommaList();
    }
}

export interface EnumDatasetValue {
    description?: string;
    name?: string[];
}

export const ScribeEnumHandler = {
    version: minecraftVersion(),
    enums: new Map<string, AbstractScribeEnum>(),

    enumDefinitions: [
        {
            clazz: VolatileScribeEnum,
            items: [
                ['SOUND', 'minecraft/sounds.json'],
                ['PAPERATTRIBUTE', 'paper/attributes.json'],
                ['BARCOLOR', 'paper/barcolor.json'],
                ['BARSTYLE', 'paper/barstyle.json'],
                ['DAMAGECAUSE', 'paper/damagecause.json'],
                ['DYE', 'paper/dye.json'],
                ['MATERIAL', 'paper/material.json'],
                ['BLOCKFACE', 'paper/blockface.json'],
                ['ENDERDRAGONPHASE', 'paper/enderdragonphase.json'],
                ['DRAGONBATTLERESPAWNPHASE', 'paper/dragonbattlerespawnphase.json'],
                ['POTIONEFFECTTYPE', 'paper/potioneffecttype.json'],
                ['WORLDENVIRONMENT', 'paper/worldenvironment.json'],
                ['ENTITYTYPE', 'paper/entitytype.json'],
                ['GAMEMODE', 'paper/gamemode.json'],
                ['SPAWNREASON', 'paper/spawnreason.json'],
                ['ENCHANTMENT', 'paper/enchantment.json'],
                ['ITEMFLAG', 'paper/itemflag.json'],
                ['SOUNDCATEGORY', 'paper/soundcategory.json'],
                ['FIREWORKEFFECTTYPE', 'paper/fireworkeffecttype.json'],
                ['FLUIDCOLLISIONMODE', 'paper/fluidcollisionmode.json'],
            ],
        },
        {
            clazz: LocalScribeEnum,
            items: [
                ['AUDIENCE', 'mythic/audiences.json'],
                ['EQUIPSLOT', 'mythic/equipslot.json'],
                ['PARTICLE', 'mythic/particles.json'],
                ['STATMODIFIER', 'mythic/statsmodifiers.json'],
                ['SHAPE', 'mythic/shape.json'],
                ['FLUID', 'mythic/fluid.json'],
                ['GLOWCOLOR', 'mythic/glowcolor.json'],
                ['SCOREACTION', 'mythic/scoreaction.json'],
                ['VARIABLESCOPE', 'mythic/variablescope.json'],
                ['MYTHICENTITY', 'mythic/mythicentity.json'],
                ['PAPERATTRIBUTEOPERATION', 'mythic/attributesoperations.json'],
                ['STATTYPE', 'mythic/stattype.json'],
                ['STATEXECUTIONPOINT', 'mythic/statexecutionpoint.json'],
                ['ADDTRADE_ACTION', 'mythic/mechanicScoped/addtrade_action.json'],
                [
                    'DISPLAYTRANSFORMATION_ACTION',
                    'mythic/mechanicScoped/displaytransformation_action.json',
                ],
                ['PROJECTILE_BULLETTYPE', 'mythic/mechanicScoped/projectile_bullettype.json'],
                ['PROJECTILE_TYPE', 'mythic/mechanicScoped/projectile_type.json'],
                [
                    'PROJECTILE_HIGHACCURACYMODE',
                    'mythic/mechanicScoped/projectile_highaccuracymode.json',
                ],
                ['MODIFYPROJECTILE_ACTION', 'mythic/mechanicScoped/modifyprojectile_action.json'],
                ['MODIFYPROJECTILE_TRAIT', 'mythic/mechanicScoped/modifyprojectile_trait.json'],
                ['SETMAXHEALTH_MODE', 'mythic/mechanicScoped/setmaxhealth_mode.json'],
                ['SHOOT_TYPE', 'mythic/mechanicScoped/shoot_type.json'],
                ['SHOOTFIREBALL_TYPE', 'mythic/mechanicScoped/shootfireball_type.json'],
                ['THREAT_MODE', 'mythic/mechanicScoped/threat_mode.json'],
                ['TIME_MODE', 'mythic/mechanicScoped/time_mode.json'],
                ['VELOCITY_MODE', 'mythic/mechanicScoped/velocity_mode.json'],
            ],
        },
    ],

    initializeEnums(): void {
        ScribeEnumHandler.emptyDatasets();
        this.enumDefinitions.forEach(({ clazz, items }) => {
            items.forEach(([identifier, path]) => {
                this.addEnum(clazz, identifier, path);
            });
        });
    },

    getEnum(identifier: string): AbstractScribeEnum | undefined {
        return ScribeEnumHandler.enums.get(identifier.toLowerCase());
    },

    async addEnum(
        oclass: new (identifier: string, path: string) => AbstractScribeEnum,
        identifier: string,
        path: string
    ) {
        const enumObject = new oclass(identifier.toLowerCase(), path);
        ScribeEnumHandler.enums.set(identifier.toLowerCase(), enumObject);
    },

    async addLambdaEnum(key: string, values: string[]) {
        const enumObject = new LambdaScribeEnum(key.toLowerCase(), values);
        ScribeEnumHandler.enums.set(key.toLowerCase(), enumObject);
    },

    emptyDatasets(): void {
        ScribeEnumHandler.enums.clear();
    },
};
