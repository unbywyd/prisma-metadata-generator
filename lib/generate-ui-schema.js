import pluralize from 'pluralize';
import humanizeString from 'humanize-string';
export function generateUiSchema(metadata, options) {
    function getModelConfig(modelName) {
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
    function getFieldConfig(modelName, name) {
        const modelConfig = getModelConfig(modelName);
        const overrideFields = (modelConfig.overrideFields || { default: {} });
        const defaultFieldConfig = overrideFields.default || {};
        const fieldOverride = overrideFields[name] || {};
        const fieldName = fieldOverride.name || humanizeString(name);
        return {
            name: fieldName,
            ...defaultFieldConfig,
            ...fieldOverride
        };
    }
    /**
     * Определяет тип контрола для формы на основе типа поля Prisma
     */
    function getControlType(field) {
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
    function getFieldValidation(modelName, field) {
        const validation = {};
        if (field.type === 'String') {
            validation.type = 'string';
            if (field.name.toLowerCase().includes('email')) {
                validation.format = 'email';
            }
            else if (field.name.toLowerCase().includes('url')) {
                validation.format = 'url';
            }
            else if (field.name.toLowerCase().includes('password')) {
                validation.format = 'password';
            }
        }
        else if (field.type === 'Number') {
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
    function generateFormControl(model, field) {
        const fieldConfig = getFieldConfig(model.name, field.name);
        const defaultControlOptions = fieldConfig.defaultControlOptions || {};
        const control = {
            name: defaultControlOptions?.name || fieldConfig.name,
            type: defaultControlOptions?.type || getControlType(field),
            isRequired: defaultControlOptions?.isRequired ?? field.isRequired,
            validation: defaultControlOptions?.validation || getFieldValidation(model.name, field)
        };
        if (field.type === 'Enum' && field.enumValues) {
            control.options = field.enumValues.map((value) => ({
                name: value,
                value: value
            }));
        }
        if (defaultControlOptions?.options && Array.isArray(defaultControlOptions.options)) {
            control.options = defaultControlOptions.options?.map((option) => {
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
        /*if (!control.valueExpression) {
            control.valueExpression = `value`;
        }*/
        control.multi = field.isList;
        return control;
    }
    /**
     * Решает, стоит ли показывать поле в listFields
     */
    function shouldDisplayInList(model, field) {
        // Не показываем системные поля и сложные типы в списке
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeListFields && modelConfig.excludeListFields.includes(field.name))
            return false;
        if (field.isList)
            return false;
        const includeListFields = modelConfig.includeListFields || [];
        if (field.type === 'Json' && !includeListFields.includes(field.name))
            return false;
        return true;
    }
    function shouldGenerateSort(model, field) {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeSortFields && modelConfig.excludeSortFields.includes(field.name))
            return false;
        const includeSortFields = modelConfig.includeSortFields || [];
        if (includeSortFields.includes(field.name))
            return true;
        const includeSortTypeFields = modelConfig.includeSortTypeFields || ["DateTime", "Number"];
        if (includeSortTypeFields.includes(field.type))
            return true;
        return false;
    }
    function shouldCreateField(model, field) {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeCreateFields && modelConfig.excludeCreateFields.includes(field.name))
            return false;
        return true;
    }
    function shouldUpdateField(model, field) {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeUpdateFields && modelConfig.excludeUpdateFields.includes(field.name))
            return false;
        return true;
    }
    function shouldViewField(model, field) {
        const modelConfig = getModelConfig(model.name);
        if (modelConfig.excludeViewFields && modelConfig.excludeViewFields.includes(field.name))
            return false;
        return true;
    }
    /**
     * Решает, нужно ли генерировать фильтр для поля
     */
    function shouldGenerateFilter(model, field) {
        // Генерируем фильтры только для полей, которые имеет смысл фильтровать
        const modelConfig = getModelConfig(model.name);
        const includeFilterFields = modelConfig.includeFilterFields || [];
        if (includeFilterFields.includes(field.name))
            return true;
        if (modelConfig.excludeFilterFields && modelConfig.excludeFilterFields.includes(field.name))
            return false;
        const includeFilterTypeFields = modelConfig.includeFilterTypeFields || ["Boolean", "Enum", "Number", "DateTime", "String", "Relation"];
        if (includeFilterTypeFields.includes(field.type))
            return true;
        return false;
    }
    /**
     * Генерирует DisplayField для таблицы
     */
    function generateDisplayField(model, field) {
        const fieldConfig = getFieldConfig(model.name, field.name);
        const displayField = {
            name: fieldConfig.name || humanizeString(field.name),
            field: field.name
        };
        // Добавляем displayExpression по умолчанию в зависимости от типа поля
        if (!displayField.displayExpression) {
            switch (field.type) {
                case 'DateTime':
                    displayField.displayExpression = `formatDate(model.${field.name}, 'dd.MM.yyyy HH:mm')`;
                    break;
                case 'Number':
                    if (field.isFloat) {
                        displayField.displayExpression = `toFixedNumber(model.${field.name}, 2)`;
                    }
                    else {
                        displayField.displayExpression = `toFixedNumber(model.${field.name}, 0)`;
                    }
                    break;
                case 'Boolean':
                    displayField.displayExpression = `model.${field.name} ? 'Yes' : 'No'`;
                    break;
                case 'Json':
                    displayField.displayExpression = `jsonStringify(model.${field.name})`;
                    break;
                case 'Enum':
                    displayField.displayExpression = `model.${field.name}`;
                    break;
                case 'Relation':
                    if (field.isList) {
                        displayField.displayExpression = `model.${field.name} ? model.${field.name}.map(item => item.name).join(', ') : ''`;
                    }
                    else {
                        displayField.displayExpression = `model.${field.name} ? model.${field.name}.name : ''`;
                    }
                    break;
                default:
                    displayField.displayExpression = `model.${field.name}`;
            }
        }
        const modelConfig = getModelConfig(model.name);
        const overrideListFields = modelConfig.overrideListFields || {};
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
    /**
     * Генерирует фильтр для таблицы
     */
    function generateFilter(model, field) {
        const modelConfig = getModelConfig(model.name);
        const overrideFilterFields = modelConfig.overrideFilterFields || {};
        if (overrideFilterFields[field.name]) {
            return overrideFilterFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const filter = {
            name: defaultFieldConfig.name || humanizeString(field.name),
            isHidden: false,
            isActive: false,
            controls: [generateFormControl(model, field)]
        };
        if (defaultFieldConfig.filterWhereExpression) {
            filter.whereExpression = defaultFieldConfig.filterWhereExpression;
        }
        else {
            const type = field.type;
            switch (type) {
                case 'String':
                    filter.whereExpression = `{ ${field.name}: { contains: value, mode: 'insensitive' } }`;
                    break;
                case 'Number':
                    filter.whereExpression = `{ ${field.name}: { equals: value } }`;
                    break;
                case 'Boolean':
                    filter.whereExpression = `{ ${field.name}: { equals: value } }`;
                    break;
                case 'DateTime':
                    filter.whereExpression = `{ ${field.name}: { equals: value } }`;
                    break;
                case 'Relation':
                    if (field.isList) {
                        filter.whereExpression = `{ ${field.name}: { some: { id: { equals: value } } } }`;
                    }
                    else {
                        filter.whereExpression = `{ ${field.name}: { id: { equals: value } } }`;
                    }
                    break;
                case 'Enum':
                    filter.whereExpression = `{ ${field.name}: { equals: value } }`;
                    break;
                default:
                    filter.whereExpression = `{ ${field.name}: { equals: value } }`;
                    break;
            }
        }
        return filter;
    }
    /**
     * Генерирует сортировку для таблицы
     */
    function generateSort(model, field) {
        const modelConfig = getModelConfig(model.name);
        const overrideSortFields = modelConfig.overrideSortFields || {};
        if (overrideSortFields[field.name]) {
            return overrideSortFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const defaultOrderField = modelConfig.defaultOrderField;
        const defaultOrderDirection = modelConfig.defaultOrderDirection;
        if (defaultOrderField == field.name) {
            return {
                name: defaultFieldConfig.name || `Sort by ${humanizeString(field.name)}`,
                field: field.name,
                defaultDirection: defaultOrderDirection,
                isHidden: false,
                isActive: true
            };
        }
        return {
            name: defaultFieldConfig.name || `Sort by ${humanizeString(field.name)}`,
            field: field.name,
            defaultDirection: field.type === 'DateTime' ? 'desc' : 'asc',
            isHidden: false,
            isActive: false
        };
    }
    function generateComputeExpression(field, computeExpression) {
        if (computeExpression) {
            return computeExpression;
        }
        switch (field.type) {
            case 'Relation':
                if (field.isList) {
                    return `{ ${field.name}: { set: value.map(id => ({ id })) } }`;
                }
                else {
                    return `{ ${field.name}: { connect: { id: value } } }`;
                }
            default:
                return `{ ${field.name}: value }`;
        }
    }
    /**
     * Генерирует поле формы
     */
    function generateCreateFieldConfig(model, field) {
        const modelConfig = getModelConfig(model.name);
        const overrideCreateFields = modelConfig.overrideCreateFields || {};
        if (overrideCreateFields[field.name]) {
            return overrideCreateFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const computeExpression = generateComputeExpression(field, defaultFieldConfig.createComputeExpression || defaultFieldConfig.computeExpression);
        return {
            name: defaultFieldConfig.name || humanizeString(field.name),
            field: field.name,
            controls: [generateFormControl(model, field)],
            computeExpression: computeExpression
        };
    }
    function generateUpdateFieldConfig(model, field) {
        const modelConfig = getModelConfig(model.name);
        const overrideUpdateFields = modelConfig.overrideUpdateFields || {};
        if (overrideUpdateFields[field.name]) {
            return overrideUpdateFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const computeExpression = generateComputeExpression(field, defaultFieldConfig.updateComputeExpression || defaultFieldConfig.computeExpression);
        return {
            name: defaultFieldConfig.name || humanizeString(field.name),
            field: field.name,
            controls: [generateFormControl(model, field)],
            computeExpression: computeExpression
        };
    }
    function generateViewFieldConfig(model, field) {
        const modelConfig = getModelConfig(model.name);
        const overrideViewFields = modelConfig.overrideViewFields || {};
        if (overrideViewFields[field.name]) {
            return overrideViewFields[field.name];
        }
        const defaultFieldConfig = getFieldConfig(model.name, field.name);
        const overrideListFields = modelConfig.overrideListFields || {};
        const displayField = {
            name: defaultFieldConfig.name || humanizeString(field.name),
            field: field.name
        };
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
    function generateUISchema(metadata) {
        const uiSchemas = {};
        for (const model of metadata.models) {
            if (options.excludeModels && options.excludeModels.includes(model.name))
                continue;
            const modelName = model.name;
            const pluralModelName = pluralize(modelName);
            const modelConfig = getModelConfig(modelName);
            const additionalListSortFields = modelConfig.additionalListSortFields || [];
            const excludeFields = modelConfig.excludeFields || [];
            const fields = model.fields.filter(field => !excludeFields.includes(field.name));
            const listSorts = fields
                .filter(field => shouldGenerateSort(model, field))
                .map(field => generateSort(model, field));
            const additionalListFilters = modelConfig.additionalListFilters || [];
            const listFilters = fields
                .filter(field => shouldGenerateFilter(model, field))
                .map(field => generateFilter(model, field));
            const uiSchema = {
                name: modelConfig.name || humanizeString(modelName),
                pluralName: humanizeString(modelConfig.pluralName || pluralModelName),
                model: modelName,
                listFields: fields
                    .filter(field => shouldDisplayInList(model, field))
                    .map(field => generateDisplayField(model, field)),
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
                listSelect: modelConfig.listSelect || {},
                listInclude: modelConfig.listInclude || {},
                viewSelect: modelConfig.viewSelect || {},
                viewInclude: modelConfig.viewInclude || {}
            };
            uiSchemas[modelName] = uiSchema;
        }
        return uiSchemas;
    }
    const uiSchemas = generateUISchema(metadata);
    const additionalUiSchemas = options.additionalModels || {};
    return { ...uiSchemas, ...additionalUiSchemas };
}
//# sourceMappingURL=generate-ui-schema.js.map