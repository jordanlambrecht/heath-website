import type { Metadata } from 'next'
import './globals.css'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Figtree } from 'next/font/google' // Import Figtree
import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { SiteHeader } from '@/components/SiteHeader' // Import the new SiteHeader
import { NewFooter } from '@/components/Footer' // Import NewFooter

import { getServerSideURL } from '@/utilities/getURL'

// Instantiate Figtree
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree', // Define a CSS variable
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, figtree.variable)} // Add figtree variable
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="bg-background text-text flex flex-col min-h-screen">
        <Providers>
          <SiteHeader /> {/* Use the new SiteHeader here */}
          <main className="grow pt-8 pb-16">{children}</main>{' '}
          {/* Added some padding to main */}
          <NewFooter />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
