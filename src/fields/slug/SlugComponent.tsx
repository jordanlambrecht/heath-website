'use client'
import React, { useCallback, useEffect } from 'react'
import type { TextFieldClientProps } from 'payload'
import { useField, Button, TextInput, FieldLabel, useFormFields, useForm } from '@payloadcms/ui'
import { formatSlug } from './formatSlug'
import type { AdditionalSlugSource } from './index'
function extractPlainTextFromLexical(lexicalData: any): string {
  let text = ''
  if (lexicalData && lexicalData.root && lexicalData.root.children) {
    const traverse = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'text' && node.text) {
          text += node.text + ' '
        } else if (node.type === 'linebreak') {
          text += '\n'
        }
        if (node.children) {
          traverse(node.children)
        }
      }
    }
    traverse(lexicalData.root.children)
  }
  return text.trim().substring(0, 200)
}

type SlugComponentProps = {
  fieldToUse: string
  additionalSources?: AdditionalSlugSource[]
  checkboxFieldPath: string
} & TextFieldClientProps

export const SlugComponent: React.FC<SlugComponentProps> = ({
  field,
  fieldToUse,
  additionalSources = [],
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field

  const checkboxFieldPath = path?.includes('.')
    ? `${path.substring(0, path.lastIndexOf('.') + 1)}${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps

  const { value, setValue } = useField<string>({ path: path || field.name })
  const { dispatchFields } = useForm()

  const fieldsToWatch = [fieldToUse, ...additionalSources.map((s) => s.name)]

  const watchedFieldValues = useFormFields(([fields, dispatch]) => {
    const values: Record<string, any> = {}
    fieldsToWatch.forEach((fieldName) => {
      values[fieldName] = fields[fieldName]?.value
    })
    return values
  })

  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as boolean | undefined
  })

  useEffect(() => {
    // Only auto-generate if the slug is "locked" (checkboxValue is true or undefined initially)
    if (checkboxValue === true || checkboxValue === undefined) {
      let sourceText = ''

      // 1. Try primary fieldToUse
      const primarySourceValue = watchedFieldValues[fieldToUse]
      if (typeof primarySourceValue === 'string' && primarySourceValue.trim()) {
        sourceText = primarySourceValue.trim()
      }

      // 2. If primary source is empty, try additionalSources
      if (!sourceText && additionalSources.length > 0) {
        for (const source of additionalSources) {
          const additionalFieldValue = watchedFieldValues[source.name]
          if (additionalFieldValue) {
            if (source.sourceType === 'media-alt') {
              // Assuming additionalFieldValue is a populated media object or its ID
              if (
                typeof additionalFieldValue === 'object' &&
                additionalFieldValue !== null &&
                typeof (additionalFieldValue as any).alt === 'string' &&
                (additionalFieldValue as any).alt.trim()
              ) {
                sourceText = (additionalFieldValue as any).alt.trim()
                break
              }
              // If it's an ID, we can't get 'alt' here without another fetch.
            } else if (source.sourceType === 'lexical-plain-text') {
              const plainText = extractPlainTextFromLexical(additionalFieldValue)
              if (plainText) {
                sourceText = plainText
                break
              }
            }
          }
        }
      }

      const newSlug = sourceText ? formatSlug(sourceText) : ''
      if (value !== newSlug) {
        setValue(newSlug)
      }
    }
  }, [watchedFieldValues, checkboxValue, fieldToUse, additionalSources, setValue, value])

  const handleLock = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault()
      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: !(checkboxValue === true),
      })
    },
    [checkboxValue, checkboxFieldPath, dispatchFields],
  )

  const readOnly = readOnlyFromProps || checkboxValue === true || checkboxValue === undefined

  return (
    <div className="field-type slug slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path || field.name}`} label={label || 'Slug'} />
        <Button
          className="lock-button"
          buttonStyle="none"
          onClick={handleLock}
          tooltip={readOnly ? 'Unlock to edit manually' : 'Lock to auto-generate'}
        >
          {readOnly ? 'Unlock' : 'Lock'}
        </Button>
      </div>
      <TextInput
        path={path || field.name}
        value={value || ''}
        onChange={(e) => setValue(typeof e === 'string' ? e : e.target.value)} // Ensure value is string
        readOnly={readOnly}
      />
    </div>
  )
}

export default SlugComponent
