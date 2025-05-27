import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { Plugin } from 'payload'
import { GenerateURL } from '@payloadcms/plugin-seo/types'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { Page, Poem } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// const generateURL: GenerateURL<Poem | Page> = ({
//   doc,
//   collectionConfig, // Add collectionConfig to the destructured arguments
// }) => {
//   const baseUrl = getServerSideURL()
//   if (doc?.slug && collectionConfig?.slug) {
//     // Construct the URL with the collection slug and document slug
//     return `${baseUrl}/${collectionConfig.slug}/${doc.slug}`
//   }
//   return baseUrl // Fallback to base URL if slugs are missing
// }

export const plugins: Plugin[] = [
  vercelBlobStorage({
    enabled: true,
    collections: {
      media: true,
    },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  // seoPlugin({
  //   collections: ['poems', 'pages'],
  //   uploadsCollection: 'media',
  //   tabbedUI: true,
  //   generateTitle: ({ doc }) => `${doc.title} | Azzo Mulligan`,
  //   generateURL,
  //   generateDescription: ({ doc }) => doc.description,
  // }),
  redirectsPlugin({
    collections: ['poems', 'pages'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
    },
    hooks: {
      afterChange: [revalidateRedirects],
    },
    redirectTypes: ['301', '302'],
    redirectTypeFieldOverride: {
      label: 'Redirect Type (Overridden)',
    },
  }),
]
