import { FileObjectMap } from '../objectInfos';

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

export function addFileObjectAliases(obj: FileObjectMap, aliasMap: { [key: string]: string[] }) {
    for (const key in aliasMap) {
        const aliases = aliasMap[key];
        if (obj[key]) {
            for (const alias of aliases) {
                obj[alias] = obj[key];
            }
        }
    }
}
