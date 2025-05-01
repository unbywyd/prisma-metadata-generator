import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { promises as fs } from 'fs';
import path from 'path';
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { emptyDir, pathExists } from 'fsesm';
import { loadPrismaSchema } from './prisma-schema-loader.js';
import type { PrismaField, PrismaModel, PrismaMetadata, PrismaFieldType, UIMetaConfig, AdminUIConfig } from './types.js';
import { generateUiSchema, GenerateUiSchemaOptions } from './generate-ui-schema.js';
export * from './types.js';
// Функция для определения, является ли поле внешним ключом
function isForeignKey(field: PrismaDMMF.Field, model: PrismaDMMF.Model): boolean {
  // Если поле является частью relationFromFields в каком-либо поле модели
  return model.fields.some(f =>
    f.kind === 'object' &&
    f.relationFromFields?.includes(field.name)
  );
}
const enums: Record<string, string[]> = {};

// Функция для преобразования типа поля Prisma в наш тип
function convertFieldType(field: PrismaDMMF.Field): PrismaFieldType {
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
function convertField(field: PrismaDMMF.Field, model: PrismaDMMF.Model, allModels: PrismaDMMF.Model[]): PrismaField {
  /*
  referencedFieldName?: string;
  referencedFieldIsList?: boolean; 
  */
  const relationModel = allModels.find(m => m.name === field.type);
  const referencedField = relationModel?.fields.find(f => f.relationName === field.relationName);

  const result: PrismaField = {
    name: field.name,
    type: convertFieldType(field),
    isList: field.isList,
    isRequired: field.isRequired && !field.hasDefaultValue && !field.isUpdatedAt && !field.isGenerated && !field.isList,
    isEnum: field.kind === 'enum',
    referencedFieldName: referencedField?.name,
    referencedFieldIsList: referencedField?.isList,
    isId: field.isId,
    referencedModel: field.relationName ? field.type : undefined,
    documentation: field.documentation,
    defaultValue: field.default,
  }
  return result;
}

// Функция для преобразования модели Prisma в наш формат
function convertModel(model: PrismaDMMF.Model, allModels: PrismaDMMF.Model[]): PrismaModel {
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

export type PrismaMetadataGeneratorConfig = {
};

export type GeneratorOptions = {
  schemaPath?: string,
  cwd?: string,
  output?: string
}

export async function generate(options: GeneratorOptions) {
  let prismaLoaded = null;
  try {
    prismaLoaded = await loadPrismaSchema(options.cwd || process.cwd(), options.schemaPath);
  } catch (e) {
    console.error(e);
    return;
  }

  const prismaPath = prismaLoaded.path;
  const prismaCWD = path.dirname(prismaPath);
  const outputDir = path.resolve(prismaCWD, options.output || 'metadata');
  await emptyDir(outputDir);

  let config: Partial<GenerateUiSchemaOptions> = {
    defaultConfig: {},
    models: {},
    excludeModels: [],
    additionalModels: {}
  };
  const configFilePath = path.resolve(prismaCWD, 'metadata-ui-config.json');
  if (!await pathExists(configFilePath)) {
    console.warn('⚠️ Config file not found at ' + configFilePath + ', using default configuration');
  } else {
    try {
      config = JSON.parse(await fs.readFile(configFilePath, 'utf8'));
    } catch (e) {
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

  const allModels = prismaClientDmmf.datamodel.models as PrismaDMMF.Model[];
  // Преобразуем модели
  const models = allModels.map(model => convertModel(model, allModels));

  // Формируем финальный объект метаданных
  const metadata: PrismaMetadata = {
    models,
    enums
  };
  const uiConfig = generateUiSchema(metadata, config);

  const uiAdminConfig: AdminUIConfig = {
    apiUrl: 'http://localhost:3000/api',
    logoUrl: 'https://placehold.co/150',
    title: 'Dashboard',
    description: 'Dashboard',
    language: 'en',
    ...config.ui || {}
  }

  const output: UIMetaConfig = {
    metadata,
    ui: {
      models: uiConfig,
      ...uiAdminConfig
    }
  };
  try {
    await fs.writeFile(path.resolve(outputDir, 'ui-config.json'), JSON.stringify(output, null, 2));
  } catch (e) {
    console.error('⚠️ Error generating ui config', e);
  }
}
