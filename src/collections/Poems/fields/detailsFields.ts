// src/collections/Poems/fields/detailsFields.ts
import type { Field } from 'payload'

export const detailsFields: Field[] = [
  {
    name: 'description',
    type: 'group',
    label: 'Description Settings',
    admin: {
      position: 'sidebar',
    },

    fields: [
      {
        name: 'enableDescription',
        type: 'checkbox',
        label: 'Enable Description',
        defaultValue: false,
        admin: {
          description: 'If enabled, a description will be displayed below the poem content.',
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'displayDescription',
            type: 'checkbox',
            label: 'Display Description',
            defaultValue: false,
            admin: {
              description: 'This will append the description to the top/bottom of the poem.',
              condition: (data, siblingData) => Boolean(siblingData?.enableDescription),
            },
          },

          {
            name: 'descriptionLocation',
            type: 'radio',
            options: [
              { label: 'Top', value: 'top' },
              { label: 'Bottom', value: 'bottom' },
            ],
            defaultValue: 'top',
            admin: {
              layout: 'horizontal',
              condition: (data, siblingData) =>
                Boolean(siblingData?.displayDescription && siblingData?.enableDescription),
            },
          },
        ],
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        admin: {
          condition: (data, siblingData) => Boolean(siblingData?.enableDescription),
        },
      },
    ],
  },
  {
    name: 'publishedAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      date: {
        pickerAppearance: 'dayAndTime',
      },
      // position: 'sidebar', // This field is already within a sidebar group
    },
    hooks: {
      beforeChange: [
        ({ siblingData, value }) => {
          if (siblingData?._status === 'published' && !value) {
            return new Date()
          }
          return value
        },
      ],
    },
  },
  {
    name: 'categories',
    type: 'relationship',
    admin: {
      position: 'sidebar',
    },
    hasMany: true,
    relationTo: 'categories',
  },
]
