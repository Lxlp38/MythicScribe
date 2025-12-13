import { registryKey } from '@common/objectInfos';

export const ActiveFileTypeInfo: Record<registryKey | 'enabled', boolean> = {
    enabled: false,
    metaskill: false,
    mob: false,
    item: false,
    droptable: false,
    stat: false,
    pin: false,
    placeholder: false,
    randomspawn: false,
    equipmentset: false,
    archetype: false,
    reagent: false,
    menu: false,
    achievement: false,
};
