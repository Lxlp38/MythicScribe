export function generateNumbersInRange(
    min: number,
    max: number,
    step: number,
    float: boolean = false,
    start: number | null = null,
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
