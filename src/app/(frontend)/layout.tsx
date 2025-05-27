import type { Metadata } from 'next'
import './globals.css'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Figtree } from 'next/font/google'
import PlausibleProvider from 'next-plausible'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { SiteHeader } from '@/components/SiteHeader'
import { NewFooter } from '@/components/Footer'

import { getServerSideURL } from '@/utilities/getURL'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
})
const plausibleConfig = {
  domain: process.env.NEXT_PUBLIC_PLAUSIBLE_SITE_ID || 'localhost',
  trackOutboundLinks: true,
  trackLocalhost: process.env.NODE_ENV !== 'production',
  selfHosted: true,
  taggedEvents: true,
  trackFileDownloads: true,
  customDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_HOST,
  enabled: !!process.env.NEXT_PUBLIC_PLAUSIBLE_SITE_ID,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider {...plausibleConfig}>
      <html
        className={cn(GeistSans.variable, GeistMono.variable, figtree.variable)}
        lang="en"
        suppressHydrationWarning
      >
        <head>
          <InitTheme />
          <link href="/media/favicon.png" rel="icon" sizes="160x160" />
        </head>
        <body className="bg-background text-text flex flex-col min-h-screen antialiased">
          <Providers>
            <SiteHeader />
            <main className="grow pt-8 pb-16">{children}</main>
            <NewFooter />
          </Providers>
        </body>
      </html>
    </PlausibleProvider>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
