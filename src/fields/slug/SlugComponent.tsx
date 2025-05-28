'use client'
import React, { useCallback, useEffect } from 'react'
import type { TextFieldClientProps } from 'payload'
import { useField, Button, TextInput, FieldLabel, useFormFields, useForm } from '@payloadcms/ui'
import { formatSlug } from './formatSlug'
import type { AdditionalSlugSource } from './index'

// Define a more specific type for Lexical data if possible, or use a broader one for now
// For a simple text extraction, this structure is a common pattern.
interface LexicalNode {
  type: string
  text?: string
  children?: LexicalNode[]
}

interface LexicalRoot {
  children: LexicalNode[]
}

interface LexicalData {
  root: LexicalRoot
}

// Define a type for media objects, focusing on the 'alt' text
interface MediaWithAlt {
  alt?: string
  // Add other properties if needed for type checking, e.g., id: string | number
}

/**
 * Extracts plain text from a Lexical data structure, traversing its nodes recursively.
 * 
 * @param {LexicalData | unknown} lexicalData - The Lexical data structure to extract text from. 
 *        Expected to have a `root` property containing an array of nodes.
 * @returns {string} A plain text string extracted from the Lexical data, truncated to 200 characters.
 * 
 * The function trims the resulting text and limits its length to 200 characters. 
 * It handles `text` nodes by appending their content, `linebreak` nodes by adding a newline, 
 * and recursively processes child nodes if present.
 */
function extractPlainTextFromLexical(lexicalData: LexicalData | unknown): string {
  let text = ''
  // Type guard to ensure lexicalData is of the expected shape
  if (
    lexicalData &&
    typeof lexicalData === 'object' &&
    'root' in lexicalData &&
    lexicalData.root &&
    typeof lexicalData.root === 'object' &&
    'children' in lexicalData.root &&
    Array.isArray((lexicalData.root as LexicalRoot).children)
  ) {
    const traverse = (nodes: LexicalNode[]) => {
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
    traverse((lexicalData.root as LexicalRoot).children)
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

  // Use a more specific type for watchedFieldValues if possible,
  // but Record<string, unknown> is safer than Record<string, any>
  const watchedFieldValues = useFormFields(([fields, _dispatch]) => {
    const values: Record<string, unknown> = {} // Use unknown instead of any
    fieldsToWatch.forEach((fieldName) => {
      // Ensure fieldName exists in fields before accessing
      if (fields[fieldName]) {
        values[fieldName] = fields[fieldName]?.value
      } else {
        values[fieldName] = undefined // Or null, depending on how you want to handle missing fields
      }
    })
    return values
  })

  const checkboxValue = useFormFields(([fields]) => {
    // Ensure checkboxFieldPath exists in fields before accessing
    if (fields[checkboxFieldPath]) {
      return fields[checkboxFieldPath]?.value as boolean | undefined
    }
    return undefined
  })

  useEffect(() => {
    if (checkboxValue === true || checkboxValue === undefined) {
      let sourceText = ''

      const primarySourceValue = watchedFieldValues[fieldToUse]
      if (typeof primarySourceValue === 'string' && primarySourceValue.trim()) {
        sourceText = primarySourceValue.trim()
      }

      if (!sourceText && additionalSources.length > 0) {
        for (const source of additionalSources) {
          const additionalFieldValue = watchedFieldValues[source.name]
          if (additionalFieldValue) {
            if (source.sourceType === 'media-alt') {
              // Type guard for media object
              if (
                typeof additionalFieldValue === 'object' &&
                additionalFieldValue !== null &&
                'alt' in additionalFieldValue && // Check if 'alt' property exists
                typeof (additionalFieldValue as MediaWithAlt).alt === 'string' &&
                (additionalFieldValue as MediaWithAlt).alt?.trim()
              ) {
                sourceText = (additionalFieldValue as MediaWithAlt).alt!.trim()
                break
              }
            } else if (source.sourceType === 'lexical-plain-text') {
              // extractPlainTextFromLexical now has a more specific input type
              const plainText = extractPlainTextFromLexical(additionalFieldValue as LexicalData)
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
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // More specific event type
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
        onChange={(e) => setValue(typeof e === 'string' ? e : e.target.value)}
        readOnly={readOnly}
      />
    </div>
  )
}

export default SlugComponent
