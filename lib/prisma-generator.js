import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { promises as fs } from 'fs';
import path from 'path';
import { emptyDir, pathExists } from 'fsesm';
import { loadPrismaSchema } from './prisma-schema-loader.js';
import { generateUiSchema } from './generate-ui-schema.js';
export * from './types.js';
// Функция для определения, является ли поле внешним ключом
function isForeignKey(field, model) {
    // Если поле является частью relationFromFields в каком-либо поле модели
    return model.fields.some(f => f.kind === 'object' &&
        f.relationFromFields?.includes(field.name));
}
const enums = {};
// Функция для преобразования типа поля Prisma в наш тип
function convertFieldType(field) {
    if (field.type === 'Float' || field.type === 'Decimal') {
        return 'Float';
    }
    if (field.type === 'Int' || field.type === 'BigInt') {
        return 'Integer';
    }
    if (field.type == 'Boolean') {
        return 'Boolean';
    }
    if (field.type == 'Json') {
        return 'Json';
    }
    if (field.type == 'Bytes') {
        return 'String';
    }
    if (field.type == 'DateTime') {
        return 'DateTime';
    }
    if (field.kind == 'enum') {
        return 'Enum';
    }
    if (field.relationName) {
        return 'Relation';
    }
    return 'String';
}
// Функция для преобразования поля Prisma в наш формат
function convertField(field, model, allModels) {
    /*
    referencedFieldName?: string;
    referencedFieldIsList?: boolean;
    */
    const relationModel = allModels.find(m => m.name === field.type);
    const referencedField = relationModel?.fields.find(f => f.relationName === field.relationName);
    const result = {
        name: field.name,
        type: convertFieldType(field),
        enum: field.kind === 'enum' ? field.type : undefined,
        isList: field.isList,
        isRequired: field.isRequired && !field.hasDefaultValue && !field.isUpdatedAt && !field.isGenerated && !field.isList,
        referencedFieldName: referencedField?.name,
        referencedFieldIsList: referencedField?.isList,
        isId: field.isId,
        referencedModel: field.relationName ? field.type : undefined,
        documentation: field.documentation,
        defaultValue: field.default,
        isNullable: field.isRequired ? false : true
    };
    return result;
}
// Функция для преобразования модели Prisma в наш формат
function convertModel(model, allModels) {
    // Фильтруем внешние ключи и преобразуем поля
    const fields = model.fields
        .filter(field => !isForeignKey(field, model))
        .map(field => convertField(field, model, allModels));
    return {
        name: model.name,
        fields,
        documentation: model.documentation
    };
}
export async function generate(options) {
    let prismaLoaded = null;
    try {
        prismaLoaded = await loadPrismaSchema(options.cwd || process.cwd(), options.schemaPath);
    }
    catch (e) {
        console.error(e);
        return;
    }
    const prismaPath = prismaLoaded.path;
    const prismaCWD = path.dirname(prismaPath);
    const outputDir = path.resolve(prismaCWD, options.output || 'metadata');
    await emptyDir(outputDir);
    let config = {
        defaultConfig: {},
        models: {},
        excludeModels: [],
        additionalModels: {}
    };
    const configFilePath = path.resolve(prismaCWD, 'metadata-ui-config.json');
    if (!await pathExists(configFilePath)) {
        console.warn('⚠️ Config file not found at ' + configFilePath + ', using default configuration');
    }
    else {
        try {
            config = JSON.parse(await fs.readFile(configFilePath, 'utf8'));
        }
        catch (e) {
            console.error('⚠️ Error parsing config file at ' + configFilePath + ', using default configuration');
        }
    }
    const prismaClientDmmf = await getDMMF({
        datamodel: prismaLoaded.schema,
    });
    // Собираем все enum'ы
    prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
        enums[enumItem.name] = enumItem.values?.map((value) => value.name) || [];
    });
    const allModels = prismaClientDmmf.datamodel.models;
    // Преобразуем модели
    const models = allModels.map(model => convertModel(model, allModels));
    // Формируем финальный объект метаданных
    const metadata = {
        models,
        enums
    };
    const uiConfig = generateUiSchema(metadata, config);
    const uiAdminConfig = {
        apiUrl: 'http://localhost:3000/api',
        logoUrl: 'https://placehold.co/150',
        title: 'Dashboard',
        description: 'Dashboard',
        language: 'en',
        ...config.ui || {}
    };
    const output = {
        metadata,
        ui: {
            models: uiConfig,
            ...uiAdminConfig
        }
    };
    try {
        await fs.writeFile(path.resolve(outputDir, 'ui-config.json'), JSON.stringify(output, null, 2));
    }
    catch (e) {
        console.error('⚠️ Error generating ui config', e);
    }
}
//# sourceMappingURL=prisma-generator.js.map