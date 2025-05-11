import React, { cache } from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Poem } from '@/payload-types' // Assuming 'Poem' is the generated type for your poems collection
import { notFound } from 'next/navigation'
import { PoemContentAnimator } from './PoemContentAnimator' // Import the animator

// Cache the list of poems
const queryAllPoems = cache(async () => {
  const payload = await getPayload({ config: configPromise })
  try {
    const poems = await payload.find({
      collection: 'poems',
      depth: 0, // We only need title and slug for navigation
      limit: 0, // Fetch all poems
      overrideAccess: false,
      sort: 'title', // Optional: sort poems by title or publishedDate
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

  if (!poems || poems.length === 0) {
    // If no poems, you might want to show a message or let the child page handle it
    // For now, we'll proceed and let the child page (e.g., /poetry/page.tsx) decide
  }

  return (
    <div className="container mx-auto py-8 pt-16 md:pt-24">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Panel: Poem List */}
        <aside
          className="w-full md:w-1/4 lg:w-1/5 pr-4 md:border-r border-gray-200 dark:border-slate-700
                     md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto"
        >
          <h2 className="text-xl font-semibold mb-4 text-primary">Poems</h2>
          {poems && poems.length > 0 ? (
            <nav>
              <ul className="space-y-2">
                {poems.map((poem) => (
                  <li key={poem.id}>
                    <Link
                      href={`/poetry/${poem.slug}`}
                      className="block p-2 rounded-md text-text hover:bg-secondary hover:text-primary transition-colors"
                      // For active link styling, you'd typically need a client component here
                      // that uses usePathname to compare with poem.slug
                    >
                      {poem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <p className="text-secondary">No poems available.</p>
          )}
        </aside>

        {/* Right Panel: Poem Content - Wrapped with Animator */}
        <PoemContentAnimator>{children}</PoemContentAnimator>
      </div>
    </div>
  )
}
