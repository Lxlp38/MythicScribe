import {
    SchemaElement,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';

/**
 * Generates an array of numbers in a specified range, formatted as strings.
 *
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @param step - The step value to increment by.
 * @param float - Whether to generate floating-point numbers. Defaults to `false`.
 * @param start - An optional starting value to include in the result. Defaults to `null`.
 * @returns An array of numbers in the specified range, formatted as strings.
 */
export function generateNumbersInRange(
    min: number,
    max: number,
    step: number,
    float: boolean = false,
    start: number | null = null
): string[] {
    const result = [];

    if (start) {
        result.push(start.toString());
        min += step;
    }

    if (!float) {
        for (let i = min; i <= max; i += step) {
            result.push(i.toString());
        }
        return result;
    }

    for (let i = min; i <= max; i += step) {
        result.push(i.toFixed(2).toString());
    }
    return result;
}

/**
 * Adds aliases to the given Schema based on the provided alias map.
 *
 * @param obj - The Schema to which aliases will be added.
 * @param aliasMap - An object where each key is a string representing a file object key,
 * and the value is an array of strings representing the aliases for that key.
 */
export function addSchemaAliases(obj: Schema, aliasMap: { [key: string]: string[] }) {
    for (const key in aliasMap) {
        const aliases = aliasMap[key];
        if (obj[key]) {
            for (const alias of aliases) {
                obj[alias] = obj[key];
            }
        }
    }
}

export function expandSchemaToMap(obj: Schema, insert: Schema) {
    for (const key in insert) {
        const value = insert[key];
        obj[key] = value;
    }
}

export function getSchemaElementInTree(
    keys: string[],
    type: Schema,
    link?: string
): SchemaElement | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    if (!object) {
        return handleSpecialSchemaElements(keys, type, link);
    }
    if (keys.length === 0) {
        if (!object.link) {
            object.link = link;
        }
        return object;
    }
    if (object.type === SchemaElementTypes.KEY && object.keys) {
        const newobject = object.keys;
        return getSchemaElementInTree(keys, newobject, object.link);
    }
    return undefined;
}

function handleSpecialSchemaElements(
    keys: string[],
    type: Schema,
    link?: string
): SchemaElement | undefined {
    if (SchemaElementSpecialKeys.WILDKEY in type) {
        const wildkey = handleWildKeySchemaElement(keys, type, link);
        if (wildkey) {
            return wildkey;
        }
    }
    return undefined;
}

function handleWildKeySchemaElement(
    keys: string[],
    type: Schema,
    link?: string
): SchemaElement | undefined {
    const wildcardObject = type[SchemaElementSpecialKeys.WILDKEY]!;
    if (!wildcardObject.link) {
        wildcardObject.link = link;
    }
    if (keys.length === 0) {
        return wildcardObject;
    }
    if (wildcardObject.keys) {
        return getSchemaElementInTree(keys, wildcardObject.keys, wildcardObject.link);
    }
    return undefined;
}
