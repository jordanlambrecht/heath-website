import React from 'react'

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-300 dark:bg-slate-700 animate-pulse rounded ${className || ''}`} />
)

const PoemListItemSkeleton: React.FC = () => (
  <li className="p-2">
    <SkeletonPulse className="h-5 w-3/4" />
  </li>
)

export default function PoetrySectionLoading() {
  return (
    <div className="container mx-auto py-8 pt-16 md:pt-24">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Panel: Poem List Skeleton */}
        <aside
          className="w-full md:w-1/4 lg:w-1/5 pr-4 md:border-r border-gray-200 dark:border-slate-700
                     md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto"
        >
          <SkeletonPulse className="h-7 w-2/5 mb-4" /> {/* "Poems" Title */}
          <nav>
            <ul className="space-y-2">
              <PoemListItemSkeleton />
              <PoemListItemSkeleton />
              <PoemListItemSkeleton />
              <PoemListItemSkeleton />
              <PoemListItemSkeleton />
            </ul>
          </nav>
        </aside>

        {/* Right Panel: Poem Content Area Skeleton (Generic) */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {/* This will be replaced by [slug]/loading.tsx if navigating to a specific poem,
              or show a more generic content skeleton if this is the initial load of the layout itself.
              For simplicity, we'll use a similar structure to the PoemPageLoading but slightly more generic.
          */}
          <div className="bg-softer rounded-xl py-8 px-6 text-text border-2 border-foreground">
            <SkeletonPulse className="mb-6 rounded-lg aspect-video w-full" />
            <SkeletonPulse className="h-10 w-3/4 mb-2" />
            <SkeletonPulse className="h-8 w-1/2 mb-4" />
            <div className="space-y-3 mt-4">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-11/12" />
              <SkeletonPulse className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
