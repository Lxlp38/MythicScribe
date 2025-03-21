export namespace ConditionActions {
    export enum types {
        CHECK = 'check',
        METASKILL = 'metaskill',
        FLOAT = 'float',
    }

    export const actions = new Map<string, types>([
        ['true', types.CHECK],
        ['false', types.CHECK],
        ['cast', types.METASKILL],
        ['castinstead', types.METASKILL],
        ['orelsecast', types.METASKILL],
        ['power', types.FLOAT],
    ]);

    export function getConditionActions() {
        return Array.from(actions.keys());
    }

    export const metaskillActions = Array.from(actions.entries())
        .filter(([_, type]) => type === types.METASKILL)
        .map(([action]) => action);
}
