import {
    SchemaElement,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
    getKeySchema,
} from '../objectInfos';
import { isPluginEnabled } from '../providers/configProvider';

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
 * Generate all 3D vectors within a cubic range as strings.
 *
 * Produces an array of strings representing every coordinate triple (x,y,z)
 * where each coordinate iterates from `min` to `max` (inclusive) in steps of
 * `step`. Each vector is returned in the form "x,y,z".
 *
 * If `float` is false (default) coordinates are emitted using the default
 * numeric representation. If `float` is true, each coordinate is formatted
 * with two decimal places (via toFixed(2)).
 *
 * Notes:
 * - The iteration order is nested: x outermost, then y, then z (x changes slowest).
 * - `step` must be a positive, non-zero number. If a non-positive value is given,
 *   it defaults to 1.
 * - Because of floating-point precision, using fractional steps may produce
 *   rounding artefacts; prefer integer steps or account for precision when needed.
 * - The number of produced vectors is roughly ((max - min) / step + 1)^3 (subject
 *   to rounding/truncation for non-integer steps).
 *
 * @param min - Inclusive lower bound for each coordinate.
 * @param max - Inclusive upper bound for each coordinate.
 * @param step - Increment for each coordinate between iterations (must be > 0).
 * @param float - If true, format coordinates with two decimal places. Default: false.
 * @returns An array of strings, each representing a vector in the form "x,y,z".
 *
 * @example
 * // Integers from -1 to 1 with step 1:
 * // ["-1,-1,-1", "-1,-1,0", ..., "1,1,1"]
 * generateVectorsInRange(-1, 1, 1);
 *
 * @example
 * // Floats from 0.0 to 0.5 with step 0.25 (formatted to 2 decimals):
 * // ["0.00,0.00,0.00", "0.00,0.00,0.25", ..., "0.50,0.50,0.50"]
 * generateVectorsInRange(0, 0.5, 0.25, true);
 */
export function generateVectorsInRange(
    min: number,
    max: number,
    step: number,
    float: boolean = false
): string[] {
    if (step <= 0) {
        step = 1;
    }
    const result = [];
    if (!float) {
        for (let x = min; x <= max; x += step) {
            for (let y = min; y <= max; y += step) {
                for (let z = min; z <= max; z += step) {
                    result.push(`${x},${y},${z}`);
                }
            }
        }
        return result;
    }

    for (let x = min; x <= max; x += step) {
        for (let y = min; y <= max; y += step) {
            for (let z = min; z <= max; z += step) {
                result.push(`${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`);
            }
        }
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

/**
 * Expands a schema object by merging the properties of another schema into it.
 *
 * This function iterates over all the keys in the `insert` schema and assigns
 * their corresponding values to the `obj` schema. If a key in `insert` already
 * exists in `obj`, its value will be overwritten.
 *
 * @param obj - The target schema object to be expanded. This object will be modified in place.
 * @param insert - The schema object containing properties to be added to `obj`.
 */
export function expandSchemaToMap(obj: Schema, insert: Schema) {
    for (const key in insert) {
        const value = insert[key];
        obj[key] = value;
    }
}

/**
 * Recursively propagates `link` and `plugin` properties through a schema object.
 *
 * This function ensures that each element in the schema inherits the `link` and `plugin`
 * properties from its parent if they are not explicitly defined. Additionally, it processes
 * nested schema elements by recursively applying the same logic to their `keys` property.
 *
 * @param schema - The schema object to process. Each element in the schema is expected to
 *                  be an object that may contain `link`, `plugin`, and optionally `keys`.
 * @param link - The `link` value to inherit if an element does not have its own `link`.
 * @param plugin - The `plugin` value to inherit if an element does not have its own `plugin`.
 */
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

/**
 * Filters a schema object by removing entries associated with plugins that are not enabled.
 * This function recursively processes nested schemas to ensure all levels are filtered.
 *
 * @param schema - The schema object to be filtered. Each key in the schema is expected to have
 *                 an associated value that may include a `plugin` property and optionally a `keys` property.
 *                 - `plugin`: Specifies the plugin associated with the schema entry.
 *                 - `keys`: Represents nested schema entries, which can either be an object or a function.
 *
 * @returns A new schema object containing only the entries associated with enabled plugins.
 *          Nested schemas are also filtered recursively.
 */
export function filterSchemaWithEnabledPlugins(schema: Schema): Schema {
    const filteredSchema: Schema = {};
    for (const key in schema) {
        const value = schema[key];
        if (!isPluginEnabled(value.plugin)) {
            continue;
        }

        filteredSchema[key] = value;
        if (!('keys' in filteredSchema[key]) || !filteredSchema[key].keys) {
            continue;
        }

        if (typeof filteredSchema[key].keys === 'function') {
            continue;
        }

        filteredSchema[key].keys = filterSchemaWithEnabledPlugins(filteredSchema[key].keys);
    }
    return filteredSchema;
}

/**
 * Retrieves a specific schema element from a nested schema structure based on the provided keys.
 *
 * @param keys - An array of strings representing the path to the desired schema element.
 *               The first element corresponds to the top-level key, and subsequent elements
 *               represent nested keys.
 * @param type - The root schema object from which the search begins.
 *
 * @returns The schema element corresponding to the provided keys, or `undefined` if the
 *          element is not found or the path is invalid.
 */
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
