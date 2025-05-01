export type PrismaFieldType = 'String' | 'Number' | 'Boolean' | 'DateTime' | 'Json' | 'Enum' | 'Relation';
export interface PrismaField {
    name: string;
    type: PrismaFieldType;
    isFloat: boolean;
    isList: boolean;
    isRequired: boolean;
    isId: boolean;
    isEnum: boolean;
    referencedModel?: string;
    referencedFieldName?: string;
    referencedFieldIsList?: boolean;
    documentation?: string;
    defaultValue?: any;
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
export type ControlType = 'text' | 'integer' | 'float' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor' | 'file' | 'image' | string;
export type StaticOrDynamic<T> = T | string;
export interface FormControlConfig {
    name: string;
    displayName: string;
    type: ControlType;
    options?: Array<{
        name: string;
        value: any;
    }>;
    default?: any;
    defaultExpression?: string;
    valueExpression?: string;
    validation?: Record<string, any>;
    config?: Record<string, any>;
    relation?: {
        model: string;
        labelField: string;
        valueField: string;
    };
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
    field?: string;
    control: FormControlConfig;
    valueExpression: StaticOrDynamic<object>;
}
export interface EntityUIConfig {
    name: string;
    pluralName: string;
    displayField: string;
    displayFieldExpression?: string;
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
