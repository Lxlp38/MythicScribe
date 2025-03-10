export const MinecraftVersions = [
    'latest',
    '1.21.3',
    '1.21.1',
    '1.20.6',
    '1.20.5',
    '1.20.4',
    '1.19.4',
];

export const DatasetSource = ['Local', 'GitHub'] as const;
export type DatasetSource = (typeof DatasetSource)[number];

export const attributeAliasUsedInCompletions = ['main', 'shorter', 'longer'] as const;
export type attributeAliasUsedInCompletions = (typeof attributeAliasUsedInCompletions)[number];

export const CustomDatasetElementType = [
    'Bundle',
    'Enum',
    'Mechanic',
    'Condition',
    'Trigger',
    'Targeter',
    'AIGoal',
    'AITarget',
] as const;
export type CustomDatasetElementType = (typeof CustomDatasetElementType)[number];

export const CustomDatasetSource = ['File', 'Link'] as const;
export type CustomDatasetSource = (typeof CustomDatasetSource)[number];
