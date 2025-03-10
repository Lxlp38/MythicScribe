export const MinecraftVersions = [
    'latest',
    '1.21.3',
    '1.21.1',
    '1.20.6',
    '1.20.5',
    '1.20.4',
    '1.19.4',
];

export enum datasetSource {
    Local = 'Local',
    GitHub = 'GitHub',
}

export enum attributeAliasUsedInCompletions {
    main = 'main',
    shorter = 'shorter',
    longer = 'longer',
}
export enum CustomDatasetElementType {
    Bundle = 'Bundle',
    Enum = 'Enum',
    Mechanic = 'Mechanic',
    Condition = 'Condition',
    Trigger = 'Trigger',
    Targeter = 'Targeter',
    AIGoal = 'AIGoal',
    AITarget = 'AITarget',
}
export enum CustomDatasetSource {
    File = 'File',
    Link = 'Link',
}
