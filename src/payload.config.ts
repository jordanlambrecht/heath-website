// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { Media, Pages, Users, Poems, Categories } from './collections'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const allowedOrigins = new Set<string>()

const serverURLFromEnv = getServerSideURL()
if (serverURLFromEnv) {
  allowedOrigins.add(serverURLFromEnv)
}
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.add('http://localhost:3000')
  allowedOrigins.add('http://localhost:3001')
}

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  // folders: {
  //   collectionOverrides: [],
  //   fieldName: 'folder',
  //   slug: 'folders',
  // },
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '',
    defaultFromName: process.env.SMTP_FROM_NAME || 'Payload',
    transportOptions: {
      secure: true,
      host: process.env.SMTP_HOST,
      port: 465,
      // logger: true,
      // debug: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  admin: {
    user: Users.slug,
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: process.env.LOCAL_PREFILL_USER,
            password: process.env.LOCAL_PREFILL_PASSWORD,
            prefillOnly: false,
          }
        : false,
    components: {
      graphics: {
        Logo: '@/components/Admin/Logo',
        Icon: '@/components/Admin/Icon',
      },
    },
    meta: {
      openGraph: {
        description: 'I love Heath Johnston',
        images: [
          {
            url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/media/favicon.png`,
            width: 160,
            height: 160,
          },
        ],
        siteName: 'Payload',
        title: 'My Admin Panel',
      },
      titleSuffix: '| Azzo Mulligan Admin',
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: '/media/favicon.png',
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  collections: [Pages, Media, Categories, Users, Poems],
  cors: Array.from(allowedOrigins).filter(Boolean),
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
