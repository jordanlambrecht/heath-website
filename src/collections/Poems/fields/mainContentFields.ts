//src/collections/Poems/fields/mainContentFields.ts

import type { Field } from 'payload'
import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  HorizontalRuleFeature,
  BlocksFeature,
} from '@payloadcms/richtext-lexical'
import { MediaBlock } from '@/blocks/MediaBlock/config'

export const mainContentFields: Field[] = [
  {
    name: 'heroImage',
    type: 'upload',
    relationTo: 'media',
  },
  {
    name: 'content',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          BlocksFeature({ blocks: [MediaBlock] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
        ]
      },
    }),
    label: false,
    required: true,
  },
]
