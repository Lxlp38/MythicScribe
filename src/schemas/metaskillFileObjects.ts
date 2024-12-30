import { generateNumbersInRange } from '../utils/schemautils';
import { FileObjectMap, FileObjectTypes } from '../objectInfos';

export const MetaskillFileObjects: FileObjectMap = {
    Skills: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#skills',
        description: 'The list of the mechanics that will be executed by the metaskill.',
    },
    Conditions: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions',
        description:
            'The list of conditions that will evaluate the caster of the metaskill before execution.',
    },
    TargetConditions: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#targetconditions',
        description:
            'The list of conditions that will evaluate the target of the metaskill before execution',
    },
    TriggerConditions: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#triggerconditions',
        description:
            'The list of conditions that will evaluate the trigger of the metaskill before execution',
    },
    Cooldown: {
        type: FileObjectTypes.FLOAT,
        values: generateNumbersInRange(0, 100, 10, false),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cooldown',
        description: 'The cooldown of the metaskill (in seconds).',
    },
    CancelIfNoTargets: {
        type: FileObjectTypes.BOOLEAN,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cancelifnotargets',
        description: 'Whether the metaskill should be cancelled if there are no targets.',
    },
    FailedConditionsSkill: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#failedconditionsskill',
        description: 'The name of the metaskill to cast if the conditions fail.',
    },
    OnCooldownSkill: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#oncooldownskill',
        description: 'The name of the metaskill to cast if the metaskill is on cooldown.',
    },
};
