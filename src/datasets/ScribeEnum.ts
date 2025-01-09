import * as vscode from 'vscode';

import { minecraftVersion } from '../utils/configutils';
import { loadLocalEnumDataset, fetchEnumDatasetFromLink } from './datasets';
import { AbstractScribeHandler } from '../handlers/AbstractScribeHandler';

export class ScribeEnumHandler extends AbstractScribeHandler {
    static createInstance(): AbstractScribeHandler {
        return new ScribeEnumHandler();
    }
    static version = minecraftVersion();

    private static enums = new Map<string, AbstractScribeEnum>();

    private constructor() {
        super();
        this.initializeEnums();
    }

    private initializeEnums(): void {
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'SOUND', 'minecraft/sounds.json');

        ScribeEnumHandler.addEnum(LocalScribeEnum, 'AUDIENCE', 'mythic/audiences.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'EQUIPSLOT', 'mythic/equipslot.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'PARTICLE', 'mythic/particles.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'STATMODIFIER', 'mythic/statsmodifiers.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'SHAPE', 'mythic/shape.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'FLUID', 'mythic/fluid.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'GLOWCOLOR', 'mythic/glowcolor.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'SCOREACTION', 'mythic/scoreaction.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'VARIABLESCOPE', 'mythic/variablescope.json');
        ScribeEnumHandler.addEnum(LocalScribeEnum, 'MYTHICENTITY', 'mythic/mythicentity.json');
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'PAPERATTRIBUTEOPERATION',
            'mythic/attributesoperations.json'
        );

        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'PAPERATTRIBUTE', 'paper/attributes.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'BARCOLOR', 'paper/barcolor.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'BARSTYLE', 'paper/barstyle.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'DAMAGECAUSE', 'paper/damagecause.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'DYE', 'paper/dye.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'MATERIAL', 'paper/material.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'BLOCKFACE', 'paper/blockface.json');
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'ENDERDRAGONPHASE',
            'paper/enderdragonphase.json'
        );
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'DRAGONBATTLERESPAWNPHASE',
            'paper/dragonbattlerespawnphase.json'
        );
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'POTIONEFFECTTYPE',
            'paper/potioneffecttype.json'
        );
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'WORLDENVIRONMENT',
            'paper/worldenvironment.json'
        );
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'ENTITYTYPE', 'paper/entitytype.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'GAMEMODE', 'paper/gamemode.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'SPAWNREASON', 'paper/spawnreason.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'ENCHANTMENT', 'paper/enchantment.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'ITEMFLAG', 'paper/itemflag.json');
        ScribeEnumHandler.addEnum(VolatileScribeEnum, 'SOUNDCATEGORY', 'paper/soundcategory.json');
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'FIREWORKEFFECTTYPE',
            'paper/fireworkeffecttype.json'
        );
        ScribeEnumHandler.addEnum(
            VolatileScribeEnum,
            'FLUIDCOLLISIONMODE',
            'paper/fluidcollisionmode.json'
        );

        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'ADDTRADE_ACTION',
            'mythic/mechanicScoped/addtrade_action.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'DISPLAYTRANSFORMATION_ACTION',
            'mythic/mechanicScoped/displaytransformation_action.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'PROJECTILE_BULLETTYPE',
            'mythic/mechanicScoped/projectile_bullettype.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'PROJECTILE_TYPE',
            'mythic/mechanicScoped/projectile_type.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'PROJECTILE_HIGHACCURACYMODE',
            'mythic/mechanicScoped/projectile_highaccuracymode.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'MODIFYPROJECTILE_ACTION',
            'mythic/mechanicScoped/modifyprojectile_action.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'MODIFYPROJECTILE_TRAIT',
            'mythic/mechanicScoped/modifyprojectile_trait.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'SETMAXHEALTH_MODE',
            'mythic/mechanicScoped/setmaxhealth_mode.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'SHOOT_TYPE',
            'mythic/mechanicScoped/shoot_type.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'SHOOTFIREBALL_TYPE',
            'mythic/mechanicScoped/shootfireball_type.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'THREAT_MODE',
            'mythic/mechanicScoped/threat_mode.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'TIME_MODE',
            'mythic/mechanicScoped/time_mode.json'
        );
        ScribeEnumHandler.addEnum(
            LocalScribeEnum,
            'VELOCITY_MODE',
            'mythic/mechanicScoped/velocity_mode.json'
        );
    }

    static getEnum(identifier: string): AbstractScribeEnum | undefined {
        return ScribeEnumHandler.enums.get(identifier.toUpperCase());
    }

    static async addEnum(
        oclass: new (identifier: string, path: string) => AbstractScribeEnum,
        identifier: string,
        path: string
    ) {
        const enumObject = new oclass(identifier.toUpperCase(), path);
        ScribeEnumHandler.enums.set(identifier.toUpperCase(), enumObject);
    }

    static async addLambdaEnum(key: string, values: string[]) {
        const enumObject = new LambdaScribeEnum(key.toUpperCase(), values);
        ScribeEnumHandler.enums.set(key.toUpperCase(), enumObject);
    }

    static removeAllEnums(): void {
        ScribeEnumHandler.enums.clear();
    }
}

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
        super(
            identifier,
            vscode.Uri.joinPath(ScribeEnumHandler.context.extensionUri, 'data', path).fsPath
        );
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
