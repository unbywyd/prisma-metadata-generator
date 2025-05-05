import { PrismaMetadata, EntityUIMetaConfig, StaticOrDynamic, AdminUIConfig, IncludeRelationField } from './types.js';
import { EntityUIConfig, FormControlConfig, DisplayFieldConfig, FilterConfig, SortConfig, FieldConfig } from './types.js';
export type ListAction = {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    fields?: FieldConfig[];
    actionExpression?: string;
    successMessage?: string;
    isActiveExpression?: string;
};
export type DefaultModelConfig = {
    name?: string;
    pluralName?: string;
    displayField?: string;
    excludeListFields?: string[];
    includeListFields?: string[];
    includeRelationFields?: IncludeRelationField[];
    listActions?: ListAction[];
    recordActions?: ListAction[];
    skipFieldsWithNames?: string[];
    addressFields?: string[];
    editorFields?: string[];
    textareaFields?: string[];
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
