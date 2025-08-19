import type { CollectionConfig } from 'payload'
import { revalidateComments } from './hooks/revalidateComments'

// Sync poem.comments on create/update
const syncPoemCommentsAfterChange = async ({ req, doc, previousDoc }: { req: unknown; doc: unknown; previousDoc?: unknown }) => {
  const safe = (v: unknown) => v as Record<string, unknown>
  try {
    const reqObj = safe(req)
    const payload = reqObj.payload as unknown as {
      findByID: (args: unknown) => Promise<unknown>
      update: (args: unknown) => Promise<unknown>
    }
    const commentId = String((safe(doc).id ?? safe(doc)._id) ?? '')

    const extractId = (ref: unknown) => {
      if (!ref) return null
      if (typeof ref === 'object') {
        const r = ref as Record<string, unknown>
        return r.id ?? r._id ?? null
      }
      return ref
    }

    const newRef = extractId(safe(doc).poem)
    const newPoemId = newRef ?? null

    const prevRef = previousDoc ? extractId(safe(previousDoc).poem) : null
    const prevPoemId = prevRef ?? null

    // If moved between poems, remove from previous poem
    if (prevPoemId && String(prevPoemId) !== String(newPoemId)) {
      try {
  const prevPoem = await payload.findByID({
          collection: 'poems',
          id: prevPoemId,
          depth: 0,
          overrideAccess: true,
        })
  const prevComments = (((prevPoem as Record<string, unknown>)?.comments as unknown[]) || []).filter((id) => String(id) !== commentId)
        await payload.update({
          collection: 'poems',
          id: prevPoemId,
          data: { comments: prevComments },
          overrideAccess: true,
        })
      } catch (e: unknown) {
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
  const existing = ((((poem as Record<string, unknown>)?.comments as unknown[]) || []) as unknown[]).map((x) => String(x))
        if (!existing.includes(commentId)) {
          const updated = [...(((poem as Record<string, unknown>)?.comments as unknown[]) || []), commentId]
          await payload.update({
            collection: 'poems',
            id: newPoemId,
            data: { comments: updated },
            overrideAccess: true,
          })
        }
      } catch (e: unknown) {
        console.error('Error adding comment to poem', e)
      }
    }
  } catch (err: unknown) {
    console.error('Error syncing poem comments after change', err)
  }
}

// Remove comment id from poem.comments on delete
const removeCommentFromPoemAfterDelete = async ({ req, doc }: { req: unknown; doc: unknown }) => {
  const safe = (v: unknown) => v as Record<string, unknown>
  try {
    const payload = safe(req).payload as unknown as {
      findByID: (args: unknown) => Promise<unknown>
      update: (args: unknown) => Promise<unknown>
    }
    const commentId = String((safe(doc).id ?? safe(doc)._id) ?? '')
  const poemRef = safe(doc).poem
  const poemId = poemRef && typeof poemRef === 'object' ? ((poemRef as Record<string, unknown>).id ?? (poemRef as Record<string, unknown>)._id ?? null) : poemRef
    if (!poemId) return
    try {
      const poem = await payload.findByID({
        collection: 'poems',
        id: poemId,
        depth: 0,
        overrideAccess: true,
      })
  const remaining = ((((poem as Record<string, unknown>)?.comments as unknown[]) || []) as unknown[]).filter((id) => String(id) !== commentId)
      await payload.update({
        collection: 'poems',
        id: poemId,
        data: { comments: remaining },
        overrideAccess: true,
      })
    } catch (e: unknown) {
      console.error('Error removing deleted comment from poem', e)
    }
  } catch (err: unknown) {
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
