import type { Metadata } from 'next'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

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
    },
    depth: 1, // Adjust depth as needed for linked resources in blocks
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft, // Allow access to drafts if draft mode is enabled
  })

  return result.docs?.[0] || null
})

export default async function AboutPage() {
  const page: PageType | null = await queryAboutPage()

  if (!page) {
    return notFound() // Or render a default "About" content if page not found
  }

  const { layout } = page

  return (
    <article className="pt-16 pb-24 bg-background text-text">
      <div className="container">
        {/* For example: */}
        {/* <h1 className="text-4xl font-bold text-primary mb-8">{page.title}</h1> */}
      </div>
      {/* Render page blocks */}
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page: PageType | null = await queryAboutPage()

  if (!page) {
    return {
      title: 'About Heath Johnston',
      description: 'Learn more about the poet Heath Johnston.',
    }
  }
  return generateMeta({ doc: page })
}
