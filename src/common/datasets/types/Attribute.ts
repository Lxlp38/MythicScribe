export interface Attribute {
    name: string[];
    type: string;
    enum?: string;
    list?: boolean;
    description: string;
    link?: string;
    default_value: string;
    inheritable?: boolean;
}
