import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PoetryTransitionProviders } from './PoetryTransitionProviders'
import PoetrySidebar from './PoetrySidebar'

const queryAllPoems = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0,
      limit: 0,
      overrideAccess: false,
      sort: 'title',
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })
    return poems.docs
  } catch (error) {
    console.error('Error fetching poems for layout:', error)
    return []
  }
})

export default async function PoetryLayout({ children }: { children: React.ReactNode }) {
  const poems = await queryAllPoems()

  return (
    <PoetryTransitionProviders>
      <div className="container mx-auto py-8 pt-16 md:pt-24">
        <div className="flex flex-col md:flex-row gap-8">
          <PoetrySidebar poems={poems} />
          {/* This div is the target for animations defined in PoetryTransitionProviders */}
          <div id="poetry-page-content-wrapper" className="w-full md:w-3/4 lg:w-4/5">
            {children} {/* Actual page content from [slug]/page.tsx etc. */}
          </div>
        </div>
      </div>
    </PoetryTransitionProviders>
  )
}
