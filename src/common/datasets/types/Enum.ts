import { Attribute } from './Attribute';

export interface Enum {
    [key: string]: EnumDatasetValue;
}
export interface EnumDatasetValue {
    description?: string;
    name?: string[];
    attributes?: Attribute[];
}
