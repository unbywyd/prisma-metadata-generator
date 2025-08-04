# Practical Guide to metadata-ui-config.json Configuration

## Introduction

The Prisma Metadata Generator creates JSON configuration for an admin panel based on a Prisma schema. The `metadata-ui-config.json` file allows you to customize and override the automatically generated configuration.

This admin panel is built for the Cheers application - a real-time social app that lets you meet real people in bars, pubs, and clubs, enabling instant chats to break the ice and connect face-to-face.

## Basic Configuration Structure

```json
{
  "apiUrl": "https://cheers-api-3434.herokuapp.com",
  "logoUrl": "https://cheers-co.app/assets/512.png",
  "projectName": "Cheers",
  "description": "Cheers is a real-time social app that lets you meet real people in bars, pubs, and clubs, enabling instant 3-minute chats to break the ice and connect face-to-face.",
  "language": "English",
  "aiEnabled": false,

  "defaultModelConfig": {
    // Default settings for all models
  },

  "models": [
    // Settings for specific models
  ],

  "metrics": [
    // Dashboard metrics
  ],

  "topModels": [
    // Models for the main page
  ],

  "autoMetricModels": ["User", "Interaction", "Place"],
  "autoTopModels": ["User", "Place"],
  "excludeModels": ["Session", "DbOption"],
  "excludeMenuModels": []
}
```

## Field Type Configuration

### File Upload Fields

Configure fields as file uploaders in `defaultModelConfig` or for specific models:

```json
{
  "defaultModelConfig": {
    "fileUploadFields": [
      "mainPhotoUrl",
      "secondaryPhotoUrl",
      "photoUrl",
      "iconUrl",
      "coverUrl"
    ],
    "textareaFields": ["content", "message", "description"],
    "excludeUpdateFields": ["id", "updatedAt"]
  }
}
```

**Automatic field type detection:**

- Fields linked to `MediaReference` model → `mediaUpload`
- Fields linked to `Asset` model → `assetUpload`
- Fields with names containing "photo", "image", "icon", "cover" → `fileUpload`
- JSON fields with names starting with "address" → `address`

### Supported Field Types

The admin panel supports these field types:

- `text` - Regular text input
- `date` - Date/time picker
- `checkbox` - Boolean checkbox
- `select` - Dropdown selection (for enums)
- `float` - Numeric input with decimals
- `fileUpload` - File upload control
- `editor` - Rich text editor
- `json` - JSON editor
- `relation` - Relationship selector
- `address` - Address/location picker
- `mediaUpload` - Media file upload
- `assetUpload` - Asset file upload

## Field Display Configuration

### Automatic displayExpression

The plugin automatically generates display expressions based on field types:

- **DateTime**: `formatDate(model.fieldName, 'dd.MM.yyyy HH:mm')`
- **Integer**: `toFixedNumber(model.fieldName, 0)`
- **Float**: `toFixedNumber(model.fieldName, 2)`
- **Boolean**: `model.fieldName ? 'Yes' : 'No'` (JEXL)
- **Json**: `jsonStringify(model.fieldName)`
- **Single Relation**: `model.fieldName ? model.fieldName.name : ''` (JEXL)
- **List Relation**: `model._count ? model._count.fieldName : ''` (JEXL)

**Note:** Auto-generated expressions use Handlebars functions but don't require the `hbs:` prefix since they're created by the plugin. The prefix is only needed for custom expressions in configuration.

### Overriding Field Display

```json
{
  "models": [
    {
      "name": "User",
      "overrideListFields": {
        "createdAt": {
          "displayExpression": "formatDate(model.createdAt, 'dd.MM.yyyy')"
        },
        "fullName": {
          "displayExpression": "model.name + ' ' + (model.surname || '')"
        },
        "status": {
          "displayExpression": "model.status || 'Unknown'"
        },
        "isAdmin": {
          "displayExpression": "model.isAdmin ? '✅ Admin' : '👤 User'"
        }
      }
    }
  ]
}
```

### Expression Processing System

**Important:** The admin panel supports two expression processing modes:

1. **Default** - JEXL expressions (JavaScript-like syntax)
2. **Handlebars mode** - When adding the prefix `hbs:` or `handlebars:`

**⚠️ CRITICAL: DO NOT MIX SYNTAXES!**

**❌ WRONG - Mixing JEXL and Handlebars:**
```json
{
  "displayExpression": "model.price ? '$' + hbs:toFixedNumber(model.price, 0) : 'Not specified'"
}
```

**✅ CORRECT - Pure JEXL:**
```json
{
  "displayExpression": "model.price ? '$' + model.price : 'Not specified'"
}
```

**✅ CORRECT - Pure Handlebars:**
```json
{
  "displayExpression": "hbs:{{#if model.price}}${{toFixedNumber model.price 0}}{{else}}Not specified{{/if}}"
}
```

### Expression Modes

#### JEXL Mode (Default)

```json
{
  "displayExpression": "model.name + ' ' + (model.surname || '')",
  "displayExpression": "model.isAdmin ? '✅ Admin' : '👤 User'",
  "displayExpression": "model.addressLat && model.addressLng ? 'Located' : 'No Location'"
}
```

#### Handlebars Mode (with prefix)

```json
{
  "displayExpression": "hbs:{{formatDate model.createdAt 'dd.MM.yyyy'}}",
  "displayExpression": "handlebars:{{toFixedNumber model.addressLat 2}}",
  "displayExpression": "hbs:{{slice model.content 0 50}}"
}
```

### Available JEXL Functions and Transforms

From the real `expression.service.ts` code, these are the **exact** functions available:

**JEXL Transforms (use with `|`):**
- `value | toNumber` - Convert to number 
- `value | round(precision)` - Round with precision (default: 0)
- `value | abs` - Absolute value
- `value | toFixed(decimals)` - Number with fixed decimal places (default: 2)
- `value | toDate` - Convert string to Date object
- `value | trim` - Remove whitespace
- `value | toUpper` - Convert to uppercase
- `value | toLower` - Convert to lowercase
- `value | slice(start, end)` - Extract substring
- `value | replace(search, replacement)` - Replace all occurrences
- `value | length` - Get string/array length
- `array | join(separator)` - Join array elements (default: ', ')
- `array | includes(item)` - Check if array contains item
- `array | mapProp(property)` - Extract property from array elements
- `value | isNull` - Check if value is null
- `value | isEmpty` - Check if empty/null/empty string/empty array
- `value | toDefault(fallback)` - Return fallback if value is null/undefined
- `value | toJson` - Convert to JSON string
- `value | fromJson` - Parse JSON string to object
- `value | jsonStringify` - Convert to JSON string (same as toJson)
- `string | split(separator)` - Split string to array (default: ',')

**JEXL Functions (call directly):**
- `isEmpty(value)` - Check if empty/null/empty string/empty array
- `formatDate(date, format)` - Format date (default: 'dd.MM.yyyy HH:mm')
- `toFixedNumber(number, decimals)` - Format number with decimals (default: 0)
- `jsonStringify(obj)` - Convert to JSON string
- `jsonParse(json)` - Parse JSON string
- `fromJson(json)` - Parse JSON string (same as jsonParse)  
- `toJson(obj)` - Convert to JSON string

**Examples:**
```json
{
  "displayExpression": "model.price | toFixed(2)",
  "displayExpression": "model.name | toUpper | slice(0, 10)",
  "displayExpression": "formatDate(model.createdAt, 'dd.MM.yyyy')",
  "displayExpression": "isEmpty(model.description) ? 'No description' : model.description",
  "displayExpression": "model.tags | join(', ')",
  "displayExpression": "model.config | jsonStringify"
}
```

### Available Handlebars Helpers

**Date Operations:**

- `formatDate(date, format)` - Date formatting
  ```handlebars
  {{formatDate model.createdAt 'dd.MM.yyyy HH:mm'}}
  {{formatDate model.updatedAt 'dd.MM.yyyy'}}
  ```
- Date utility helpers (return ISO strings):
  ```handlebars
  {{now}} <!-- Current timestamp -->
  {{startOfDay}} <!-- Start of today -->
  {{endOfDay}} <!-- End of today -->
  {{startOfWeek}} <!-- Start of current week -->
  {{endOfWeek}} <!-- End of current week -->
  {{startOfMonth}} <!-- Start of current month -->
  {{endOfMonth}} <!-- End of current month -->
  {{startOfYear}} <!-- Start of current year -->
  {{endOfYear}} <!-- End of current year -->
  ```

**Number Operations:**

- `toFixedNumber(num, decimals)` - Number with fixed decimals
  ```handlebars
  {{toFixedNumber model.addressLat 2}} <!-- 123.45 -->
  {{toFixedNumber model.userRatingCount 0}} <!-- 123 -->
  ```

- `toNumber(val)` - Convert to number
- `round(val, precision)` - Round with precision (default: 0)
- `abs(val)` - Absolute value
- `toFixed(val, decimals)` - Fixed decimal places (default: 2)

**String Operations:**

- `trim(str)` - Remove whitespace
- `toUpper(str)` - Convert to uppercase  
- `toLower(str)` - Convert to lowercase
- `slice(str, start, end)` - Extract substring
- `replace(str, search, replacement)` - Replace all occurrences
- `length(val)` - Get string/array length
- `split(str, separator)` - Split string to array (default: ',')

**Array Operations:**

- `join(arr, separator)` - Join array elements (default: ', ')
- `includes(arr, item)` - Check if array contains item
- `mapProp(arr, property)` - Extract property from array elements

**JSON Operations:**

- `toJson(obj)` - Convert to JSON string
- `fromJson(json)` - Parse JSON string
- `jsonStringify(obj)` - Convert to JSON string
- `jsonParse(json)` - Parse JSON string

**Utility Operations:**

- `isEmpty(val)` - Check if empty/null/empty string/empty array
- `isNull(val)` - Check if value is null
- `toDefault(val, fallback)` - Return fallback if value is null/undefined
- `toDate(val)` - Convert string to Date object

**Comparison Helpers:**

- `eq(a, b)` - Check equality (a === b)
- `neq(a, b)` - Check inequality (a !== b)  
- `gt(a, b)` - Greater than (a > b)
- `gte(a, b)` - Greater than or equal (a >= b)
- `lt(a, b)` - Less than (a < b)
- `lte(a, b)` - Less than or equal (a <= b)
- `and(...)` - Logical AND
- `or(...)` - Logical OR
- `not(value)` - Logical NOT

**Examples:**
```handlebars
{{formatDate model.createdAt 'dd.MM.yyyy'}}
{{toFixedNumber model.price 2}}
{{#if (eq model.status 'ACTIVE')}}Active{{else}}Inactive{{/if}}
{{#if (and model.name model.email)}}Complete{{else}}Incomplete{{/if}}
{{#if (gt model.count 0)}}Has items{{else}}Empty{{/if}}
{{toUpper (slice model.name 0 10)}}
{{join model.tags ', '}}
{{jsonStringify model.metadata}}
{{#if (isEmpty model.description)}}No description{{else}}{{model.description}}{{/if}}
```

**Conditional Operators (JEXL):**

- Standard conditions: `model.field ? 'Yes' : 'No'`
- Logical operators: `&&`, `||`, `!`
- Comparisons: `==`, `!=`, `>`, `<`, `>=`, `<=`

**Arrays and Objects:**

- `model._count.fieldName` - Count of related records
- `model.relationField ? model.relationField.name : ''` - Safe relation access

### Mixed Usage Examples

```json
{
        "overrideListFields": {
        "createdAt": {
          "displayExpression": "hbs:{{formatDate model.createdAt 'dd.MM.yyyy'}}"
        },
        "rating": {
          "displayExpression": "hbs:{{toFixedNumber model.rating 1}}"
        },
        "fullName": {
          "displayExpression": "model.name + ' ' + (model.surname || '')"
        },
        "status": {
          "displayExpression": "model.status || 'Unknown'"
        },
        "content": {
          "displayExpression": "hbs:{{slice model.content 0 50}}"
        },
    "interactionsCount": {
      "displayExpression": "model._count ? model._count.interactionsFrom : 0"
    },
    "coordinates": {
      "displayExpression": "hbs:{{#if (and model.addressLat model.addressLng)}}{{toFixedNumber model.addressLat 4}}, {{toFixedNumber model.addressLng 4}}{{else}}No coordinates{{/if}}"
    }
  }
}
```

### When to Use Which Mode

**JEXL mode is suitable for:**

- Simple conditions and operations
- String concatenation
- Mathematical calculations
- Working with arrays and objects
- Basic boolean logic

**Handlebars mode is suitable for:**

- Date formatting (`formatDate`)
- Number formatting (`toFixedNumber`, `toFixed`, `round`, `abs`)
- Text operations (`slice`, `trim`, `toUpper`, `toLower`, `replace`)
- JSON operations (`jsonStringify`, `jsonParse`)
- Complex conditional templates with `{{#if}}` blocks

### ⚠️ Important: Auto-Generated vs Manual Expressions

**Auto-generated expressions** (by the plugin) use Handlebars function names **WITHOUT** the `hbs:` prefix:

```json
{
  // ✅ Auto-generated by plugin (JEXL mode, but uses Handlebars function names)
  "displayExpression": "formatDate(model.createdAt, 'dd.MM.yyyy HH:mm')",
  "displayExpression": "toFixedNumber(model.price, 2)",
  "displayExpression": "model.isActive ? 'Yes' : 'No'"
}
```

**Manual expressions** follow the mode rules:

```json
{
  // ✅ Manual JEXL mode
  "displayExpression": "formatDate(model.createdAt, 'dd.MM.yyyy')",
  
  // ✅ Manual Handlebars mode  
  "displayExpression": "hbs:{{formatDate model.createdAt 'dd.MM.yyyy'}}"
}
```

### Best Practices for Expression Syntax

**✅ DO:**
- Choose ONE syntax per expression
- Use JEXL for simple boolean conditions: `model.isActive ? 'Active' : 'Inactive'`
- Use Handlebars for formatting functions: `hbs:{{formatDate model.createdAt 'dd.MM.yyyy'}}`
- Use Handlebars for complex conditions: `hbs:{{#if model.price}}${{toFixedNumber model.price 0}}{{else}}Free{{/if}}`

**❌ DON'T:**
- Mix syntaxes in one expression: `model.price ? '$' + hbs:toFixedNumber(model.price, 0) : 'Free'`
- Use function call syntax in Handlebars: `hbs:formatDate(model.createdAt, 'dd.MM.yyyy')`
- Use Handlebars syntax without prefix: `{{formatDate model.createdAt 'dd.MM.yyyy'}}`

**Common Syntax Errors to Avoid:**
```json
// ❌ WRONG - Mixed syntax
"displayExpression": "model.status ? '✅ ' + model.status : hbs:formatDate(model.createdAt, 'dd.MM.yyyy')"

// ❌ WRONG - Function call syntax in Handlebars
"displayExpression": "hbs:formatDate(model.createdAt, 'dd.MM.yyyy')"

// ✅ CORRECT - Pure JEXL
"displayExpression": "model.status ? '✅ ' + model.status : 'No status'"

// ✅ CORRECT - Pure Handlebars
"displayExpression": "hbs:{{#if model.status}}✅ {{model.status}}{{else}}{{formatDate model.createdAt 'dd.MM.yyyy'}}{{/if}}"
```

### Expression Context

**⚠️ Important for Actions:** Context in Actions differs from other expressions!

In **regular expressions** (displayExpression, valueExpression, etc.) available:

- **`model`** - Current model/record
- **`user`** - Current user (added through ExpressionService)
- **`dates`** - Date utilities object with ISO string values:
  - `dates.now` - Current timestamp as ISO string (e.g., "2024-01-15T10:30:00.000Z")
  - `dates.startOfDay` - Start of current day as ISO string
  - `dates.endOfDay` - End of current day as ISO string  
  - `dates.startOfWeek` - Start of current week as ISO string (Monday)
  - `dates.endOfWeek` - End of current week as ISO string
  - `dates.startOfMonth` - Start of current month as ISO string
  - `dates.endOfMonth` - End of current month as ISO string
  - `dates.startOfYear` - Start of current year as ISO string
  - `dates.endOfYear` - End of current year as ISO string

In **Actions** the context is limited - see "Context in Actions" section below.

## Field Management in Tables and Forms

You can control which fields appear in different contexts: list tables, create forms, edit forms, and detail views.

### Global Field Configuration (applies to all models)

```json
{
  "defaultModelConfig": {
    "excludeListFields": ["password", "firebaseToken", "salt"],
    "excludeCreateFields": ["id", "createdAt", "updatedAt"],
    "excludeUpdateFields": ["id", "updatedAt"],
    "excludeViewFields": ["password", "salt"],
    "excludeFields": ["internalId", "deletedAt"]
  }
}
```

**Field exclusion options:**
- `excludeListFields` - Hide from list/table view
- `excludeCreateFields` - Hide from create form
- `excludeUpdateFields` - Hide from edit form  
- `excludeViewFields` - Hide from detail view
- `excludeFields` - Hide everywhere (list, forms, views)

### Model-Specific Field Configuration

```json
{
  "models": [
    {
      "name": "User",
      // ⚠️ LEGACY: Hide specific fields in list view only
      // "hiddenListFields": ["firebaseToken", "isDeleted", "deletedAt"],
      
      // Show only these fields in list (overrides auto-generated list)
      "displayListFields": ["name", "phoneNumber", "status", "isAdmin"],
      
      // ✅ NEW: Show ONLY displayListFields and hide all others
      // (makes hiddenListFields unnecessary for list view)
      "onlyDisplayListFields": true,
      
      // Exclude fields from specific contexts for this model
      "excludeListFields": ["privateData"],
      "excludeCreateFields": ["adminNotes"],
      "excludeUpdateFields": ["createdBySystem"],
      "excludeViewFields": ["temporaryToken"]
    }
  ]
}
```

### Field Priority Order

The system applies field rules in this order (later rules override earlier ones):

1. **Auto-generated fields** from Prisma schema
2. **⚡ NEW: Only display mode** (`onlyDisplayListFields: true` - shows ONLY fields from `displayListFields`)
3. **Global excludes** (`defaultModelConfig.excludeFields`)
4. **Context-specific global excludes** (`defaultModelConfig.excludeListFields`, etc.)
5. **Model-specific excludes** (`models[].excludeListFields`, etc.)
6. **Explicit display lists** (`models[].displayListFields` - force show specific fields)
7. **Hidden field lists** (`models[].hiddenListFields` - removes from display list)

### ✨ NEW: onlyDisplayListFields

**Perfect solution for "white list" approach:**

```json
{
  "models": [
    {
      "name": "User",
      "displayListFields": ["id", "name", "email", "status"],
      "onlyDisplayListFields": true
      // ✅ Will show ONLY these 4 fields, hiding ALL others automatically
    }
  ]
}
```

**Without onlyDisplayListFields:**
- `displayListFields` only forces specific fields to show (but others might still be visible)

**With onlyDisplayListFields: true:**
- Shows ONLY fields from `displayListFields`
- Ignores all other field generation rules
- Perfect for exact control over visible columns

### Adding Custom/Computed Fields (Virtual Fields)

✨ **NEW FEATURE: Virtual Fields Support**

You can now add fields that don't exist in your Prisma schema using `overrideListFields` and `overrideViewFields`:

**🔄 Old approach (still works):**
```json
{
  "models": [
    {
      "name": "User",
      "overrideListFields": {
        "fullName": {
          "displayName": "Full Name",
          "field": "fullName",
          "type": "text",
          "canBeInlineEdited": false,
          "displayExpression": "model.name + ' ' + (model.surname || '')",
          "isListHidden": false
        }
      }
    }
  ]
}
```

**✨ New approach with onlyDisplayListFields:**
```json
{
  "models": [
    {
      "name": "Property",
      "displayName": "Недвижимость",
      
      // ✅ Include virtual fields in the list
      "displayListFields": [
        "id", "name_ru", "status", "price",
        "cityName",    // Virtual field
        "brokerName"   // Virtual field  
      ],
      "onlyDisplayListFields": true,
      
      // ✅ Define virtual fields (don't exist in Prisma schema)
      "overrideListFields": {
        "cityName": {
          "displayName": "Город",
          "displayExpression": "model.city ? model.city.name_ru : 'Не указан'",
          "type": "text",
          "canBeInlineEdited": false
        },
        "brokerName": {
          "displayName": "Брокер", 
          "displayExpression": "model.broker ? model.broker.companyName : 'Не указан'",
          "type": "text",
          "canBeInlineEdited": false
        }
      },
      
      // ✅ Include related data for virtual fields
      "listInclude": {
        "city": { "select": { "id": true, "name_ru": true } },
        "broker": { "select": { "id": true, "companyName": true } }
      }
    }
  ]
}
```

**How Virtual Fields Work:**

1. **Add virtual field names** to `displayListFields`
2. **Define virtual fields** in `overrideListFields`/`overrideViewFields` 
3. **Use onlyDisplayListFields: true** for exact control
4. **Include related data** via `listInclude` if needed

**✅ Result: Virtual fields now appear in the generated UI schema!**

### Overriding Existing Fields

Modify how existing schema fields are displayed:

```json
{
  "models": [
    {
      "name": "User",
      "overrideListFields": {
        "createdAt": {
          "displayExpression": "hbs:{{formatDate model.createdAt 'dd.MM.yyyy'}}",
          "displayName": "Registration Date"
        },
        "status": {
          "displayExpression": "model.status || 'Unknown'",
          "displayName": "User Status"
        },
        "phoneNumber": {
          "displayName": "Contact Number",
          "canBeInlineEdited": true
        }
      }
    }
  ]
}
```

### Complete Example: User Table Configuration

```json
{
  "models": [
    {
      "name": "User",
      
      // Define which fields to show (replaces auto-generated list)
      "displayListFields": [
        "id", 
        "name", 
        "phoneNumber", 
        "status", 
        "isAdmin", 
        "createdAt",
        "fullName",        // Custom computed field
        "interactionCount" // Custom computed field
      ],
      
      // ✅ Show ONLY the fields above (recommended)
      "onlyDisplayListFields": true,
      
      // Add custom computed fields
      "overrideListFields": {
        "fullName": {
          "displayName": "Full Name",
          "field": "fullName",
          "type": "text",
          "canBeInlineEdited": false,
          "displayExpression": "model.name + ' ' + (model.surname || '')"
        },
        "interactionCount": {
          "displayName": "Total Interactions",
          "field": "interactionCount",
          "type": "text",
          "canBeInlineEdited": false,
          "displayExpression": "model._count ? model._count.interactionsFrom + model._count.interactionsTo : 0"
        },
        "createdAt": {
          "displayExpression": "hbs:{{formatDate model.createdAt 'dd.MM.yyyy HH:mm'}}",
          "displayName": "Registered"
        },
        "isAdmin": {
          "displayExpression": "model.isAdmin ? '✅ Admin' : '👤 User'",
          "displayName": "Role"
        }
      }
    }
  ]
}
```

This configuration will create a user table with:
- Basic fields: ID, name, phone, status
- Custom computed fields: fullName, interactionCount  
- Formatted fields: createdAt with custom date format, isAdmin with icons
- Hidden sensitive fields: firebaseToken, password

## Sorting Configuration

### Basic Sorting

The plugin automatically generates sorts with expressions like `{ fieldName: value }`.

### Overriding Sorts

```json
{
  "models": [
    {
      "name": "User",
      "defaultOrderField": "createdAt",
      "defaultOrderDirection": "desc",
      "overrideSortFields": {
        "location": {
          "name": "location",
          "displayName": "By Location",
          "expression": "{ addressLat: value }",
          "defaultDirection": "asc"
        }
      }
    }
  ]
}
```

## Filter Configuration

### Additional Filters

**Important:** `valueExpression` can be either an **object** (static conditions) or a **string with expression** (dynamic conditions).

```json
{
  "models": [
    {
      "name": "Interaction",
      "additionalListFilters": [
        {
          "name": "activeInteractions",
          "displayName": "Active Interactions",
          "field": "status",
          "isHidden": false,
          "isActive": false,
          "valueExpression": {
            "in": ["REQUESTED", "ACCEPTED"]
          }
        },
        {
          "name": "thisMonth",
          "displayName": "This Month",
          "field": "createdAt",
          "isHidden": false,
          "isActive": false,
          "valueExpression": "{ gte: dates.startOfMonth }"
        }
      ]
    }
  ]
}
```

## Dashboard Metrics

### Automatic Metrics

```json
{
  "autoMetricModels": [
    "User",
    "Interaction",
    "Place",
    "ContactRequest",
    "Report"
  ]
}
```

### Manual Metrics Configuration

**Important:** The `where` field in metrics can be either an **object** (static conditions) or a **string with expression** (dynamic conditions).

```json
{
  "metrics": [
    {
      "displayName": "Total Users",
      "modelName": "User",
      "icon": "pi pi-users"
    },
    {
      "displayName": "Active Interactions",
      "modelName": "Interaction",
      "icon": "pi pi-face-smile",
      "where": { "status": "REQUESTED" }
    },
    {
      "displayName": "Interactions Today",
      "modelName": "Interaction",
      "icon": "pi pi-flag",
      "where": "handlebars:{\"status\":{\"in\":[\"REQUESTED\",\"ACCEPTED\",\"DECLINED\"]},\"createdAt\":{\"gte\":\"{{dates.startOfDay}}\"}}"
    },
    {
      "displayName": "Pending Contact Requests",
      "modelName": "ContactRequest",
      "icon": "pi pi-address-book",
      "where": { "status": "PENDING" }
    }
  ]
}
```

## TopModels (Main Page)

### Automatic TopModels

```json
{
  "autoTopModels": ["User", "Place"]
}
```

### Manual TopModels Configuration

```json
{
  "topModels": [
    {
      "modelName": "User",
      "displayName": "Recent Users",
      "icon": "pi pi-users",
      "listFields": [
        {
          "name": "id",
          "displayName": "User ID",
          "field": "id",
          "type": "text",
          "canBeInlineEdited": false,
          "displayExpression": "model.id"
        },
        {
          "name": "name",
          "displayName": "Name",
          "field": "name",
          "type": "text",
          "canBeInlineEdited": false,
          "displayExpression": "model.name + ' ' + (model.surname || '')"
        },
        {
          "name": "status",
          "displayName": "Status",
          "field": "status",
          "type": "select",
          "canBeInlineEdited": false,
          "displayExpression": "model.status || 'Unknown'"
        }
      ]
    }
  ]
}
```

## Actions (Table Actions)

**Important:** `ListAction` is used for two types of operations in Prisma - updating and creating records!

### Action Structure

```typescript
interface ListAction {
  name: string; // Unique action name
  displayName: string; // Display name
  description?: string; // Action description (tooltip)
  icon?: string; // CSS icon class (PrimeIcons)
  fields?: FieldConfig[]; // Additional input fields
  actionExpression?: StaticOrDynamic<string>; // Expression returning data for Prisma
  successMessage?: string; // Success message
  isActiveExpression?: StaticOrDynamic<boolean>; // Button active condition
}
```

### How Actions Work

**Record Actions (updating records):**

1. `pushRecordAction` → `updateModel(modelName, id, payload)`
2. `actionExpression` is evaluated with context `{ model: recordData }`
3. Result is passed to Prisma for record update

**List Actions (creating records):**

1. `pushListAction` → `createModel(modelName, payload)`
2. `actionExpression` is evaluated with context `{ model: data || {} }`
3. Result is passed to Prisma for creating new record

**Availability Check:**

- `isActiveExpression` is evaluated with context `{ user }` (⚠️ **NO** access to `model`!)

### List Actions (creating new records)

**actionExpression context:** `{ model: data || {} }`  
**isActiveExpression context:** `{ user }`

```json
{
  "models": [
    {
      "name": "User",
      "listActions": [
        {
          "name": "createGuestUser",
          "displayName": "Create Guest User",
          "description": "Create a new guest user account",
          "icon": "pi pi-user-plus",
          "actionExpression": "{ phoneNumber: '+1234567890', name: 'Guest User', status: 'SINGLE', isAdmin: false }",
          "successMessage": "Guest user created successfully",
          "isActiveExpression": "user.isAdmin == true"
        },
        {
          "name": "createTestPlace",
          "displayName": "Create Test Place",
          "icon": "pi pi-map-marker",
          "actionExpression": "{ placeId: 'test_place_' + Date.now(), name: 'Test Place', address: 'Test Address' }",
          "successMessage": "Test place created",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    }
  ]
}
```

### Record Actions (updating existing records)

**actionExpression context:** `{ model: recordData }`  
**isActiveExpression context:** `{ user }` (⚠️ **NO** access to model!)

```json
{
  "models": [
    {
      "name": "User",
      "recordActions": [
        {
          "name": "toggleAdmin",
          "displayName": "Toggle Admin Status",
          "description": "Toggle admin privileges for this user",
          "icon": "pi pi-shield",
          "actionExpression": "{ isAdmin: !model.isAdmin, updatedAt: dates.now }",
          "successMessage": "User admin status updated",
          "isActiveExpression": "user.isAdmin == true"
        },
        {
          "name": "markDeleted",
          "displayName": "Mark as Deleted",
          "icon": "pi pi-trash",
          "actionExpression": "{ isDeleted: true, deletedAt: dates.now }",
          "successMessage": "User marked as deleted",
          "isActiveExpression": "user.isAdmin == true"
        },
        {
          "name": "updateLocation",
          "displayName": "Update Location",
          "icon": "pi pi-map-marker",
          "actionExpression": "{ addressLat: 40.7128, addressLng: -74.0060, address: 'New York, NY' }",
          "successMessage": "Location updated",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    },
    {
      "name": "Interaction",
      "recordActions": [
        {
          "name": "markExpired",
          "displayName": "Mark as Expired",
          "icon": "pi pi-clock",
          "actionExpression": "{ status: 'EXPIRED', expiredAt: dates.now }",
          "successMessage": "Interaction marked as expired",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    }
  ]
}
```

### Context in Actions

**⚠️ Important:** Different contexts for different expressions!

**actionExpression:**

- `model` - Record data (in Record Actions - full record data, in List Actions - `data || {}`)

**isActiveExpression:**

- `user` - Current user (⚠️ **NO** access to `model`!)
- Default: `'true'` (if not specified)

**Correct usage examples:**

```json
{
  // ✅ actionExpression - has model access
  "actionExpression": "{ isAdmin: !model.isAdmin, updatedAt: dates.now }",

  // ✅ isActiveExpression - only user access
  "isActiveExpression": "user.isAdmin == true",

  // ❌ WRONG - model not available in isActiveExpression
  "isActiveExpression": "model.phoneNumber && model.isAdmin",
  
  // ❌ WRONG - new Date() not available in JEXL
  "actionExpression": "{ publishedAt: new Date() }",
  
  // ❌ WRONG - dates.now is not a function
  "actionExpression": "{ publishedAt: dates.now() }"
}
```

### Types of actionExpression

**⚠️ CRITICAL: actionExpression uses JEXL syntax, NOT JavaScript!**

**❌ JavaScript syntax doesn't work:**
- `new Date()` → **ERROR**: "Token Date (identifier) unexpected"
- `Date.now()` → **ERROR**: Not available in JEXL
- `Math.floor()` → **ERROR**: Not available in JEXL

**✅ Available in JEXL actionExpression:**
- `dates.now` - Current timestamp as ISO string (replaces `new Date()`)
- `dates.startOfDay` - Start of today as ISO string
- `dates.endOfDay` - End of today as ISO string
- `dates.startOfWeek` - Start of current week as ISO string
- `dates.endOfWeek` - End of current week as ISO string  
- `dates.startOfMonth` - Start of current month as ISO string
- `dates.endOfMonth` - End of current month as ISO string
- `dates.startOfYear` - Start of current year as ISO string
- `dates.endOfYear` - End of current year as ISO string
- `Math.random()` - Random number generator
- Basic operators: `+`, `-`, `*`, `/`, `%`
- Ternary operator: `condition ? value1 : value2`
- Logical operators: `&&`, `||`, `!`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- String concatenation: `'text' + variable`

**Static objects:**

```json
{
  "actionExpression": "{ isAdmin: true, updatedAt: dates.now }",
  "actionExpression": "{ status: 'ACCEPTED', publishedAt: dates.now }"
}
```

**Your example - CORRECTED:**

```json
{
  // ❌ WRONG - causes JEXL error: "Token Date (identifier) unexpected"
  "actionExpression": "{ status: 'PUBLISHED', publishedAt: new Date(), updatedAt: new Date() }",
  
  // ✅ CORRECT - uses JEXL dates object (ISO strings)  
  "actionExpression": "{ status: 'PUBLISHED', publishedAt: dates.now, updatedAt: dates.now }",
  
  // ✅ Also CORRECT - for Handlebars mode
  "actionExpression": "hbs:{ status: 'PUBLISHED', publishedAt: '{{now}}', updatedAt: '{{now}}' }"
}
```

**Conditional expressions:**

```json
{
  "actionExpression": "{ status: model.status == 'REQUESTED' ? 'ACCEPTED' : 'DECLINED' }",
  "actionExpression": "{ isDeleted: !model.isDeleted, deletedAt: model.isDeleted ? null : dates.now }"
}
```

**Using model data and dates:**

```json
{
  "actionExpression": "{ name: model.name + ' (Updated)', updatedAt: dates.now }",
  "actionExpression": "{ publishedAt: dates.now, expiresAt: dates.endOfMonth }",
  "actionExpression": "{ processedAt: dates.now, slug: 'post-' + Math.random() }"
}
```

**Handlebars expressions:**

```json
{
  "actionExpression": "hbs:{ status: 'PROCESSED', processedAt: '{{now}}' }",
  "actionExpression": "hbs:{ expiresAt: '{{endOfMonth}}', createdAt: '{{startOfDay}}' }",
  "isActiveExpression": "user.isAdmin == true"
}
```

### Actions with Additional Fields

**Note:** The exact mechanism for passing data from additional fields to `actionExpression` requires further investigation of the client code.

```json
{
  "recordActions": [
    {
      "name": "updateDetails",
      "displayName": "Update User Details",
      "description": "Update user profile information",
      "icon": "pi pi-pencil",
      "actionExpression": "{ name: model.name, surname: model.surname, updatedAt: dates.now }",
      "successMessage": "User details updated",
      "fields": [
        {
          "name": "name",
          "displayName": "Name",
          "field": "name",
          "control": {
            "name": "name",
            "displayName": "Name",
            "type": "text",
            "isRequired": false,
            "isNullable": true
          }
        },
        {
          "name": "surname",
          "displayName": "Surname",
          "field": "surname",
          "control": {
            "name": "surname",
            "displayName": "Surname",
            "type": "text",
            "isRequired": false,
            "isNullable": true
          }
        }
      ]
    }
  ]
}
```

### Complete Action Examples

**Record Actions (updating records):**

```json
{
  "models": [
    {
      "name": "Interaction",
      "recordActions": [
        {
          "name": "acceptInteraction",
          "displayName": "Accept Interaction",
          "icon": "pi pi-check",
          "actionExpression": "{ status: 'ACCEPTED', respondedAt: dates.now }",
          "successMessage": "Interaction accepted successfully",
          "isActiveExpression": "user.isAdmin == true"
        },
        {
          "name": "declineInteraction",
          "displayName": "Decline Interaction",
          "icon": "pi pi-times",
          "actionExpression": "{ status: 'DECLINED', declinedAt: dates.now }",
          "successMessage": "Interaction declined",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    }
  ]
}
```

**List Actions (creating records):**

```json
{
  "models": [
    {
      "name": "Place",
      "listActions": [
        {
          "name": "createTestPlace",
          "displayName": "Create Test Place",
          "icon": "pi pi-plus",
          "actionExpression": "{ placeId: 'test_' + Date.now(), name: 'Test Place', address: 'Test Address' }",
          "successMessage": "Test place created",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    }
  ]
}
```

## Related Data Includes

### listInclude and viewInclude

`listInclude` and `viewInclude` can be either **objects** or **strings with expressions**.

#### Object form (static):

```json
{
  "models": [
    {
      "name": "User",
      "listInclude": {
        "_count": {
          "select": {
            "interactionsFrom": true,
            "interactionsTo": true,
            "presences": true
          }
        }
      },
      "viewInclude": {
        "interactionsFrom": {
          "include": {
            "place": {
              "select": {
                "name": true,
                "address": true
              }
            }
          }
        },
        "presences": {
          "include": {
            "place": true
          }
        }
      }
    }
  ]
}
```

#### String form (dynamic with expressions):

```json
{
  "models": [
    {
      "name": "Interaction",
      "listInclude": "{ actor: { select: { id: true, name: true } }, subject: { select: { id: true, name: true } }, place: { select: { name: true } } }",
      "viewInclude": "{ actor: true, subject: true, place: true, messages: { include: { sender: true, receiver: true } } }"
    }
  ]
}
```

**Important:** String expressions are processed at runtime through `buildExpression()` and support:

- Conditional logic based on `currentUser`
- Function calls
- JEXL expressions
- Handlebars helpers (with `hbs:` or `handlebars:` prefix)

### includeRelationFields

```json
{
  "models": [
    {
      "name": "Interaction",
      "includeRelationFields": [
        {
          "modelName": "User",
          "fields": ["id", "name", "phoneNumber", "isAdmin"]
        },
        {
          "modelName": "Place",
          "fields": ["id", "name", "address", "rating"]
        }
      ]
    }
  ]
}
```

## Form Control Overrides

```json
{
  "models": [
    {
      "name": "User",
      "overrideFields": {
        "mainPhotoUrl": {
          "control": {
            "type": "fileUpload",
            "config": {
              "maxSize": "5MB",
              "acceptedTypes": ["image/jpeg", "image/png", "image/webp"]
            }
          }
        },
        "phoneNumber": {
          "control": {
            "validation": {
              "type": "string",
              "pattern": "^\\+[1-9]\\d{1,14}$"
            }
          }
        },
        "isAdmin": {
          "control": {
            "isHidden": "user.isAdmin != true"
          }
        }
      }
    }
  ]
}
```

## Model Exclusions

```json
{
  "excludeModels": ["Session", "DbOption", "File"],
  "excludeMenuModels": ["NotificationTemplate"]
}
```

## Access Permissions

```json
{
  "models": [
    {
      "name": "User",
      "canBeCreated": true,
      "canBeDeleted": false,
      "canBeEdited": true,
      "canBeViewed": true
    },
    {
      "name": "Admin",
      "canBeCreated": true,
      "canBeDeleted": true,
      "canBeEdited": true,
      "canBeViewed": true
    }
  ]
}
```

## Practical Configuration Example

```json
{
  "apiUrl": "https://cheers-api-3333.herokuapp.com",
  "logoUrl": "https://cheers-co.app/assets/512.png",
  "projectName": "Cheers Admin",
  "description": "Admin panel for Cheers - a real-time social app",
  "language": "English",

  "defaultModelConfig": {
    "excludeCreateFields": ["id", "createdAt", "updatedAt"],
    "excludeUpdateFields": ["id", "updatedAt"],
    "fileUploadFields": ["mainPhotoUrl", "secondaryPhotoUrl", "photoUrl"],
    "textareaFields": ["content", "message", "description"]
  },

  "models": [
    {
      "name": "User",
      "displayField": "name",
      // ✅ Modern approach: show only specific fields
      "displayListFields": ["id", "name", "email", "phoneNumber", "status", "isAdmin", "createdAt"],
      "onlyDisplayListFields": true,
      "overrideListFields": {
        "status": {
          "displayExpression": "model.status || 'Unknown'"
        },
        "isAdmin": {
          "displayExpression": "model.isAdmin ? '✅ Admin' : '👤 User'"
        }
      },
      "recordActions": [
        {
          "name": "toggleAdmin",
          "displayName": "Toggle Admin",
          "icon": "pi pi-shield",
          "actionExpression": "{ isAdmin: !model.isAdmin, updatedAt: dates.now }",
          "successMessage": "Admin status updated",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    },
    {
      "name": "Interaction",
      "recordActions": [
        {
          "name": "acceptInteraction",
          "displayName": "Accept",
          "icon": "pi pi-check",
          "actionExpression": "{ status: 'ACCEPTED', respondedAt: dates.now }",
          "isActiveExpression": "user.isAdmin == true"
        }
      ]
    }
  ],

  "metrics": [
    {
      "displayName": "Total Users",
      "modelName": "User",
      "icon": "pi pi-users"
    },
    {
      "displayName": "Active Interactions",
      "modelName": "Interaction",
      "icon": "pi pi-face-smile",
      "where": { "status": "REQUESTED" }
    }
  ],

  "autoTopModels": ["User", "Place"],
  "autoMetricModels": ["User", "Interaction", "Place"],
  "excludeModels": ["Session", "DbOption", "File"],
  "excludeMenuModels": ["NotificationTemplate"]
}
```

This configuration provides a fully functional admin panel with customized fields, actions, metrics, and access permissions tailored for the Cheers application.

---

## 🎯 Quick Start: Simple Field Control

**NEW FEATURE: Want to show only specific fields?** Use the new `onlyDisplayListFields`:

```json
{
  "models": [
    {
      "name": "User",
      "displayListFields": ["id", "name", "email", "status", "isAdmin"],
      "onlyDisplayListFields": true
      // ✅ Shows ONLY these 5 fields, hides ALL others automatically
    },
    {
      "name": "Place", 
      "displayListFields": ["name", "category", "isActive", "createdAt"],
      "onlyDisplayListFields": true
      // ✅ Simple "white list" approach - no complex excludes needed!
    }
  ]
}
```

**Before this feature:**
```json
{
  "excludeListFields": ["password", "salt", "firebaseToken", "metadata", "settings", "preferences", "internalId", "deletedAt", "updatedAt", "lastLoginAt", "avatar", "address", "phoneDetails"],
  "displayListFields": ["name", "email", "status", "isAdmin"]
}
```

**Now with onlyDisplayListFields:**
```json
{
  "displayListFields": ["name", "email", "status", "isAdmin"],
  "onlyDisplayListFields": true
}
```

**100% reliable, minimal code, maximum control!** 🚀
