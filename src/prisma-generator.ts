import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { promises as fs } from 'fs';
import path from 'path';
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { emptyDir, pathExists, readPackageJson } from 'fsesm';
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
  const referenceCanBeChanged = (field?.isList && (referencedField?.isList || !referencedField?.isRequired)) || (!field?.isList);
  const result: PrismaField = {
    name: field.name,
    type: convertFieldType(field),
    enum: field.kind === 'enum' ? field.type : undefined,
    isList: field.isList,
    isRequired: field.isRequired && !field.hasDefaultValue && !field.isUpdatedAt && !field.isGenerated && !field.isList,
    referencedFieldName: referencedField?.name,
    referencedFieldIsList: referencedField?.isList,
    referenceCanBeChanged: referenceCanBeChanged,
    isId: field.isId,
    referencedModel: field.relationName ? field.type : undefined,
    documentation: field.documentation,
    defaultValue: field.default,
    isNullable: field.isRequired ? false : true
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


export async function init(options: GeneratorOptions) {
  let prismaLoaded = null;
  try {
    prismaLoaded = await loadPrismaSchema(options.cwd || process.cwd(), options.schemaPath);
  } catch (e) {
    console.error(e);
    return;
  }

  const prismaCWD = path.dirname(prismaLoaded.path);
  const configFilePath = path.resolve(prismaCWD, 'metadata-ui-config.json');

  // Check if config file already exists
  if (await pathExists(configFilePath)) {
    console.warn('⚠️ Config file already exists at ' + configFilePath);
    return;
  }

  let data: Record<string, any> = {};
  try {
    data = await readPackageJson({
      cwd: process.cwd()
    });
  } catch (e) {
    console.error(e);
    return;
  }

  const defaultConfig: GenerateUiSchemaOptions = {
    metrics: [],
    autoMetricModels: [],
    apiUrl: "http://localhost:3100",
    logoUrl: "https://placehold.co/150",
    projectName: data?.name || "Dashboard",
    language: "English",
    description: data?.description || "Admin UI of Dashboard",
    defaultModelConfig: {
      excludeUpdateFields: [
        "id",
        "updatedAt"
      ],
      fileUploadFields: [],
      imageUploadFields: [],
      videoUploadFields: [],
      audioUploadFields: [],
      documentUploadFields: [],
      mediaUploadFields: [],
      assetUploadFields: [],
      editorFields: [],
      addressFields: [],
      textareaFields: [
        "content",
        "message",
        "description"
      ]
    },
    autoTopModels: [],
    topModels: [],
    excludeMenuModels: [],
    models: [],
    excludeModels: [],
    additionalModels: [],
  };

  try {
    await fs.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Configuration file created successfully at ' + configFilePath);
  } catch (e) {
    console.error('⚠️ Error creating config file:', e);
  }
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
    defaultModelConfig: {},
    models: [],
    excludeModels: [],
    additionalModels: []
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
  const models = allModels.map(model => convertModel(model, allModels));

  const metadata: PrismaMetadata = {
    models,
    enums
  };
  const { models: uiConfig, metrics, topModels } = generateUiSchema(metadata, config);

  const uiAdminConfig: AdminUIConfig = {
    apiUrl: 'http://localhost:3100',
    logoUrl: 'https://placehold.co/150',
    projectName: 'Dashboard',
    description: 'Admin UI of Dashboard',
    language: 'en',
    ...config || {}
  }

  const output: UIMetaConfig = {
    metadata,
    ui: {
      ...uiAdminConfig,
      models: uiConfig,
      topModels: topModels,
      metrics: metrics,
    }
  };
  try {
    await fs.writeFile(path.resolve(outputDir, 'ui-config.json'), JSON.stringify(output, null, 2));
  } catch (e) {
    console.error('⚠️ Error generating ui config', e);
  }
}
