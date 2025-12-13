import { MythicNode, MythicNodeHandler, NodeEntry } from '@common/mythicnodes/MythicNode';
import { generateNumbersInRange } from '@common/utils/schemautils';
import { AchievementSchema } from '@common/schemas/achievementSchema';
import { DroptableSchema } from '@common/schemas/droptableSchema';
import { EquipmentSetSchema } from '@common/schemas/equipmentsetSchema';
import { ItemSchema } from '@common/schemas/itemSchema';
import { MenuSchema } from '@common/schemas/menuSchema';
import { MetaskillSchema } from '@common/schemas/metaskillSchema';
import { MobSchema } from '@common/schemas/mobSchema';
import { PlaceholderSchema } from '@common/schemas/placeholderSchema';
import { RandomSpawnSchema } from '@common/schemas/randomSpawnSchema';
import { ReagentSchema } from '@common/schemas/reagentSchema';
import { StatSchema } from '@common/schemas/statSchema';
import { Schema } from '@common/objectInfos';

import { EnumDatasetValue } from './types/Enum';
import { AbstractScribeMechanicRegistry, ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandlerImpl } from './ScribeEnum';
import { scriptedEnums } from './enumSources';

function fromMechanicRegistryToEnum(
    registry: AbstractScribeMechanicRegistry,
    nameParser: (name: string) => string = (name) => name
): Map<string, EnumDatasetValue> {
    const mechanics: Map<string, EnumDatasetValue> = new Map();
    registry.getMechanics().forEach((mechanic) => {
        mechanic.name.forEach((name) => {
            mechanics.set(nameParser(name), { description: mechanic.description });
        });
    });
    return mechanics;
}
function fromMythicNodeToEnum(nodes: Map<string, MythicNode>): Map<string, EnumDatasetValue> {
    const metaskills: Map<string, EnumDatasetValue> = new Map();
    nodes.forEach((node) => {
        metaskills.set(node.name.text, { description: node.description.text || '' });
    });
    return metaskills;
}

function fromSchemaToEnum(schema: Schema): Map<string, EnumDatasetValue> {
    const schemaEnum: Map<string, EnumDatasetValue> = new Map();
    Object.entries(schema).forEach(([key, value]) => {
        schemaEnum.set(key, { description: value.description });
    });
    return schemaEnum;
}

export function addScriptedEnums(
    enumHandler: ScribeEnumHandlerImpl,
    mechanicHandler: typeof ScribeMechanicHandler
) {
    // mechanic List-related datasets
    enumHandler.addScriptedEnum(scriptedEnums.MechanicList, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.mechanic)
    );
    enumHandler.addScriptedEnum(scriptedEnums.TargeterList, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.targeter)
    );
    enumHandler.addScriptedEnum(scriptedEnums.TriggerList, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.trigger)
    );
    enumHandler.addScriptedEnum(scriptedEnums.ConditionList, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.condition)
    );
    enumHandler.addScriptedEnum(scriptedEnums.Targeter, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.targeter, (name) => '@' + name)
    );
    enumHandler.addScriptedEnum(scriptedEnums.Trigger, () =>
        fromMechanicRegistryToEnum(mechanicHandler.registry.trigger, (name) => '~' + name)
    );

    // Special cases
    enumHandler.addScriptedEnum(scriptedEnums.Item, () => {
        const mythicitems = fromMythicNodeToEnum(MythicNodeHandler.registry.item.getNodes());
        const paperitems = enumHandler.getEnum('material')!.getDataset();
        return new Map([...mythicitems, ...paperitems]);
    });
    enumHandler.addScriptedEnum(scriptedEnums.ReagentValue, () => {
        const ret = fromMythicNodeToEnum(MythicNodeHandler.registry.stat.getNodes());
        const ret2 = new Map<string, EnumDatasetValue>();
        ret.forEach((value, key) => {
            ret2.set('stat.' + key, value);
        });
        generateNumbersInRange(0, 5, 1, true).forEach((value) => {
            ret2.set(value, { description: '' });
        });
        return ret2;
    });
    enumHandler.addScriptedEnum(scriptedEnums.Spell, () => {
        const metaskills = MythicNodeHandler.registry.metaskill.getNodes();
        const spells: NodeEntry = new Map();
        metaskills.forEach((value, key) => {
            if (value.metadata.get('spell') === true) {
                spells.set(key, value);
            }
        });
        return fromMythicNodeToEnum(spells);
    });
    enumHandler.addScriptedEnum(scriptedEnums.Furniture, () => {
        const items = MythicNodeHandler.registry.item.getNodes();
        const furnitures: NodeEntry = new Map();
        items.forEach((value, key) => {
            if (value.getTemplatedMetadata<string>('type') === 'furniture') {
                furnitures.set(key, value);
            }
        });
        return fromMythicNodeToEnum(furnitures);
    });
    enumHandler.addScriptedEnum(scriptedEnums.CustomBlock, () => {
        const items = MythicNodeHandler.registry.item.getNodes();
        const customBlocks: NodeEntry = new Map();
        items.forEach((value, key) => {
            if (value.getTemplatedMetadata<string>('type') === 'block') {
                customBlocks.set(key, value);
            }
        });
        return fromMythicNodeToEnum(customBlocks);
    });
    enumHandler.addScriptedEnum(scriptedEnums.Block, () => {
        const customBlocks = enumHandler.getEnum(scriptedEnums.CustomBlock)!.getDataset();
        const paperitems = enumHandler.getEnum('material')!.getDataset();
        return new Map([...customBlocks, ...paperitems]);
    });

    // Node-related datasets
    enumHandler.addScriptedEnum(scriptedEnums.Mob, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.mob.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.MythicItem, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.item.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Metaskill, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.metaskill.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Droptable, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.droptable.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Stat, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.stat.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Pin, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.pin.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.CustomPlaceholder, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.placeholder.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.RandomSpawn, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.randomspawn.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.EquipmentSet, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.equipmentset.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Archetype, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.archetype.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Reagent, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.reagent.getNodes())
    );
    enumHandler.addScriptedEnum(scriptedEnums.Menu, () =>
        fromMythicNodeToEnum(MythicNodeHandler.registry.menu.getNodes())
    );

    // Schemas
    enumHandler.addScriptedEnum(scriptedEnums.MobSchema, () => fromSchemaToEnum(MobSchema));
    enumHandler.addScriptedEnum(scriptedEnums.ItemSchema, () => fromSchemaToEnum(ItemSchema));
    enumHandler.addScriptedEnum(scriptedEnums.MetaskillSchema, () =>
        fromSchemaToEnum(MetaskillSchema)
    );
    enumHandler.addScriptedEnum(scriptedEnums.DroptableSchema, () =>
        fromSchemaToEnum(DroptableSchema)
    );
    enumHandler.addScriptedEnum(scriptedEnums.StatSchema, () => fromSchemaToEnum(StatSchema));
    enumHandler.addScriptedEnum(scriptedEnums.RandomSpawnSchema, () =>
        fromSchemaToEnum(RandomSpawnSchema)
    );
    enumHandler.addScriptedEnum(scriptedEnums.PlaceholderSchema, () =>
        fromSchemaToEnum(PlaceholderSchema)
    );
    enumHandler.addScriptedEnum(scriptedEnums.EquipmentSetSchema, () =>
        fromSchemaToEnum(EquipmentSetSchema)
    );
    enumHandler.addScriptedEnum(scriptedEnums.ReagentSchema, () => fromSchemaToEnum(ReagentSchema));
    enumHandler.addScriptedEnum(scriptedEnums.MenuSchema, () => fromSchemaToEnum(MenuSchema));
    enumHandler.addScriptedEnum(scriptedEnums.AchievementSchema, () =>
        fromSchemaToEnum(AchievementSchema)
    );
}
