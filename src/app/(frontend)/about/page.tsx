import type { Metadata } from 'next'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'

import type { Page as PageType } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks' // Assuming RenderBlocks is in this path
import { generateMeta } from '@/utilities/generateMeta' // Assuming generateMeta is in this path

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
      // Ensure we only fetch published pages if not in draft mode
      ...(!draft && { _status: { equals: 'published' } }),
    },
    depth: 1, // Adjust depth as needed for linked resources in blocks
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft, // Allows access to drafts if draft mode is enabled
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
            <h1>About Heath Johnston</h1>
            <p>
              Welcome to the about page. Content for this section is managed through the CMS. If
              you're seeing this message, it means the specific "about" page has not been created or
              published yet.
            </p>
            <p>
              Heath Johnston is a writer and poet. More information will be available here soon.
            </p>
            {/* You can add more default content or a call to action here */}
          </div>
        </div>
      </article>
    )
  }

  const { layout, title } = page // Destructure title if you want to use it

  return (
    <article className="pt-16 pb-24 bg-background text-text">
      <div className="container">
        {/* Example of using the page title from CMS if it exists */}
        {/* <h1 className="text-4xl font-bold text-primary mb-8">{title}</h1> */}
      </div>
      {/* Render page blocks */}
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page: PageType | null = await queryAboutPage()

  if (!page) {
    // Fallback metadata if page is not found
    return {
      title: 'About Heath Johnston',
      description: 'Learn more about the poet Heath Johnston. Content coming soon.',
    }
  }
  return generateMeta({ doc: page })
}
