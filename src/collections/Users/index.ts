import type { CollectionConfig, User } from 'payload'

import { authenticated } from '@/access/authenticated'
import { getServerSideURL } from '@/utilities/getURL'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['avatar', 'name', 'email'], // 'avatar' will now use the custom cell
    useAsTitle: 'name',
  },
  auth: {
    maxLoginAttempts: 4,
    lockTime: 600 * 1000,
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: true,
    },
    verify: {
      generateEmailSubject: (args) => {
        const user = args?.user as User
        if (!user || !user.email) {
          return 'Verify your email'
        }
        return `Hey ${user.name}, verify your email!`
      },
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000, // 1 hour
      generateEmailSubject: (args) => {
        const user = args?.user as User
        if (!user || !user.email) {
          return 'Password Reset Request'
        }
        return `Hey ${user.name}, reset your password!`
      },
      generateEmailHTML: (args) => {
        if (!args || !args.token || !args.user) {
          console.error('Missing token or user for password reset email generation', args)
          return '<p>Could not generate password reset email. Please try again.</p>'
        }

        const { token, user } = args as { token: string; user: User }

        const serverURL = getServerSideURL() || 'http://localhost:3000'
        const resetPasswordURL = `${serverURL}/reset-password?token=${token}`

        return `
          <!doctype html>
          <html>
            <body>
              <h1>Password Reset</h1>
              <p>Hello, ${user.email || 'User'}!</p>
              <p>Click the link below to reset your password for your account.</p>
              <p>
                <a href="${resetPasswordURL}">${resetPasswordURL}</a>
              </p>
              <p>If you did not request a password reset, please ignore this email.</p>
            </body>
          </html>
        `
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      type: 'upload',
      name: 'avatar',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload a profile picture for the user.',
      },
    },
  ],
  timestamps: true,
}
