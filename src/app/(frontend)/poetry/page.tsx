import type { Metadata } from 'next/types'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'

// Cache the first poem's slug
const queryFirstPoemSlug = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0,
      limit: 1, // Only need the first one
      sort: 'title', // Or 'publishedDate' or any other preferred order
      where: {
        _status: {
          // Ensure we only consider published poems for this redirect
          equals: 'published',
        },
      },
      overrideAccess: false, // Explicitly use default access control (respect _status)
      select: { slug: true },
    })
    return poems.docs?.[0]?.slug || null
  } catch (error) {
    console.error('Error fetching first published poem slug:', error)
    return null
  }
})

export const dynamic = 'force-static'
export const revalidate = 600 // Or your preferred revalidation time

export default async function PoetryIndexPage() {
  const firstPoemSlug = await queryFirstPoemSlug()

  if (firstPoemSlug) {
    redirect(`/poetry/${firstPoemSlug}`)
  }

  // This content will be shown on the right side if no poems exist or if redirection fails
  return (
    <div className="flex items-center justify-center h-full text-center p-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary mb-4">
          Welcome to the Poetry Collection
        </h1>
        <p className="text-secondary">
          {firstPoemSlug === null && 'No poems have been published yet.'}
          {firstPoemSlug !== null &&
            'Please select a poem from the list on the left to begin reading.'}
        </p>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Poetry Collection | Heath Johnston`,
    description: 'An archive of poems by Heath Johnston.',
  }
}
