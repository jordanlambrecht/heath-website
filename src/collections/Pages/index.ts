import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import { seoFields } from './fields/seo'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },

  defaultPopulate: {
    title: true,
    slug: true,
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
          fields: [
            {
              name: 'displayTitle',
              type: 'text',
              required: false,
              admin: {
                description:
                  'Optional title to display on the page. If not set, the main title will be used.',
              },
            },
            {
              type: 'group',

              fields: [
                {
                  name: 'layout',
                  type: 'blocks',
                  blocks: [Content, MediaBlock],
                  required: true,
                  admin: {
                    initCollapsed: true,
                  },
                },
              ],
              label: 'Page Layout',
            },
          ],
        },
        {
          label: 'Meta',
          fields: seoFields,
        },
      ],
    },

    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
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
    maxPerDoc: 50,
  },
}
