import { withPayload } from '@payloadcms/next/withPayload'
import { withPlausibleProxy } from 'next-plausible'
import redirects from './redirects.js'
import headers from './headers.js'

/** @type {import('next').NextConfig} */

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const nextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  experimental: {
    viewTransition: true,
  },
  trailingSlash: false,
  compress: true,
  reactStrictMode: false,
  headers,
  redirects,
}

export default withPayload(
  withPlausibleProxy({
    customDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_HOST,
  })(nextConfig),
)
