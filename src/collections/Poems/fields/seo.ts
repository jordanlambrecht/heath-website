// src/collections/Poems/fields/seo.ts

import type { Field } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const seoFields: Field[] = [
  {
    name: 'meta',
    type: 'group',
    fields: [
      OverviewField({
        titlePath: 'meta.title',
        descriptionPath: 'meta.description',
        imagePath: 'meta.image',
      }),
      MetaTitleField({
        hasGenerateFn: true,
      }),
      MetaImageField({
        relationTo: 'media',
      }),

      MetaDescriptionField({}),
      PreviewField({
        // if the `generateUrl` function is configured
        hasGenerateFn: true,

        // field paths to match the target field for data
        titlePath: 'meta.title',
        descriptionPath: 'meta.description',
      }),
    ],
    admin: {
      description:
        'SEO metadata for the poem, used for search engines, the title at the top of the browser tab, and social media.',
    },
  },
]
