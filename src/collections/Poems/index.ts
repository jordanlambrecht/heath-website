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
      ],
    },
    ...detailsFields,
    ...slugField('title', {}, [
      { name: 'heroImage', sourceType: 'media-alt' },
      { name: 'content', sourceType: 'lexical-plain-text' },
    ]),
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
