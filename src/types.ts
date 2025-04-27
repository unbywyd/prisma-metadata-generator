export type PrismaFieldType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Enum'
  | 'Relation';

export interface PrismaField {
  name: string;
  type: PrismaFieldType;
  isFloat: boolean;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isEnum: boolean;
  referencedModel?: string;
  documentation?: string;
  defaultValue?: any;
  enumValues?: string[];
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  documentation?: string;
}

export interface PrismaMetadata {
  models: PrismaModel[];
  enums: Record<string, string[]>;
}

/*
*  UI Metadata
*/

export type ControlType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor' | 'file' | 'image';

export type StaticOrDynamic<T> = T | string; // Важно: для select, include, whereDynamicExpression

export interface FormControlConfig {
  // Название поля
  name: string;
  type: ControlType;
  options?: Array<{ name: string; value: any }>;
  default?: any;
  validation?: Record<string, any>; // AJV валидация
  config?: Record<string, any>; // конфигурация для контрола
  relation?: {
    model: string;
    labelField: string;
    valueField: string;
  };
  valueExpression?: string; // выражение для вычисления значения
  multi?: boolean;
  isRequired?: boolean | string; // если true, то поле будет обязательным, если строка, то JEXL выражение
  isDisabled?: boolean | string; // если true, то поле будет отключено, если строка, то JEXL выражение
  isHidden?: boolean | string; // если true, то поле будет скрыто, если строка, то JEXL выражение
}

export interface DisplayFieldConfig {
  // Название поля
  name: string;
  field?: string; // поле в модели (если указано будет использоваться вместо displayExpression)
  displayExpression?: string; // выражение для отображения поля
}

export interface FilterConfig {
  // Название фильтра
  name: string;
  isHidden: boolean;
  isActive: boolean;
  controls?: FormControlConfig[];
  whereExpression?: StaticOrDynamic<object>;
}

export interface SortConfig {
  // Название сортировки
  name: string;
  // Поле для сортировки
  field: string;
  // Направление сортировки по умолчанию
  defaultDirection?: 'asc' | 'desc';
  // Скрыть сортировку
  isHidden?: boolean;
  // Активная сортировка
  isActive?: boolean;
}

export interface FieldConfig {
  // Название фильтра
  name: string;
  // Поле в модели
  field: string;
  // Разрешить создание
  allowCreate?: boolean | string;
  // Разрешить обновление
  allowUpdate?: boolean | string;
  // Контролы для поля
  controls?: FormControlConfig[];
  // Выражение для вычисления, должен вернуть Partial<Model['data']> (на клиенте)
  computeExpression?: string;
}

export interface EntityUIConfig {
  name: string;
  pluralName: string;
  model: string;
  // Список полей для отображения в списке
  listFields: DisplayFieldConfig[];
  // Список фильтров для списка
  listFilters?: FilterConfig[];
  listSorts?: SortConfig[];

  canBeCreated?: boolean;
  canBeDeleted?: boolean;
  canBeEdited?: boolean;
  canBeViewed?: boolean;

  createFields?: FieldConfig[];
  updateFields?: FieldConfig[];
  viewFields?: DisplayFieldConfig[];

  viewSelect?: StaticOrDynamic<object>;
  viewInclude?: StaticOrDynamic<object>;
  listSelect?: StaticOrDynamic<object>;
  listInclude?: StaticOrDynamic<object>;
}

export type EntityUIMetaConfig = Record<string, EntityUIConfig>;


export interface UIMetaConfig {
  ui: EntityUIMetaConfig;
  metadata: PrismaMetadata;
}

