import {
    SchemaElement,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
    getKeySchema,
} from '../objectInfos';
import { isPluginEnabled } from './configutils';

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

export function inheritSchemaOptions(schema: Schema, link?: string, plugin?: string) {
    for (const key in schema) {
        const value = schema[key];
        // If the current schema element does not have a 'link', inherit it from the parent.
        if (!value.link) {
            value.link = link;
        }
        // If the current schema element does not have a 'plugin', inherit it from the parent.
        if (!value.plugin) {
            value.plugin = plugin;
        }

        // If the schema element has keys and they are not a function, recursively propagate 'link' and 'plugin'.
        // This ensures we only process objects and not callable functions.
        if ('keys' in value && value.keys && typeof value.keys !== 'function') {
            inheritSchemaOptions(value.keys, value.link, value.plugin);
        }
    }
}

export function filterSchemaWithEnabledPlugins(schema: Schema): Schema {
    const filteredSchema: Schema = {};
    for (const key in schema) {
        const value = schema[key];
        if (value.plugin === undefined || isPluginEnabled(value.plugin)) {
            filteredSchema[key] = value;
            if ('keys' in filteredSchema[key] && filteredSchema[key].keys) {
                if (typeof filteredSchema[key].keys === 'function') {
                    filteredSchema[key].keys = filteredSchema[key].keys;
                } else {
                    filteredSchema[key].keys = filterSchemaWithEnabledPlugins(
                        filteredSchema[key].keys
                    );
                }
            }
        }
    }
    return filteredSchema;
}

export function getSchemaElement(keys: string[], type: Schema): SchemaElement | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    if (!object) {
        return handleSpecialSchemaElements(keys, type);
    }
    if (keys.length === 0) {
        return object;
    }
    if (object.type === SchemaElementTypes.KEY && object.keys) {
        const newobject = object.keys;
        return getSchemaElement(keys, getKeySchema(newobject));
    }
    return undefined;
}

function handleSpecialSchemaElements(keys: string[], type: Schema): SchemaElement | undefined {
    if (SchemaElementSpecialKeys.WILDKEY in type) {
        const wildkey = handleWildKeySchemaElement(keys, type);
        if (wildkey) {
            return wildkey;
        }
    }
    return undefined;
}

function handleWildKeySchemaElement(keys: string[], type: Schema): SchemaElement | undefined {
    const wildcardObject = type[SchemaElementSpecialKeys.WILDKEY]!;
    if (keys.length === 0) {
        return wildcardObject;
    }
    if (wildcardObject.keys) {
        return getSchemaElement(keys, getKeySchema(wildcardObject.keys));
    }
    return undefined;
}
