import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateComments = async ({ req, doc, previousDoc }: any) => {
  try {
    // doc.poem may be either an id or a relation object
    const poemId = typeof (doc as any).poem === 'object' ? (doc as any).poem.id : (doc as any).poem
    if (!poemId) return

    // We need payload to fetch poem slug
    const payload = req.payload
    const poem = await payload.findByID({
      collection: 'poems',
      id: poemId,
      depth: 0,
      overrideAccess: true,
    })
    const slug = (poem as any)?.slug
    if (slug) {
      revalidatePath(`/poetry/${slug}`)
      revalidatePath('/poetry')
      revalidatePath('/')
    }
    // also trigger sitemap tag
    revalidateTag('poems-sitemap')
  } catch (err) {
    console.error('Error revalidating comment-related pages', err)
  }
}

export default revalidateComments
