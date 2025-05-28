'use client'

import React from 'react'
import { Link as TransitionLink } from 'next-transition-router'
import { usePathname } from 'next/navigation'
import type { Poem } from '@/payload-types'

interface PoetrySidebarProps {
  poems: Pick<Poem, 'id' | 'title' | 'slug'>[] | null | undefined
}

export default function PoetrySidebar({ poems }: PoetrySidebarProps) {
  const pathname = usePathname()
  const poetryBasePath = '/poetry'

  return (
    <aside
      className="w-full md:w-1/4 lg:w-1/5 pr-4 md:border-r border-gray-200 dark:border-slate-700
                 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto"
    >
      <nav>
        <ul className="space-y-2">
          {/* Link to the main /poetry (intro) page */}
          <li>
            <TransitionLink
              href={poetryBasePath}
              className={`block p-2 rounded-md text-text hover:bg-secondary hover:text-primary transition-colors ${
                pathname === poetryBasePath ? 'bg-secondary text-primary font-semibold' : ''
              }`}
            >
              Poetry
            </TransitionLink>
          </li>

          {/* Divider or just space if preferred */}
          {poems && poems.length > 0 && (
            <hr className="my-3 border-gray-200 dark:border-slate-700" />
          )}

          {/* "Poems" sub-heading - can be kept or removed based on preference */}
          {poems && poems.length > 0 && (
            <li className="px-2 pt-2 pb-1 text-sm font-semibold text-primary/80">Poems</li>
          )}

          {/* Individual Poem Links */}
          {poems && poems.length > 0
            ? poems.map((poem) => {
                const href = `${poetryBasePath}/${poem.slug}`
                const isActive = pathname === href
                return (
                  <li key={poem.id}>
                    <TransitionLink
                      href={href}
                      className={`block p-2 rounded-md text-text hover:bg-secondary hover:text-primary transition-colors ${
                        isActive ? 'bg-secondary text-primary font-semibold' : ''
                      }`}
                    >
                      {poem.title}
                    </TransitionLink>
                  </li>
                )
              })
            : null}
        </ul>
      </nav>
    </aside>
  )
}
