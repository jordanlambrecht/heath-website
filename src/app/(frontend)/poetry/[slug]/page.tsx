import type { Metadata } from 'next'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Poem as PoemType } from '@/payload-types'
import RichText from '@/components/RichText'
import { generateMeta } from '@/utilities/generateMeta'
import Link from 'next/link'
import { formatRelativeDate } from '@/utilities/formatDate' // Import the new utility

type PoemPageProps = {
  params: Promise<{ slug: string }> // Changed params to be a Promise
}

// Cache individual poem data
const queryPoemBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'poems',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 1, // Adjust depth if you have related fields like author to populate
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
    })
    return result.docs?.[0] || null
  } catch (error) {
    console.error(`Error fetching poem with slug ${slug}:`, error)
    return null
  }
})

// Function to get all published poems for navigation (slugs and titles)
// Ensure sort order is consistent with the list in PoetryLayout
const queryAllPublishedPoemsForNav = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0,
      limit: 0, // Fetch all
      sort: 'title', // IMPORTANT: Must match sort order in PoetryLayout's queryAllPoems
      where: {
        _status: {
          equals: 'published', // Only navigate between published poems
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
    console.error('Error fetching all published poems for navigation:', error)
    return []
  }
})

export default async function PoemPage({ params: paramsPromise }: PoemPageProps) {
  // Renamed params to paramsPromise
  const { slug } = await paramsPromise // Await the paramsPromise
  const poem: PoemType | null = await queryPoemBySlug(slug)
  const allPublishedPoems = await queryAllPublishedPoemsForNav()

  if (!poem) {
    return notFound()
  }

  let currentIndex = -1
  if (allPublishedPoems && allPublishedPoems.length > 0) {
    currentIndex = allPublishedPoems.findIndex((p) => p.slug === slug)
  }

  const prevPoem = currentIndex > 0 ? allPublishedPoems[currentIndex - 1] : null
  const nextPoem =
    currentIndex !== -1 && currentIndex < allPublishedPoems.length - 1
      ? allPublishedPoems[currentIndex + 1]
      : null

  return (
    <div className="md:ml-24 md:max-w-2xl container">
      {/* Next/Previous Poem Navigation */}
      {(prevPoem || nextPoem) && (
        <nav className="mt-12 flex justify-between items-center border-t border-gray-200 dark:border-slate-700 pt-6 pb-8">
          <div>
            {prevPoem && (
              <Link
                href={`/poetry/${prevPoem.slug}`}
                className="text-secondary hover:text-primary transition-colors duration-200 ease-in-out group"
              >
                <span className="inline-block transition-transform group-hover:-translate-x-1 motion-reduce:transform-none">
                  &larr;
                </span>{' '}
                Previous
                <span className="block text-xs text-text/70 group-hover:text-primary/90 truncate max-w-xs">
                  {prevPoem.title}
                </span>
              </Link>
            )}
          </div>
          <div>
            {nextPoem && (
              <Link
                href={`/poetry/${nextPoem.slug}`}
                className="text-secondary hover:text-primary transition-colors duration-200 ease-in-out group text-right"
              >
                Next{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  &rarr;
                </span>
                <span className="block text-xs text-text/70 group-hover:text-primary/90 truncate max-w-xs">
                  {nextPoem.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
      <article className="prose dark:prose-invert bg-softer rounded-xl py-8 px-6 text-text border-2 border-foreground">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{poem.title}</h1>
        {poem.publishedDate && (
          <div className="inline-block rounded bg-background py-1 px-2 my-2 ">
            <p className="text-sm text-text py-0 my-0">
              Written {formatRelativeDate(poem.publishedDate)}
            </p>
          </div>
        )}
        {poem.content && <RichText data={poem.content} />}
      </article>
    </div>
  )
}

export async function generateMetadata({
  params: paramsPromise,
}: PoemPageProps): Promise<Metadata> {
  // Renamed params to paramsPromise
  const { slug } = await paramsPromise // Await the paramsPromise
  const poem: PoemType | null = await queryPoemBySlug(slug)

  if (!poem) {
    return {
      title: 'Poem Not Found',
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: poem as any }) // Cast as any if generateMeta expects a PageType
}

// Generate static paths for all poems
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const poems = await payload.find({
    collection: 'poems',
    depth: 0,
    limit: 0,
    where: {
      _status: {
        equals: 'published',
      },
    },
    overrideAccess: false, // Important for build time
    select: { slug: true },
  })
  return poems.docs.map(({ slug }) => ({ slug }))
}
