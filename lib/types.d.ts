export type PrismaFieldType = 'String' | 'Number' | 'Boolean' | 'DateTime' | 'Json' | 'Enum' | 'Relation';
export interface PrismaField {
    name: string;
    type: PrismaFieldType;
    isFloat: boolean;
    isList: boolean;
    isRequired: boolean;
    referencedModel?: string;
    documentation?: string;
    defaultValue?: any;
    enumValues?: string[];
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
export type ControlType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor' | 'file' | 'image';
export type StaticOrDynamic<T> = T | string;
export interface FormControlConfig {
    name: string;
    type: ControlType;
    options?: Array<{
        name: string;
        value: any;
    }>;
    default?: any;
    validation?: Record<string, any>;
    config?: Record<string, any>;
    relation?: {
        model: string;
        labelField: string;
        valueField: string;
    };
    valueExpression?: string;
    multi?: boolean;
    isRequired?: boolean | string;
    isDisabled?: boolean | string;
    isHidden?: boolean | string;
}
export interface DisplayFieldConfig {
    name: string;
    field?: string;
    displayExpression?: string;
}
export interface FilterConfig {
    name: string;
    isHidden: boolean;
    isActive: boolean;
    controls?: FormControlConfig[];
    whereExpression?: StaticOrDynamic<object>;
}
export interface SortConfig {
    name: string;
    field: string;
    defaultDirection?: 'asc' | 'desc';
    isHidden?: boolean;
    isActive?: boolean;
}
export interface FieldConfig {
    name: string;
    field: string;
    allowCreate?: boolean | string;
    allowUpdate?: boolean | string;
    controls?: FormControlConfig[];
    computeExpression?: string;
}
export interface EntityUIConfig {
    name: string;
    pluralName: string;
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
    viewSelect?: StaticOrDynamic<object>;
    viewInclude?: StaticOrDynamic<object>;
    listSelect?: StaticOrDynamic<object>;
    listInclude?: StaticOrDynamic<object>;
}
export type EntityUIMetaConfig = Record<string, EntityUIConfig>;
export interface UIMetaConfig {
    ui: EntityUIMetaConfig;
    metadata: PrismaMetadata;
}
