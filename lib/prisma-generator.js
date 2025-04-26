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
    switch (field.type) {
        case 'Int':
        case 'BigInt':
        case 'Float':
        case 'Decimal':
            return 'Number';
        case 'String':
        case 'DateTime':
        case 'Json':
            return field.type;
        case 'Bytes':
            return 'String';
        default:
            // Для enum и relation типов
            return field.kind === 'enum' ? 'Enum' : 'Relation';
    }
}
// Функция для преобразования поля Prisma в наш формат
function convertField(field, model) {
    const result = {
        name: field.name,
        type: convertFieldType(field),
        isFloat: field.type === 'Float' || field.type === 'Decimal',
        isList: field.isList,
        isRequired: field.isRequired,
        referencedModel: field.type,
        documentation: field.documentation,
        defaultValue: field.default,
        enumValues: field.kind === 'enum' ? enums[field.type] : undefined
    };
    return result;
}
// Функция для преобразования модели Prisma в наш формат
function convertModel(model) {
    // Фильтруем внешние ключи и преобразуем поля
    const fields = model.fields
        .filter(field => !isForeignKey(field, model))
        .map(field => convertField(field, model));
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
    // Преобразуем модели
    const models = prismaClientDmmf.datamodel.models.map(convertModel);
    // Формируем финальный объект метаданных
    const metadata = {
        models,
        enums
    };
    const uiConfig = generateUiSchema(metadata, config);
    const output = {
        metadata,
        ui: uiConfig
    };
    try {
        await fs.writeFile(path.resolve(outputDir, 'ui-config.json'), JSON.stringify(output, null, 2));
    }
    catch (e) {
        console.error('⚠️ Error generating ui config', e);
    }
}
//# sourceMappingURL=prisma-generator.js.map