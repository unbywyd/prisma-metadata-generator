import { PrismaMetadata, EntityUIMetaConfig, StaticOrDynamic, AdminUIConfig } from './types.js';
import { EntityUIConfig, FormControlConfig, DisplayFieldConfig, FilterConfig, SortConfig, FieldConfig } from './types.js';
export type DefaultModelConfig = {
    name?: string;
    pluralName?: string;
    displayFieldExpression?: string;
    displayField?: string;
    excludeListFields?: string[];
    includeListFields?: string[];
    skipFieldsWithNames?: string[];
    hiddenListFields?: string[];
    displayListFields?: string[];
    excludeFilterFields?: string[];
    includeFilterTypeFields?: string[];
    includeFilterFields?: string[];
    excludeSortFields?: string[];
    includeSortFields?: string[];
    includeSortTypeFields?: string[];
    additionalListFilters?: FilterConfig[];
    additionalListSortFields?: SortConfig[];
    excludeCreateFields?: string[];
    excludeUpdateFields?: string[];
    excludeViewFields?: string[];
    defaultOrderField?: string;
    defaultOrderDirection?: 'asc' | 'desc';
    excludeFields?: string[];
    canBeCreated?: boolean;
    canBeDeleted?: boolean;
    canBeEdited?: boolean;
    canBeViewed?: boolean;
    overrideFields?: {
        default?: {
            control?: FormControlConfig;
        };
        [key: string]: {
            control?: FormControlConfig;
            displayName?: string;
            canBeCreated?: boolean;
            canBeEdited?: boolean;
            canBeViewed?: boolean;
            valueExpression?: StaticOrDynamic<object>;
        };
    };
    overrideSortFields?: {
        [key: string]: SortConfig;
    };
    overrideFilterFields?: {
        [key: string]: FilterConfig;
    };
    overrideListFields?: {
        [key: string]: DisplayFieldConfig;
    };
    overrideCreateFields?: {
        [key: string]: FieldConfig;
    };
    overrideUpdateFields?: {
        [key: string]: FieldConfig;
    };
    overrideViewFields?: {
        [key: string]: DisplayFieldConfig;
    };
    viewInclude?: StaticOrDynamic<object>;
    listInclude?: StaticOrDynamic<object>;
};
export type GenerateUiSchemaOptions = {
    ui?: AdminUIConfig;
    defaultConfig?: DefaultModelConfig;
    excludeModels?: string[];
    models?: {
        [key: string]: DefaultModelConfig;
    };
    additionalModels?: {
        [key: string]: EntityUIConfig;
    };
};
export declare function generateUiSchema(metadata: PrismaMetadata, options: GenerateUiSchemaOptions): EntityUIMetaConfig;
