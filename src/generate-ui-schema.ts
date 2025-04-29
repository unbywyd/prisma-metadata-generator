import { PrismaMetadata, PrismaModel, PrismaField, EntityUIMetaConfig, StaticOrDynamic, ControlType, AdminUIConfig } from './types.js';
import { EntityUIConfig, FormControlConfig, DisplayFieldConfig, FilterConfig, SortConfig, FieldConfig } from './types.js';
import pluralize from 'pluralize';
import humanizeString from 'humanize-string';

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
            validation?: Record<string, any>;
            control?: FormControlConfig;
        },
        [key: string]: {
            displayName?: string;
            control?: FormControlConfig;
            validation?: Record<string, any>;
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

export type GenerateUiSchemaOptions = {
    ui?: AdminUIConfig;
    defaultConfig?: DefaultModelConfig;
    excludeModels?: string[];
    models?: {
        [key: string]: DefaultModelConfig;
    },
    additionalModels?: {
        [key: string]: EntityUIConfig;
    }
}


export function generateUiSchema(metadata: PrismaMetadata, options: GenerateUiSchemaOptions): EntityUIMetaConfig {

    function getModelConfig(modelName: string): DefaultModelConfig {
        const defaultConfig = options.defaultConfig || {};
        const modelConfig = options.models[modelName] || {};
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
            ...defaultConfig,
            ...modelConfig
        };
    }

    function getFieldConfig(modelName: string, name: string): Partial<FieldConfig> & {
        control?: FormControlConfig;
        validation?: Record<string, any>;
    } {
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
            name: name,
            displayName: fieldOverride.displayName || humanizeString(name),
            ...defaultFieldConfig,
            ...fieldOverride
        };
    }

    /**
     * Определяет тип контрола для формы на основе типа поля Prisma
     */
    function getControlType(field: PrismaField): 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor' | 'file' | 'image' {
        switch (field.type) {
            case 'String':
                return 'text';
            case 'Number':
                return 'number';
            case 'Boolean':
                return 'checkbox';
            case 'DateTime':
                return 'date';
            case 'Json':
                return 'editor';
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
        } else if (field.type === 'Number') {
            validation.type = 'number';
        }

        if (field.isRequired) {
            validation.required = true;
        }
        return Object.keys(validation).length > 0 ? validation : undefined;
    }

    /**
     * Генерирует базовый FormControlConfig для формы
     */
    function getEnumValues(name: string): { name: string; value: any }[] {
        const enumValues = metadata.enums[name] || [];
        return enumValues.map((value: string) => ({
            name: value,
            value: value
        }));
    }

    function generateFormControl(model: PrismaModel, field: PrismaField): FormControlConfig {
        const fieldConfig = getFieldConfig(model.name, field.name);
        const defaultControlOptions = fieldConfig.control || {} as FormControlConfig;

        const displayName = defaultControlOptions?.displayName || fieldConfig.displayName || humanizeString(field.name);
        const control: FormControlConfig = {
            name: defaultControlOptions?.name || fieldConfig.name,
            displayName: displayName,
            type: defaultControlOptions?.type || getControlType(field),
            isRequired: defaultControlOptions?.isRequired ?? field.isRequired,
            validation: defaultControlOptions?.validation || getFieldValidation(model.name, field)
        };

        if (field.type === 'Enum') {
            control.options = getEnumValues(field.type);
        }

        if (defaultControlOptions?.options && Array.isArray(defaultControlOptions.options)) {
            control.options = defaultControlOptions.options?.map((option: any) => {
                return "string" == typeof option ? { name: option, value: option } : option;
            });
        }

        if (field.type === 'Relation' && field.referencedModel) {
            control.relation = {
                model: field.referencedModel,
                labelField: 'name',
                valueField: 'id'
            };
        }
        if (defaultControlOptions?.relation && 'object' == typeof defaultControlOptions.relation) {
            control.relation = defaultControlOptions.relation;
        }
        control.multi = field.isList;

        if (!defaultControlOptions.valueExpression) {
            control.valueExpression = generateComputeExpression(field);
        }

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
        return true;
    }

    function shouldUpdateField(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeUpdateFields && modelConfig.excludeUpdateFields.includes(field.name)) return false;
        return true;
    }

    function shouldViewField(model: PrismaModel, field: PrismaField): boolean {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeViewFields && modelConfig.excludeViewFields.includes(field.name)) return false;
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
            case 'Number':
                if (field.isFloat) {
                    displayExpression = `toFixedNumber(model.${field.name}, 2)`;
                } else {
                    displayExpression = `toFixedNumber(model.${field.name}, 0)`;
                }
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
        const fieldConfig = getFieldConfig(model.name, field.name);
        const displayField: DisplayFieldConfig = {
            name: fieldConfig.name,
            displayName: fieldConfig.displayName || humanizeString(field.name),
            field: field.name
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
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
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
        const defaultFieldConfig = getFieldConfig(model.name, field.name);

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

    function generateComputeExpression(field: PrismaField): string {
        switch (field.type) {
            case 'Relation':
                if (field.isList) {
                    return `{ ${field.name}: { set: value.map(id => ({ id })) } }`;
                } else {
                    return `{ ${field.name}: { connect: { id: value } } }`;
                }
            default:
                return `{ ${field.name}: value }`;
        }
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
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        return {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            control: generateFormControl(model, field),
        };
    }

    function generateUpdateFieldConfig(model: PrismaModel, field: PrismaField): FieldConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideUpdateFields = modelConfig.overrideUpdateFields || {};
        if (overrideUpdateFields[field.name]) {
            return overrideUpdateFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        return {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name,
            control: generateFormControl(model, field),
        };
    }

    function generateViewFieldConfig(model: PrismaModel, field: PrismaField): DisplayFieldConfig {
        const modelConfig = getModelConfig(model.name);
        const overrideViewFields = modelConfig.overrideViewFields || {};
        if (overrideViewFields[field.name]) {
            return overrideViewFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const overrideListFields = modelConfig.overrideListFields || {};
        const displayField: DisplayFieldConfig = {
            name: defaultFieldConfig.name || field.name,
            displayName: defaultFieldConfig.displayName || humanizeString(field.name),
            field: field.name
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
        for (const field of relationFields) {
            if (!field.isList) {
                const relationModel = metadata.models.find(m => m.name === field.referencedModel);
                if (relationModel) {
                    const displayField = getDisplayFieldModel(relationModel);
                    include[field.name] = {
                        select: {
                            [displayField]: true,
                            id: true
                        }
                    };
                }
            } else {
                constFields.push(field.name);
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

    function generateUISchema(metadata: PrismaMetadata): Record<string, EntityUIConfig> {
        const uiSchemas: Record<string, EntityUIConfig> = {};

        for (const model of metadata.models) {
            if (options.excludeModels && options.excludeModels.includes(model.name)) continue;
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


            const uiSchema: EntityUIConfig = {
                name: modelConfig.name || humanizeString(modelName),
                displayField: displayFieldModel,
                displayFieldExpression: `model.${displayFieldModel}`,
                pluralName: humanizeString(modelConfig.pluralName || pluralModelName),
                model: modelName,

                listFields: listFields,

                listSorts: [...additionalListSortFields, ...listSorts],
                listFilters: [...additionalListFilters, ...listFilters],

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

                listInclude: modelConfig.listInclude || defaultListInclude,
                viewInclude: modelConfig.viewInclude || defaultListInclude
            };

            uiSchemas[modelName] = uiSchema;
        }

        return uiSchemas;
    }


    const uiSchemas = generateUISchema(metadata);
    const additionalUiSchemas = options.additionalModels || {};
    return { ...uiSchemas, ...additionalUiSchemas };
}
