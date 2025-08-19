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
    // If the poem is now published, revalidate the poem page and listing pages
    if (doc._status === 'published') {
      const poemPath = `/poetry/${doc.slug}`

      payload.logger.info(`Revalidating poem at path: ${poemPath}`)

      // Revalidate the poem page
      revalidatePath(poemPath)
      // Revalidate the poetry index/listing and the homepage which may include lists
      revalidatePath('/poetry')
      revalidatePath('/')
      revalidateTag('poems-sitemap')
    }

    // If the poem was previously published but is no longer published (unpublished),
    // revalidate the old poem path and listing pages so caches are updated.
    if (previousDoc && previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/poetry/${previousDoc.slug}`

      payload.logger.info(`Revalidating old poem at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidatePath('/poetry')
      revalidatePath('/')
      revalidateTag('poems-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Poem> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/poetry/${doc?.slug}`

    // Revalidate the deleted poem page and the lists
    revalidatePath(path)
    revalidatePath('/poetry')
    revalidatePath('/')
    revalidateTag('poems-sitemap')
  }

  return doc
}
