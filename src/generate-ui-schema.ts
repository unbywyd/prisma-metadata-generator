import { PrismaMetadata, PrismaModel, PrismaField, EntityUIMetaConfig, StaticOrDynamic, ControlType, AdminUIConfig, IncludeRelationField } from './types.js';
import { EntityUIConfig, FormControlConfig, DisplayFieldConfig, FilterConfig, SortConfig, FieldConfig } from './types.js';
import pluralize from 'pluralize';
import humanizeString from 'humanize-string';

export type ListAction = {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    fields?: FieldConfig[];
    actionExpression?: StaticOrDynamic<string>;
    successMessage?: string;
    isActiveExpression?: StaticOrDynamic<boolean>;
}

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
        },
        [key: string]: {
            control?: FormControlConfig;
            displayName?: string;
            canBeCreated?: boolean;
            canBeEdited?: boolean;
            canBeViewed?: boolean;
            canBeInlineEdited?: boolean;
        }
    }

    overrideSortFields?: {
        [key: string]: SortConfig
    }
    overrideFilterFields?: {
        [key: string]: FilterConfig
    }
    overrideListFields?: {
        [key: string]: DisplayFieldConfig
    }
    overrideCreateFields?: {
        [key: string]: FieldConfig
    }
    overrideUpdateFields?: {
        [key: string]: FieldConfig
    }
    overrideViewFields?: {
        [key: string]: DisplayFieldConfig
    }

    viewInclude?: StaticOrDynamic<object>;
    listInclude?: StaticOrDynamic<object>;
}

export type MetricConfig = {
    icon?: string;
    displayName: string;
    modelName: string; // К какой модели делаем запрос
    where?: StaticOrDynamic<object>; // Условие для запроса
}
export type TopModelConfig = {
    modelName: string; // К какой модели делаем запрос
    displayName: string;
    icon?: string;
    listFields: DisplayFieldConfig[];
    listSorts?: SortConfig[];
    listInclude?: StaticOrDynamic<object>;
    includeRelationFields?: IncludeRelationField[];
    listFilters?: FilterConfig[];
}
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
}


export function generateUiSchema(metadata: PrismaMetadata, options: GenerateUiSchemaOptions): {
    models: EntityUIConfig[];
    metrics: MetricConfig[];
    topModels: TopModelConfig[];
} {

    function getModelConfig(modelName: string): DefaultModelConfig {
        const defaultConfig = options.defaultModelConfig || {};
        const modelConfig = options.models?.find(model => model.name == modelName) || {};
        const excludeMenu = options.excludeMenuModels?.includes(modelName) || modelConfig.excludeMenu;
        return {
            name: humanizeString(modelName),
            pluralName: humanizeString(pluralize(modelName)),
            excludeCreateFields: ["id", "createdAt", "updatedAt", "deletedAt"],
            excludeUpdateFields: ["id", "updatedAt", "createdAt"],
            canBeCreated: true,
            canBeDeleted: true,
            canBeEdited: true,
            canBeViewed: true,
            defaultOrderField: "createdAt",
            defaultOrderDirection: "desc",
            overrideFields: { default: {} },
            overrideSortFields: {},
            overrideFilterFields: {},
            overrideListFields: {},
            overrideCreateFields: {},
            overrideUpdateFields: {},
            overrideViewFields: {},
            listActions: [],
            recordActions: [],
            includeRelationFields: [],
            excludeMenu: excludeMenu,
            ...defaultConfig,
            ...modelConfig
        };
    }

    function getFieldConfig(modelName: string, field?: PrismaField): Partial<FieldConfig> & {
        control?: FormControlConfig;
        canBeCreated?: boolean;
        canBeEdited?: boolean;
        canBeViewed?: boolean;
        referenceCanBeChanged?: boolean;
        canBeInlineEdited?: boolean;
    } {
        const name = field?.name || "";
        const modelConfig = getModelConfig(modelName);

        const overrideFields = (modelConfig.overrideFields || { default: {} });
        const defaultFieldConfig = overrideFields.default || {};
        const fieldOverride = overrideFields[name] || {};

        if (fieldOverride.control || defaultFieldConfig.control) {
            fieldOverride.control = {
                ...defaultFieldConfig.control || {},
                ...fieldOverride.control || {}
            } as FormControlConfig;
        }
        return {
            referenceCanBeChanged: field?.referenceCanBeChanged,
            name: name,
            displayName: fieldOverride.displayName || humanizeString(name),
            ...defaultFieldConfig,
            canBeCreated: fieldOverride.canBeCreated,
            canBeEdited: fieldOverride.canBeEdited,
            canBeViewed: fieldOverride.canBeViewed,
            ...fieldOverride
        };
    }

    /**
     * Определяет тип контрола для формы на основе типа поля Prisma
     */
    function getControlType(modelName: string, field: PrismaField): ControlType {
        const modelConfig = getModelConfig(modelName);
        const isAddress = modelConfig.addressFields?.includes(field.name);
        const isEditor = modelConfig.editorFields?.includes(field.name);
        const isFileUpload = modelConfig.fileUploadFields?.includes(field.name);
        const isImageUpload = modelConfig.imageUploadFields?.includes(field.name);
        const isVideoUpload = modelConfig.videoUploadFields?.includes(field.name);
        const isAudioUpload = modelConfig.audioUploadFields?.includes(field.name);
        const isDocumentUpload = modelConfig.documentUploadFields?.includes(field.name);
        const isMediaUpload = (modelConfig.mediaUploadFields?.includes(field.name) && field.referencedModel == "MediaReference") || (field.referencedModel == "MediaReference" && field.type == "Relation");
        const isAssetUpload = (modelConfig.assetUploadFields?.includes(field.name) && field.referencedModel == "Asset") || (field.referencedModel == "Asset" && field.type == "Relation");

        if (isAssetUpload) {
            return 'assetUpload';
        }
        if (isEditor) {
            return 'editor';
        }
        if (isFileUpload) {
            return 'fileUpload';
        }
        if (isImageUpload) {
            return 'imageUpload';
        }
        if (isVideoUpload) {
            return 'videoUpload';
        }
        if (isAudioUpload) {
            return 'audioUpload';
        }
        if (isDocumentUpload) {
            return 'documentUpload';
        }
        if (isMediaUpload) {
            return 'mediaUpload';
        }
        if ((isAddress || field.name?.toLowerCase().startsWith("address")) && field.type == "Json") {
            return 'address';
        }
        const isTextarea = modelConfig.textareaFields?.includes(field.name);
        if (isTextarea) {
            return 'textarea';
        }

        if (field.isList && field.referencedModel) {
            return 'relation';
        }
        if (field.isList && field.type == "Json") {
            return 'json';
        }

        switch (field.type) {
            case 'String':
                return 'text';
            case 'Integer':
                return 'integer';
            case 'Float':
                return 'float';
            case 'Boolean':
                return 'checkbox';
            case 'DateTime':
                return 'date';
            case 'Json':
                return 'json';
            case 'Relation':
                return 'relation';
            case 'Enum':
                return 'select';
            default:
                return 'text';
        }
    }

    /**
     * Генерирует AJV-схему валидации для поля
     */
    function getFieldValidation(modelName: string, field: PrismaField): Record<string, any> | undefined {
        const validation: Record<string, any> = {};

        if (field.type === 'String') {
            validation.type = 'string';
            if (field.name.toLowerCase().includes('email')) {
                validation.format = 'email';
            } else if (field.name.toLowerCase().includes('url')) {
                validation.format = 'url';
            } else if (field.name.toLowerCase().includes('password')) {
                validation.format = 'password';
            }
        } else if (field.type === 'Integer') {
            validation.type = 'integer';
        } else if (field.type === 'Float') {
            validation.type = 'number';
        }
        return Object.keys(validation).length > 0 ? validation : undefined;
    }

    /**
     * Генерирует базовый FormControlConfig для формы
     */
    function getEnumValues(name: string): { label: string; value: any }[] {

        const enumValues = metadata.enums[name] || [];
        return enumValues.map((value: string) => ({
            label: humanizeString(value),
            value: value
        }));
    }

    function generateFormControl(model: PrismaModel, field: PrismaField): FormControlConfig {
        const fieldConfig = getFieldConfig(model.name, field);
        const defaultControlOptions = fieldConfig.control || {} as FormControlConfig;

        const displayName = defaultControlOptions?.displayName || fieldConfig.displayName || humanizeString(field.name);

        const control: FormControlConfig = {
            name: defaultControlOptions?.name || fieldConfig.name,
            displayName: displayName,
            type: defaultControlOptions?.type || getControlType(model.name, field),
            isRequired: defaultControlOptions?.isRequired ?? field.isRequired,
            validation: defaultControlOptions?.validation || getFieldValidation(model.name, field),
            isNullable: field.isNullable,
            aiButtonEnabled: defaultControlOptions?.aiButtonEnabled ?? false,
            aiButtonPrompt: defaultControlOptions?.aiButtonPrompt || ""
        };

        if (field.type === 'Enum') {
            control.options = getEnumValues(field.enum);
        }

        if (defaultControlOptions?.options && Array.isArray(defaultControlOptions.options) && defaultControlOptions?.options.length > 0) {
            control.options = defaultControlOptions.options?.map((option: any) => {
                return "string" == typeof option ? { name: option, value: option } : option;
            });
        }

        if (field.type === 'Relation' && field.referencedModel) {
            control.referencedModel = field.referencedModel;
        }
        if (defaultControlOptions?.referencedModel) {
            control.referencedModel = defaultControlOptions.referencedModel;
        }
        if (control.referencedModel) {
            control.relationFieldName = field.name;
        }
        control.isMulti = field.isList;

        control.default = field.defaultValue;


        return control;
    }

    /**
     * Решает, стоит ли показывать поле в listFields
     */
    function shouldDisplayInList(model: PrismaModel, field: PrismaField): boolean {
        // Не показываем системные поля и сложные типы в списке
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeListFields && modelConfig.excludeListFields.includes(field.name)) return false;
        const includeListFields = modelConfig.includeListFields || [];
        const isAddress = modelConfig.addressFields?.includes(field.name);
        if ((isAddress || field.name?.toLowerCase().startsWith("address")) && field.type == "Json") {
            return true;
        }
        if (field.type === 'Json' && !includeListFields.includes(field.name)) return false;
        return true;
    }

    function shouldGenerateSort(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeSortFields && modelConfig.excludeSortFields.includes(field.name)) return false;
        const includeSortFields = modelConfig.includeSortFields || [];
        if (includeSortFields.includes(field.name)) return true;
        const isEnum = field.type === 'Enum';
        if (isEnum) {
            return true;
        }
        if (field.referencedModel) {
            return true;
        }
        if (field.type == "Json") {
            return false;
        }
        return true;
    }

    function shouldCreateField(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeCreateFields && modelConfig.excludeCreateFields.includes(field.name)) return false;
        const fieldConfig = getFieldConfig(model.name, field);
        if (fieldConfig.canBeCreated == false) return false;
        if (!fieldConfig.referenceCanBeChanged && field.type == "Relation") return false;
        return true;
    }

    function shouldUpdateField(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeUpdateFields && modelConfig.excludeUpdateFields.includes(field.name)) return false;
        const fieldConfig = getFieldConfig(model.name, field);
        if (fieldConfig.canBeEdited == false) return false;
        if (!fieldConfig.referenceCanBeChanged && field.type == "Relation") return false;
        return true;
    }

    function shouldViewField(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeViewFields && modelConfig.excludeViewFields.includes(field.name)) return false;
        const fieldConfig = getFieldConfig(model.name, field);
        if (fieldConfig.canBeViewed == false) return false;
        return true;
    }
    /**
     * Решает, нужно ли генерировать фильтр для поля
     */
    function shouldGenerateFilter(model: PrismaModel, field: PrismaField): boolean {
        // Генерируем фильтры только для полей, которые имеет смысл фильтровать
        const modelConfig = getModelConfig(model.name);
        const includeFilterFields = modelConfig.includeFilterFields || [];
        if (includeFilterFields.includes(field.name)) return true;
        if (field.isId) return false;
        if (modelConfig.excludeFilterFields && modelConfig.excludeFilterFields.includes(field.name)) return false;
        const includeFilterTypeFields = modelConfig.includeFilterTypeFields || ["Boolean", "Enum", "Number", "DateTime", "String", "Relation"];
        if (includeFilterTypeFields.includes(field.type)) return true;

        return false;
    }

    function generateDisplayExpression(field: PrismaField): string {
        let displayExpression = `model.${field.name}`;
        switch (field.type) {
            case 'DateTime':
                displayExpression = `formatDate(model.${field.name}, 'dd.MM.yyyy HH:mm')`;
                break;
            case 'Integer':
                displayExpression = `toFixedNumber(model.${field.name}, 0)`;
                break;
            case 'Float':
                displayExpression = `toFixedNumber(model.${field.name}, 2)`;
                break;
            case 'Boolean':
                displayExpression = `model.${field.name} ? 'Yes' : 'No'`;
                break;
            case 'Json':
                displayExpression = `jsonStringify(model.${field.name})`;
                break;
            case 'Enum':
                displayExpression = `model.${field.name}`;
                break;
            case 'Relation':
                if (field.isList) {
                    displayExpression = `model._count ? model._count.${field.name}: ''`;
                } else {
                    displayExpression = `model.${field.name} ? model.${field.name}.name : ''`;
                }
                break;
            default:
                displayExpression = `model.${field.name}`;
        }
        return displayExpression;
    }

    function generateListDisplayField(model: PrismaModel, field: PrismaField): DisplayFieldConfig {
        const fieldConfig = getFieldConfig(model.name, field);
        const displayField: DisplayFieldConfig = {
            name: fieldConfig.name,
            displayName: fieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            type: fieldConfig.control?.type || getControlType(model.name, field),
            canBeInlineEdited: fieldConfig.canBeInlineEdited || false
        };

        displayField.displayExpression = generateDisplayExpression(field);
        const modelConfig = getModelConfig(model.name);
        const overrideListFields = modelConfig.overrideListFields || {};
        if (overrideListFields[field.name]) {
            if ("displayExpression" in overrideListFields[field.name]) {
                displayField.displayExpression = overrideListFields[field.name].displayExpression;
            }
            if ("name" in overrideListFields[field.name]) {
                displayField.name = overrideListFields[field.name].name;
            }
            if ("isListHidden" in overrideListFields[field.name]) {
                displayField.isListHidden = overrideListFields[field.name].isListHidden;
            }
        }
        if (modelConfig.hiddenListFields && modelConfig.hiddenListFields.includes(field.name)) {
            displayField.isListHidden = true;
        }

        const isRelation = field.type == "Relation";
        if (isRelation) {
            displayField.isListHidden = true;
        }
        if (field.isList) {
            displayField.isListHidden = true;
        }
        if (field.isId) {
            displayField.isListHidden = true;
        }
        if (field.type == "Json") {
            displayField.isListHidden = true;
        }

        const isDate = field.type == "DateTime";
        if (isDate && field.name?.toLowerCase() !== 'createdat') {
            displayField.isListHidden = true;
        }
        if (modelConfig.displayListFields && modelConfig.displayListFields.includes(field.name)) {
            displayField.isListHidden = false;
            return displayField;
        }
        return displayField;
    }


    /**
     * Генерирует фильтр для таблицы
     */
    function generateFilter(model: PrismaModel, field: PrismaField): FilterConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideFilterFields = modelConfig.overrideFilterFields || {};
        if (overrideFilterFields[field.name]) {
            return overrideFilterFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field);
        const filter: FilterConfig = {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            isHidden: false,
            isActive: false,
            field: field.name
        };
        return filter;
    }

    /**
     * Генерирует сортировку для таблицы
     */

    function generateSort(model: PrismaModel, field: PrismaField): SortConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideSortFields = modelConfig.overrideSortFields || {};
        if (overrideSortFields[field.name]) {
            return overrideSortFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field);

        const defaultOrderField = modelConfig.defaultOrderField;
        const defaultOrderDirection = modelConfig.defaultOrderDirection ?? 'asc';
        let customExpression = `{ ${field.name}: value }`;
        if (field.referencedModel) {
            if (!field.isList) {
                customExpression = `{ ${field.name}: { ${getDisplayFieldModel(field.referencedModel)}: value } }`;
            } else {
                customExpression = `{ ${field.name}: { _count: value } }`;
            }
        }

        if (defaultOrderField == field.name) {
            return {
                name: defaultFieldConfig.name || field.name,
                displayName: defaultFieldConfig.displayName || `Sort by ${humanizeString(field.name)}`,
                field: field.name,
                defaultDirection: defaultOrderDirection,
                isHidden: false,
                isActive: true,
                expression: customExpression
            };
        }
        return {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || `Sort by ${humanizeString(field.name)}`,
            field: field.name,
            defaultDirection: field.type === 'DateTime' ? 'desc' : 'asc',
            isHidden: false,
            isActive: false,
            expression: customExpression
        };
    }

    /**
     * Генерирует поле формы
     */
    function generateCreateFieldConfig(model: PrismaModel, field: PrismaField): FieldConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideCreateFields = modelConfig.overrideCreateFields || {};
        if (overrideCreateFields[field.name]) {
            return overrideCreateFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field);
        return {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            control: generateFormControl(model, field),
            //valueExpression: defaultFieldConfig.valueExpression || generateComputeExpression(field),
        };
    }

    function generateUpdateFieldConfig(model: PrismaModel, field: PrismaField): FieldConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideUpdateFields = modelConfig.overrideUpdateFields || {};
        if (overrideUpdateFields[field.name]) {
            return overrideUpdateFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field);
        return {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            control: generateFormControl(model, field),
            //valueExpression: defaultFieldConfig.valueExpression || generateComputeExpression(field),
        };
    }

    function generateViewFieldConfig(model: PrismaModel, field: PrismaField): DisplayFieldConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideViewFields = modelConfig.overrideViewFields || {};
        if (overrideViewFields[field.name]) {
            return overrideViewFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field);
        const overrideListFields = modelConfig.overrideListFields || {};
        const displayField: DisplayFieldConfig = {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            type: defaultFieldConfig.control?.type || getControlType(model.name, field),
            canBeInlineEdited: defaultFieldConfig.canBeInlineEdited || false
        };
        displayField.displayExpression = generateDisplayExpression(field);
        if (overrideListFields[field.name]) {
            if ("displayExpression" in overrideListFields[field.name]) {
                displayField.displayExpression = overrideListFields[field.name].displayExpression;
            }
            if ("name" in overrideListFields[field.name]) {
                displayField.name = overrideListFields[field.name].name;
            }
        }
        return displayField;
    }

    function getDisplayFieldModel(_model: PrismaModel | string): string {
        const model = typeof _model === 'string' ? metadata.models.find(model => model.name == _model) : _model;
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.displayField) {
            return modelConfig.displayField;
        }
        const textFields = model.fields.filter(field => field.type === 'String');
        if (!textFields.length) {
            return "id";
        }
        const priorityName = textFields.find(field => field.name?.toLowerCase().includes("name") || field.name?.toLowerCase().includes("title") || field.name?.toLowerCase().includes("label"));
        if (priorityName) {
            return priorityName.name;
        }
        return textFields[0].name;
    }

    function generateDefaultListInclude(model: PrismaModel, metadata: PrismaMetadata): Record<string, any> {
        const relationFields = model.fields.filter(field =>
            field.type === 'Relation' &&
            field.referencedModel
        );

        if (relationFields.length === 0) {
            return {};
        }
        const constFields: Array<string> = [];
        const include: Record<string, any> = {};
        const modelConfig = getModelConfig(model.name);
        const includeRelationFields = modelConfig.includeRelationFields || [];
        if (!("Asset" in includeRelationFields)) {
            includeRelationFields.push({
                modelName: "Asset",
                fields: ["id", "name", "url", "thumbnailUrl", "referenceType", "filesize", "mimetype"]
            });
        }
        if (!("MediaReference" in includeRelationFields)) {
            includeRelationFields.push({
                modelName: "MediaReference",
                fields: ["id", "media"]
            });
        }
        for (const field of relationFields) {
            const hasIncludeModel = includeRelationFields.find(m => m.modelName === field.referencedModel);
            const fields = hasIncludeModel ? hasIncludeModel.fields : [];

            if (!field.isList) {
                const relationModel = metadata.models.find(m => m.name === field.referencedModel);
                if (relationModel) {
                    const displayField = getDisplayFieldModel(relationModel);

                    let selectFields: Record<string, any> = {
                        [displayField]: true,
                        id: true
                    };
                    if (fields.length) {
                        selectFields = fields.reduce((acc: Record<string, boolean>, field) => {
                            acc[field] = true;
                            return acc;
                        }, {})
                    }

                    include[field.name] = {
                        select: {
                            id: true,
                            [displayField]: true,
                            ...selectFields,
                        }
                    }
                }
            } else {
                constFields.push(field.name);
                if (fields.length) {
                    const selectFields: Record<string, boolean> = fields.reduce((acc: Record<string, boolean>, field) => {
                        acc[field] = true;
                        return acc;
                    }, {})
                    include[field.name] = {
                        select: {
                            id: true,
                            ...selectFields,
                        }
                    }
                }
            }
        }
        if (constFields.length) {
            include._count = {
                select: constFields.reduce((acc: Record<string, boolean>, field) => {
                    acc[field] = true;
                    return acc;
                }, {})
            };
        }

        return include;
    }

    function limitVisibleColumns(fields: DisplayFieldConfig[]): DisplayFieldConfig[] {
        const visibleFields = fields.filter(field => !field.isListHidden);
        if (visibleFields.length > 5) {
            let index = 0;
            for (const field of visibleFields) {
                if (field.isListHidden == undefined && index >= 5) {
                    field.isListHidden = true;
                } else if (field.isListHidden) {
                    index++;
                }
            }
        }
        return fields;
    }

    const metrics: MetricConfig[] = options.metrics || [];
    const topModels: TopModelConfig[] = options.topModels || [];


    function generateUISchema(metadata: PrismaMetadata): EntityUIConfig[] {
        const uiSchemas: EntityUIConfig[] = [];
        const autoMetricModels = options.autoMetricModels || [];
        const autoTopModels = options.autoTopModels || [];

        for (const model of metadata.models) {
            if (options.excludeModels && options.excludeModels.includes(model.name)) continue;
            const isAutoMetric = autoMetricModels.includes(model.name);
            const isAutoTop = autoTopModels.includes(model.name);

            if (isAutoMetric) {
                const metricConfig: MetricConfig = {
                    icon: 'pi pi-chart-bar',
                    displayName: humanizeString(model.name),
                    modelName: model.name,
                    where: {}
                };
                metrics.push(metricConfig);
            }

            const modelName = model.name;
            const pluralModelName = pluralize(modelName);

            const modelConfig = getModelConfig(modelName);
            const additionalListSortFields = modelConfig.additionalListSortFields || [];
            const excludeFields = modelConfig.excludeFields || [];
            const skipFieldsWithNames = modelConfig.skipFieldsWithNames || [];
            const fields = model.fields.filter(field => !excludeFields.includes(field.name) && !skipFieldsWithNames.find(name => field.name?.toLowerCase().includes(name)));

            const listSorts = fields
                .filter(field => shouldGenerateSort(model, field))
                .map(field => generateSort(model, field));

            const additionalListFilters = modelConfig.additionalListFilters || [];
            const listFilters = fields
                .filter(field => shouldGenerateFilter(model, field))
                .map(field => generateFilter(model, field));

            const displayFieldModel = getDisplayFieldModel(model);
            const defaultListInclude = generateDefaultListInclude(model, metadata);

            const listFields = limitVisibleColumns(
                fields
                    .filter(field => shouldDisplayInList(model, field))
                    .map(field => generateListDisplayField(model, field))
            );

            let listInclude: StaticOrDynamic<object> = defaultListInclude;
            let viewInclude: StaticOrDynamic<object> = defaultListInclude;

            if (modelConfig.listInclude) {
                if ("object" == typeof modelConfig.listInclude) {
                    listInclude = {
                        ...defaultListInclude,
                        ...modelConfig.listInclude
                    };
                } else {
                    listInclude = modelConfig.listInclude;
                }
            }
            if (modelConfig.viewInclude) {
                if ("object" == typeof modelConfig.viewInclude) {
                    viewInclude = {
                        ...defaultListInclude,
                        ...modelConfig.viewInclude
                    };
                } else {
                    viewInclude = modelConfig.viewInclude;
                }
            }

            const uiSchema: EntityUIConfig = {
                name: modelName,
                displayName: modelConfig.displayName || humanizeString(modelName),
                displayField: displayFieldModel,
                pluralName: humanizeString(modelConfig.pluralName || pluralModelName),
                model: modelName,

                listFields: listFields,
                listActions: modelConfig.listActions || [],
                recordActions: modelConfig.recordActions || [],

                listSorts: [...additionalListSortFields, ...listSorts],
                listFilters: [...additionalListFilters, ...listFilters],

                excludeMenu: modelConfig.excludeMenu,

                canBeCreated: modelConfig.canBeCreated ?? true,
                canBeDeleted: modelConfig.canBeDeleted ?? true,
                canBeEdited: modelConfig.canBeEdited ?? true,
                canBeViewed: modelConfig.canBeViewed ?? true,

                createFields: fields
                    .filter(field => shouldCreateField(model, field))
                    .map(field => generateCreateFieldConfig(model, field)),

                updateFields: fields
                    .filter(field => shouldUpdateField(model, field))
                    .map(field => generateUpdateFieldConfig(model, field)),

                viewFields: fields
                    .filter(field => shouldViewField(model, field))
                    .map(field => generateViewFieldConfig(model, field)),

                listInclude: listInclude,
                viewInclude: viewInclude
            };

            if (isAutoTop) {
                const topModel: TopModelConfig = {
                    modelName: modelName,
                    displayName: humanizeString(modelName),
                    listFields: listFields,
                    listSorts: listSorts,
                    listFilters: listFilters,
                    listInclude: listInclude,
                    includeRelationFields: modelConfig.includeRelationFields || []
                }
                topModels.push(topModel);
            }

            uiSchemas.push(uiSchema);
        }

        return uiSchemas;
    }


    const uiSchemas = generateUISchema(metadata);
    const additionalUiSchemas = options.additionalModels || [];
    return {
        models: [...uiSchemas, ...additionalUiSchemas],
        metrics: metrics,
        topModels: topModels
    }
}
