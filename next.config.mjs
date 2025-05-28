import { withPayload } from '@payloadcms/next/withPayload'
import { withPlausibleProxy } from 'next-plausible'
import redirects from './redirects.js'
import headers from './headers.js'

/** @type {import('next').NextConfig} */

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
    minimumCacheTTL: 31536000,
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost**',
      },
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
