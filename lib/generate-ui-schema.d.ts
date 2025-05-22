import { PrismaMetadata, StaticOrDynamic, IncludeRelationField } from './types.js';
import { EntityUIConfig, FormControlConfig, DisplayFieldConfig, FilterConfig, SortConfig, FieldConfig } from './types.js';
export type ListAction = {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    fields?: FieldConfig[];
    actionExpression?: StaticOrDynamic<string>;
    successMessage?: string;
    isActiveExpression?: StaticOrDynamic<boolean>;
};
export type DefaultModelConfig = {
    name?: string;
    displayName?: string;
    pluralName?: string;
    displayField?: string;
    excludeMenu?: boolean;
    excludeListFields?: string[];
    includeListFields?: string[];
    includeRelationFields?: IncludeRelationField[];
    listActions?: ListAction[];
    recordActions?: ListAction[];
    skipFieldsWithNames?: string[];
    addressFields?: string[];
    editorFields?: string[];
    textareaFields?: string[];
    fileUploadFields?: string[];
    imageUploadFields?: string[];
    videoUploadFields?: string[];
    audioUploadFields?: string[];
    documentUploadFields?: string[];
    mediaUploadFields?: string[];
    assetUploadFields?: string[];
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
            canBeInlineEdited?: boolean;
        };
        [key: string]: {
            control?: FormControlConfig;
            displayName?: string;
            canBeCreated?: boolean;
            canBeEdited?: boolean;
            canBeViewed?: boolean;
            canBeInlineEdited?: boolean;
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
export type MetricConfig = {
    icon?: string;
    displayName: string;
    modelName: string;
    where?: StaticOrDynamic<object>;
};
export type TopModelConfig = {
    modelName: string;
    displayName: string;
    icon?: string;
    listFields: DisplayFieldConfig[];
    listSorts?: SortConfig[];
    listInclude?: StaticOrDynamic<object>;
    includeRelationFields?: IncludeRelationField[];
    listFilters?: FilterConfig[];
};
export type GenerateUiSchemaOptions = {
    apiUrl?: string;
    logoUrl?: string;
    projectName?: string;
    description?: string;
    language?: string;
    aiEnabled?: boolean;
    defaultModelConfig?: DefaultModelConfig;
    excludeModels?: string[];
    models?: DefaultModelConfig[];
    metrics?: MetricConfig[];
    additionalModels?: EntityUIConfig[];
    topModels?: TopModelConfig[];
    autoMetricModels?: string[];
    autoTopModels?: string[];
    excludeMenuModels?: string[];
};
export declare function generateUiSchema(metadata: PrismaMetadata, options: GenerateUiSchemaOptions): {
    models: EntityUIConfig[];
    metrics: MetricConfig[];
    topModels: TopModelConfig[];
};
