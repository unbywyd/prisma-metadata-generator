import { ListAction } from "./generate-ui-schema.js";
export type PrismaFieldType = 'String' | 'Integer' | 'Float' | 'Boolean' | 'DateTime' | 'Json' | 'Enum' | 'Relation';
export interface PrismaField {
    name: string;
    type: PrismaFieldType;
    enum?: string;
    isList: boolean;
    isRequired: boolean;
    isId: boolean;
    referencedModel?: string;
    referenceCanBeChanged?: boolean;
    referencedFieldName?: string;
    referencedFieldIsList?: boolean;
    documentation?: string;
    defaultValue?: any;
    isNullable: boolean;
}
export interface PrismaModel {
    name: string;
    fields: PrismaField[];
    documentation?: string;
}
export interface PrismaMetadata {
    models: PrismaModel[];
    enums: Record<string, string[]>;
}
export type ControlType = 'text' | 'textarea' | 'integer' | 'float' | 'address' | 'json' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor';
export type StaticOrDynamic<T> = T | string;
export interface FormControlConfig {
    name: string;
    displayName: string;
    description?: string;
    type: ControlType;
    options?: Array<{
        label: string;
        value: any;
    }>;
    default?: any;
    defaultExpression?: string;
    validation?: Record<string, any>;
    config?: Record<string, any>;
    referencedModel?: string;
    relationFieldName?: string;
    isNullable: boolean;
    isMulti?: boolean;
    isRequired?: boolean | string;
    isDisabled?: boolean | string;
    isHidden?: boolean | string;
}
export interface DisplayFieldConfig {
    name: string;
    displayName: string;
    accessExpression?: string;
    className?: string;
    customRender?: string;
    field?: string;
    displayExpression?: string;
    type: ControlType;
    isListHidden?: boolean;
}
export interface FilterConfig {
    name: string;
    displayName: string;
    isHidden: boolean;
    isActive: boolean;
    field?: string;
    control?: FormControlConfig;
    valueExpression?: StaticOrDynamic<object>;
}
export interface SortConfig {
    name: string;
    displayName: string;
    field?: string;
    expression: string;
    defaultDirection?: 'asc' | 'desc';
    isHidden?: boolean;
    isActive?: boolean;
}
export interface FieldConfig {
    name: string;
    displayName: string;
    field: string;
    control: FormControlConfig;
}
export interface EntityUIConfig {
    name: string;
    pluralName: string;
    displayField: string;
    listActions?: ListAction[];
    recordActions?: ListAction[];
    model: string;
    listFields: DisplayFieldConfig[];
    listFilters?: FilterConfig[];
    listSorts?: SortConfig[];
    canBeCreated?: boolean;
    canBeDeleted?: boolean;
    canBeEdited?: boolean;
    canBeViewed?: boolean;
    createFields?: FieldConfig[];
    updateFields?: FieldConfig[];
    viewFields?: DisplayFieldConfig[];
    viewInclude?: StaticOrDynamic<object>;
    listInclude?: StaticOrDynamic<object>;
}
export type EntityUIMetaConfig = Record<string, EntityUIConfig>;
export type AdminUIConfig = {
    apiUrl: string;
    logoUrl?: string;
    title?: string;
    description?: string;
    language?: string;
};
export type UIMetaConfig = {
    ui: {
        models: EntityUIMetaConfig;
    } & AdminUIConfig;
    metadata: PrismaMetadata;
};
