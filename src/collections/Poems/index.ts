// src/collections/Poems/index.ts

import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '@/access'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidatePoem, revalidateDelete } from './hooks/revalidatePoem'
import { slugField } from '@/fields'
import { mainContentFields, detailsFields, analysisFields, seoFields } from './fields'

export const Poems: CollectionConfig = {
  slug: 'poems',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    id: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Main Content',
          fields: mainContentFields,
        },

        {
          label: 'Analysis',
          fields: analysisFields,
        },
        {
          label: 'Meta',
          fields: seoFields,
        },
        {
          label: 'Comments',
          fields: [
            {
              name: 'adminComments',
              type: 'ui',
              admin: {
                position: 'main',
                components: {
                  Field: {
                    path: '@/components/Admin/PoemCommentsTab',
                  },
                },
              },
            },
          ],
        },
      ],
    },
    ...detailsFields,
    // Number of likes for the poem; incremented by a public endpoint
    {
      name: 'likes',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: false,
        description: 'Count of user likes. Incremented via site interactions.',
      },
      min: 0,
    },
    ...slugField('title', {}, [
      { name: 'heroImage', sourceType: 'media-alt' },
      { name: 'content', sourceType: 'lexical-plain-text' },
    ]),
    // Reverse relationship: allow admin to see comments associated with a poem
    {
      name: 'comments',
      type: 'relationship',
      // payload collection slug typing is dynamic here; allow the cast locally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'comments' as any,
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Comments for this poem (managed automatically)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidatePoem],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 30 * 1000, // 30 seconds
      },
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
}
