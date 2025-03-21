export namespace ConditionActions {
    export enum ConditionTypes {
        CHECK = 'check',
        METASKILL = 'metaskill',
        FLOAT = 'float',
    }

    export const actions = new Map<string, ConditionTypes>([
        ['true', ConditionTypes.CHECK],
        ['false', ConditionTypes.CHECK],
        ['cast', ConditionTypes.METASKILL],
        ['castinstead', ConditionTypes.METASKILL],
        ['orelsecast', ConditionTypes.METASKILL],
        ['power', ConditionTypes.FLOAT],
    ]);

    export function getConditionActions() {
        return Array.from(actions.keys());
    }

    export const metaskillActions = Array.from(actions.entries())
        .filter(([_, type]) => type === ConditionTypes.METASKILL)
        .map(([action]) => action);
}
