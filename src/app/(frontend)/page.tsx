import type { Metadata } from 'next'
import React, { cache } from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { ArrowRight } from 'lucide-react' // For the hover arrow

import type { Page as PageType, Poem as PoemType } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { generateMeta } from '@/utilities/generateMeta'

// Cache home page data
const queryHomePageData = cache(async () => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'home', // Assuming your homepage slug in Payload is 'home'
        },
      },
      depth: 1, // Adjust depth as needed for linked resources in blocks
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
    })
    return result.docs?.[0] || null
  } catch (error) {
    console.error('Error fetching home page data:', error)
    return null
  }
})

// Cache all poems for the list
const queryAllPoemsForHome = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0, // We only need title and slug
      limit: 0, // Fetch all poems
      sort: 'title', // Or 'publishedDate' or any other preferred order
      where: {
        _status: {
          equals: 'published', // Only show published poems on the homepage list
        },
      },
      overrideAccess: false,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })
    return poems.docs
  } catch (error) {
    console.error('Error fetching poems for homepage:', error)
    return []
  }
})

export default async function HomePage() {
  const homePageData: PageType | null = await queryHomePageData()
  const poems: PoemType[] = await queryAllPoemsForHome()

  return (
    <div className="container mx-auto">
      {/* Intro Section from "Home" Page */}
      {homePageData && homePageData.layout && (
        <section className="py-12 md:py-16">
          {/* You might want a specific title from the homePageData here if not handled by blocks */}
          {/* e.g., <h1 className="text-3xl font-bold mb-8">{homePageData.title}</h1> */}
          <RenderBlocks blocks={homePageData.layout} />
        </section>
      )}

      {/* Poem List Section */}
      {poems && poems.length > 0 && (
        <section className="py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-8 md:mb-12 text-center">
            Poetry
          </h2>
          <div className="border-l-2 border-foreground/30">
            {' '}
            {/* Container for the continuous left border effect */}
            {poems.map((poem) => (
              <Link
                href={`/poetry/${poem.slug}`}
                key={poem.id}
                className="group block relative pl-6 pr-4 py-6 hover:bg-secondary/30 transition-colors duration-200 ease-in-out border-b border-foreground/10 last:border-b-0"
              >
                <h3 className="text-xl md:text-2xl font-medium text-text group-hover:text-primary transition-colors">
                  {poem.title}
                </h3>
                <ArrowRight
                  className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Fallback if no poems */}
      {(!poems || poems.length === 0) && !homePageData && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-semibold text-primary mb-4">Welcome</h1>
          <p className="text-secondary">Content is being prepared. Please check back soon.</p>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const homePageData: PageType | null = await queryHomePageData()

  if (!homePageData) {
    return {
      title: 'Azzo Mulligan | Poet', // Default title
      description: 'The official website of Azzo Mulligan, a contemporary poet.', // Default description
    }
  }
  // Use your existing generateMeta utility if it can handle PageType
  return generateMeta({ doc: homePageData })
}
