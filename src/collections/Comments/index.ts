import type { CollectionConfig } from 'payload'
import { revalidateComments } from './hooks/revalidateComments'

// Sync poem.comments on create/update
const syncPoemCommentsAfterChange = async ({ req, doc, previousDoc }: any) => {
  try {
    const payload = req.payload
    const commentId = (doc as any).id

    const newRef = (doc as any).poem
    const newPoemId = newRef
      ? typeof newRef === 'object'
        ? (newRef.id ?? newRef._id ?? null)
        : newRef
      : null

    const prevRef = previousDoc ? (previousDoc as any).poem : null
    const prevPoemId = prevRef
      ? typeof prevRef === 'object'
        ? (prevRef.id ?? prevRef._id ?? null)
        : prevRef
      : null

    // If moved between poems, remove from previous poem
    if (prevPoemId && String(prevPoemId) !== String(newPoemId)) {
      try {
        const prevPoem = await payload.findByID({
          collection: 'poems',
          id: prevPoemId,
          depth: 0,
          overrideAccess: true,
        })
        const prevComments: any[] = (prevPoem?.comments || []).filter(
          (id: any) => String(id) !== String(commentId),
        )
        await payload.update({
          collection: 'poems',
          id: prevPoemId,
          data: { comments: prevComments },
          overrideAccess: true,
        })
      } catch (e) {
        console.error('Error removing comment from previous poem', e)
      }
    }

    // If there's a new poem, ensure it includes the comment id (dedupe)
    if (newPoemId) {
      try {
        const poem = await payload.findByID({
          collection: 'poems',
          id: newPoemId,
          depth: 0,
          overrideAccess: true,
        })
        const existing: string[] = (poem?.comments || []).map((x: any) => String(x))
        if (!existing.includes(String(commentId))) {
          const updated = [...(poem?.comments || []), commentId]
          await payload.update({
            collection: 'poems',
            id: newPoemId,
            data: { comments: updated },
            overrideAccess: true,
          })
        }
      } catch (e) {
        console.error('Error adding comment to poem', e)
      }
    }
  } catch (err) {
    console.error('Error syncing poem comments after change', err)
  }
}

// Remove comment id from poem.comments on delete
const removeCommentFromPoemAfterDelete = async ({ req, doc }: any) => {
  try {
    const payload = req.payload
    const commentId = (doc as any).id
    const poemRef = (doc as any).poem
    const poemId = poemRef
      ? typeof poemRef === 'object'
        ? (poemRef.id ?? poemRef._id ?? null)
        : poemRef
      : null
    if (!poemId) return
    try {
      const poem = await payload.findByID({
        collection: 'poems',
        id: poemId,
        depth: 0,
        overrideAccess: true,
      })
      const remaining: any[] = (poem?.comments || []).filter(
        (id: any) => String(id) !== String(commentId),
      )
      await payload.update({
        collection: 'poems',
        id: poemId,
        data: { comments: remaining },
        overrideAccess: true,
      })
    } catch (e) {
      console.error('Error removing deleted comment from poem', e)
    }
  } catch (err) {
    console.error('Error in removeCommentFromPoemAfterDelete', err)
  }
}

const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'content',
  },
  access: {
    read: ({ req: { user } }) => {
      // Unauthenticated users only see approved comments
      if (!user) return { approved: { equals: true } }
      return true
    },
    create: () => true,
  },
  fields: [
    {
      name: 'poem',
      type: 'relationship',
      // cast to any to avoid generated CollectionSlug typing issues
      relationTo: 'poems' as any,
      hasMany: false,
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments' as any,
      hasMany: false,
    },
    {
      name: 'name',
      type: 'text',
      required: false,
    },
    {
      name: 'email',
      type: 'text',
      required: false,
      admin: { readOnly: true },
      //   validate: (value: any, { operation, originalDoc }: any) => {
      //     // Allow empty/null emails (commenters may choose not to provide one).
      //     if (value === null || value === undefined || String(value).trim() === '') return true

      //     // If this is an update and the email hasn't changed, don't block the save.
      //     // This avoids preventing admins from approving/saving when the field is readOnly.
      //     if (operation === 'update' && originalDoc && String(originalDoc.email || '') === String(value)) {
      //       return true
      //     }

      //     // Basic email format check when a value is present and changed (or on create).
      //     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      //     return re.test(String(value)) || 'Please enter a valid email address.'
      //   },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Set to true to publish comment' },
    },
  ],
  hooks: {
    afterChange: [revalidateComments, syncPoemCommentsAfterChange],
    afterDelete: [revalidateComments, removeCommentFromPoemAfterDelete],
  },
}

export default Comments
