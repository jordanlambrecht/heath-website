// src/collections/Poems/hooks/revalidatePoem.ts

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Poem } from '@/payload-types'

export const revalidatePoem: CollectionAfterChangeHook<Poem> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/poems/${doc.slug}`

      payload.logger.info(`Revalidating poem at path: ${path}`)

      revalidatePath(path)
      revalidateTag('poems-sitemap')
    }

    // If the poem was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/poems/${previousDoc.slug}`

      payload.logger.info(`Revalidating old poem at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag('poems-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Poem> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/poems/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('poems-sitemap')
  }

  return doc
}
