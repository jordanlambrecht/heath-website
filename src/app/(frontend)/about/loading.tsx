import React from 'react'

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-300 dark:bg-slate-700 animate-pulse rounded ${className || ''}`} />
)

export default function PoemPageLoading() {
  return (
    <div className="md:ml-24 md:max-w-3xl container">
      <article className="bg-softer rounded-xl py-8 px-6 text-text border-2 border-foreground">
        {/* Hero Image Skeleton */}
        <SkeletonPulse className="mb-6 rounded-lg aspect-video w-full" />
        {/* Title Skeleton */}
        <SkeletonPulse className="h-10 w-3/4 mb-2" />
        <SkeletonPulse className="h-8 w-1/2 mb-4" /> {/* Sub-title or shorter title part */}
        {/* Metadata Skeleton */}
        <div className="mb-4 flex space-x-2">
          <SkeletonPulse className="h-6 w-28 py-1 px-2" />
          <SkeletonPulse className="h-6 w-36 py-1 px-2" />
        </div>
        {/* Description/Analysis Placeholder (Top) - Simple block */}
        <SkeletonPulse className="h-16 w-full my-6 p-4" />
        {/* Poem Content Skeleton */}
        <div className="space-y-3 mt-4">
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-11/12" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-5/6" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-10/12" />
          <SkeletonPulse className="h-4 w-full" />
        </div>
        {/* Description/Analysis Placeholder (Bottom) - Simple block */}
        <SkeletonPulse className="h-16 w-full my-8 p-4" />
      </article>

      {/* Prev/Next Nav Skeleton */}
      <nav className="mt-12 flex justify-between items-center border-t border-gray-200 dark:border-slate-700 pt-6 pb-8">
        <div className="w-1/3">
          <SkeletonPulse className="h-5 w-20 mb-1" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
        <div className="w-1/3 text-right">
          <SkeletonPulse className="h-5 w-20 mb-1 ml-auto" />
          <SkeletonPulse className="h-3 w-32 ml-auto" />
        </div>
      </nav>
    </div>
  )
}
