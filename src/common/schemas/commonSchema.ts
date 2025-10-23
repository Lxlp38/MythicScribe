import { SchemaElement, SchemaElementTypes } from '@common/objectInfos';
import { generateNumbersInRange } from '@common/utils/schemautils';

export const DropsSchema: SchemaElement = {
    type: SchemaElementTypes.LIST,
    entries: [
        {
            type: SchemaElementTypes.ENUM,
            dataset: 'ITEM',
        },
        {
            type: SchemaElementTypes.INTEGER,
            description: 'The amount of items to drop.',
            values: generateNumbersInRange(1, 64, 1, false),
        },
        {
            type: SchemaElementTypes.FLOAT,
            description: 'The chance of the item to drop.',
            values: generateNumbersInRange(0.0, 1.0, 0.05, true),
        },
    ],
};
