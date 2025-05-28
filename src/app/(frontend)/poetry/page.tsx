// src/app/(frontend)/poetry/page.tsx

import type { Metadata } from 'next/types'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Page as PageType } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'

const queryPoetryIntroPage = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  try {
    const pageResult = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: slug,
        },
        _status: {
          equals: 'published',
        },
      },
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    return pageResult.docs?.[0] || null
  } catch (error) {
    console.error(`Error fetching page with slug ${slug}:`, error)
    return null
  }
})

export const dynamic = 'force-static' // Or 'auto' if content changes often and isn't covered by revalidation
export const revalidate = 600 // Or your preferred revalidation time

export default async function PoetryIndexPage() {
  const introPageSlug = 'poetry'
  const poetryIntroPage: PageType | null = await queryPoetryIntroPage(introPageSlug)

  if (poetryIntroPage && poetryIntroPage.layout) {
    return (
      <div>
        {poetryIntroPage.displayTitle ? (
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            {poetryIntroPage.displayTitle}
          </h1>
        ) : poetryIntroPage.title ? (
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            {poetryIntroPage.title}
          </h1>
        ) : (
          <h1>Poetry</h1>
        )}
        <RenderBlocks blocks={poetryIntroPage.layout} />
      </div>
    )
  }

  // Fallback content if the specific page isn't found or has no layout
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div>
        <h1>Poetry</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">Welcome to my poetry collection.</p>
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  // Fetch metadata from the specific "poetry" page if it exists
  const introPageSlug = 'poetry'
  const poetryIntroPage: PageType | null = await queryPoetryIntroPage(introPageSlug)

  if (poetryIntroPage) {
    return {
      title: `${poetryIntroPage.meta?.title || poetryIntroPage.title || 'Poetry'} | Heath Johnston`,
      description:
        poetryIntroPage.meta?.description ||
        'An introduction to the poetry collection of Heath Johnston.',
      // Add other meta tags from poetryIntroPage.meta as needed
    }
  }

  // Fallback metadata
  return {
    title: `Poetry Collection | Heath Johnston`,
    description: 'An archive of poems by Heath Johnston.',
  }
}
