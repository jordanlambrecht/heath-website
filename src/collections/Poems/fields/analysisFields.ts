// src/collections/Poems/fields/analysisFields.ts
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

export const analysisFields: Field[] = [
  {
    name: 'analysis',
    type: 'group',
    label: 'Analysis',
    admin: {
      description: 'Analysis of the poem, including themes, structure, and literary devices.',
    },
    fields: [
      {
        name: 'enable',
        type: 'checkbox',
        label: 'Enable Analysis',
        defaultValue: false,
      },
      {
        type: 'group',
        name: 'display',
        label: 'Display Options',
        admin: {
          condition: (data, siblingData) => Boolean(siblingData?.enable), // Condition for the whole display group
        },
        fields: [
          {
            name: 'displayAnalysis',
            type: 'checkbox',
            label: 'Display Analysis',
            admin: {
              description: 'If enabled, the analysis will be displayed live on the poem page.',
            },
            defaultValue: false,
          },
          {
            name: 'displayTitle',
            type: 'checkbox',
            label: 'Display Analysis Title',
            defaultValue: true,
            admin: {
              description:
                'If enabled, the analysis title will be displayed above the analysis text.',
              condition: (data, siblingData) => Boolean(siblingData?.displayAnalysis),
            },
          },
          {
            name: 'analysisLocation',
            type: 'radio',
            options: [
              { label: 'Top', value: 'top' },
              { label: 'Bottom', value: 'bottom' },
            ],
            defaultValue: 'bottom',
            admin: {
              description: 'Where to display the analysis in relation to the poem content.',
              condition: (data, siblingData) => Boolean(siblingData?.displayAnalysis),
            },
          },
          {
            name: 'treatAsSpoiler',
            type: 'checkbox',
            label: 'Mark as Spoiler',
            defaultValue: false,
            admin: {
              description:
                'If enabled, the analysis will be treated as a spoiler and hidden by default. A user will need to click to reveal it.',
              condition: (data, siblingData) => Boolean(siblingData?.displayAnalysis),
            },
          },
        ],
      },
      {
        name: 'analysisTitle',
        type: 'text',
        // required: false, // Not typically required if analysis is optional
        label: 'Analysis Title',
        defaultValue: 'Analysis',
        admin: {
          description: 'Title for the analysis section. (Optional)',
          condition: (data, siblingData) => Boolean(siblingData?.enable),
        },
      },
      {
        name: 'analysisText',
        type: 'richText',
        label: 'Analysis Content',
        editor: lexicalEditor({
          features: ({ rootFeatures }) => {
            return [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              FixedToolbarFeature(),
              BlocksFeature({ blocks: [MediaBlock] }),
              InlineToolbarFeature(),
              HorizontalRuleFeature(),
            ]
          },
        }),
        // required: true, // Make this conditionally required
        admin: {
          condition: (data, siblingData) => Boolean(siblingData?.enable),
        },
        validate: (value, { siblingData }) => {
          if (siblingData?.enable && !value) {
            // Check if 'enable' is at the correct siblingData level
            return 'Analysis text is required when analysis is enabled.'
          }
          return true
        },
      },
    ],
  },
]
