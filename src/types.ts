export type PrismaFieldType =
  | 'String'
  | 'Integer'
  | 'Float'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Enum'
  | 'Relation';

export interface PrismaField {
  name: string;
  type: PrismaFieldType;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isEnum: boolean;
  referencedModel?: string;
  referencedFieldName?: string;
  referencedFieldIsList?: boolean;
  documentation?: string;
  defaultValue?: any;
  isNullable: boolean;
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

export type ControlType = 'text' | 'integer' | 'float' | 'json' | 'select' | 'checkbox' | 'date' | 'relation' | 'editor';

export type StaticOrDynamic<T> = T | string; // Важно: для select, include, whereDynamicExpression

export interface FormControlConfig {
  // Название поля
  name: string;
  displayName: string;
  description?: string;
  type: ControlType;
  options?: Array<{ name: string; value: any }>;
  default?: any;
  defaultExpression?: string; // выражение для вычисления значения по умолчанию
  validation?: Record<string, any>; // AJV валидация
  config?: Record<string, any>; // конфигурация для контрола
  relation?: {
    model: string;
    labelField: string;
    valueField: string;
  };
  isNullable: boolean;
  isMulti?: boolean;
  isRequired?: boolean | string; // если true, то поле будет обязательным, если строка, то JEXL выражение
  isDisabled?: boolean | string; // если true, то поле будет отключено, если строка, то JEXL выражение
  isHidden?: boolean | string; // если true, то поле будет скрыто, если строка, то JEXL выражение
}

export interface DisplayFieldConfig {
  // Название поля
  name: string;
  displayName: string;
  accessExpression?: string; // выражение для проверки доступности поля
  className?: string;
  customRender?: string;
  field?: string; // поле в модели (если указано будет использоваться вместо displayExpression)
  displayExpression?: string; // выражение для отображения поля
  isListHidden?: boolean;
}

export interface FilterConfig {
  // Название фильтра
  name: string;
  displayName: string;
  isHidden: boolean;
  isActive: boolean;
  field?: string; // Или базовый фильтр к БД
  control?: FormControlConfig; // Или кастомный фильтр
  valueExpression?: StaticOrDynamic<object>; // выражение для вычисления значения
}

export interface SortConfig {
  // Название сортировки
  name: string;
  displayName: string;
  // Поле для сортировки
  field?: string;
  // Выражение для сортировки
  expression: string;
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
  displayName: string;
  // Поле в модели куда восстанавливать значение
  field: string;
  // Контролы для поля
  control: FormControlConfig;
}

export interface EntityUIConfig {
  name: string;
  pluralName: string;
  displayField: string;
  displayFieldExpression?: string;

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

  viewInclude?: StaticOrDynamic<object>;
  listInclude?: StaticOrDynamic<object>;
}

export type EntityUIMetaConfig = Record<string, EntityUIConfig>;

export type AdminUIConfig = {
  apiUrl: string;
  logoUrl?: string;
  title?: string;
  description?: string;
  language?: string;
}
export type UIMetaConfig = {
  ui: {
    models: EntityUIMetaConfig;
  } & AdminUIConfig;
  metadata: PrismaMetadata;
}

