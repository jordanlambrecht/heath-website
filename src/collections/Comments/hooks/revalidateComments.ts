import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateComments = async ({ req, doc, _previousDoc }: { req: unknown; doc: unknown; _previousDoc?: unknown }) => {
  try {
    const safe = (v: unknown) => v as Record<string, unknown>
    // doc.poem may be either an id or a relation object
    const poemRef = safe(doc).poem
    const poemId = typeof poemRef === 'object' ? (poemRef as Record<string, unknown>).id : poemRef
    if (!poemId) return

    // We need payload to fetch poem slug
    const payload = (safe(req).payload) as any
    const poem = await payload.findByID({
      collection: 'poems',
      id: poemId,
      depth: 0,
      overrideAccess: true,
    })
    const slug = (poem as Record<string, unknown>)?.slug as string | undefined
    if (slug) {
      revalidatePath(`/poetry/${slug}`)
      revalidatePath('/poetry')
      revalidatePath('/')
    }
    // also trigger sitemap tag
    revalidateTag('poems-sitemap')
  } catch (err: unknown) {
    console.error('Error revalidating comment-related pages', err)
  }
}

export default revalidateComments
