import type { Metadata } from 'next'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'

import type { Page as PageType } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { generateMeta } from '@/utilities/generateMeta'

// Fetch page data
const queryAboutPage = cache(async () => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: 'about',
      },
      ...(!draft && { _status: { equals: 'published' } }),
    },
    depth: 4,
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
  })

  return result.docs?.[0] || null
})

export default async function AboutPage() {
  const page: PageType | null = await queryAboutPage()

  if (!page) {
    // Render default "About" content if the page is not found in CMS
    return (
      <article className="pt-16 pb-24 bg-background text-text">
        <div className="container">
          <div className="prose dark:prose-invert lg:prose-xl mx-auto py-12">
            <h1>About</h1>
            <p>Coming soon...</p>
          </div>
        </div>
      </article>
    )
  }

  const { layout, title, displayTitle } = page

  return (
    <article className="pt-16 pb-24 bg-background text-text">
      <div className="container">
        <div>
          {displayTitle ? (
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">{displayTitle}</h1>
          ) : title ? (
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">{title}</h1>
          ) : (
            <h1>About</h1>
          )}
        </div>
      </div>
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page: PageType | null = await queryAboutPage()

  if (!page) {
    // Fallback metadata if page is not found
    return {
      title: 'About | Azzo Mulligan',
      description: 'Learn more about the poet Azzo Mulligan. Content coming soon.',
    }
  }
  return generateMeta({ doc: page })
}
