import type { CheckboxField, TextField, TextFieldSingleValidation } from 'payload'
import { formatSlugHook } from './formatSlug'

type Overrides = {
  slugOverrides?: Partial<
    Omit<TextField, 'hasMany' | 'maxRows' | 'minRows' | 'type'> & {
      type?: 'text'
      validate?: TextFieldSingleValidation
    }
  >
  checkboxOverrides?: Partial<CheckboxField>
}

export type AdditionalSlugSourceType = 'media-alt' | 'lexical-plain-text'
export interface AdditionalSlugSource {
  name: string
  sourceType: AdditionalSlugSourceType
}

type Slug = (
  fieldToUse?: string,
  overrides?: Overrides,
  additionalSources?: AdditionalSlugSource[],
) => [TextField, CheckboxField]

export const slugField: Slug = (fieldToUse = 'title', overrides = {}, additionalSources = []) => {
  const { slugOverrides, checkboxOverrides } = overrides

  const checkBoxField: CheckboxField = {
    name: 'slugLock',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      hidden: true,
      position: 'sidebar',
    },
    ...checkboxOverrides,
  }

  const {
    admin: slugAdminOverrides,
    hooks: slugHooksOverrides,
    validate: providedValidate,
    ...restOfSlugOverrides
  } = slugOverrides || {}

  const slugFieldDefinition: TextField = {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    label: 'Slug',
    ...restOfSlugOverrides,
    hasMany: false,
    maxRows: undefined,
    minRows: undefined,
    hooks: {
      beforeValidate: [formatSlugHook(fieldToUse)],
      ...(slugHooksOverrides || {}),
    },
    admin: {
      position: 'sidebar',
      // ...(slugAdminOverrides || {}),
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent',
          clientProps: {
            fieldToUse,
            additionalSources,
            checkboxFieldPath: checkBoxField.name,
          },
        },
      },
    },

    validate: providedValidate as TextFieldSingleValidation | undefined,
  }

  return [slugFieldDefinition, checkBoxField]
}
