'use client'
import React, { useEffect, useState } from 'react'
import type { TextFieldClientProps } from 'payload'
import { useFormFields } from '@payloadcms/ui'

type Comment = {
  id: string | number
  name?: string | null
  email?: string | null
  content?: string | null
  approved?: boolean
  createdAt?: string
}

const PoemCommentsTab: React.FC<TextFieldClientProps> = () => {
  // Read the current document id from the editor form fields
  const docId = useFormFields(([fields]) => fields['id']?.value as string | number | undefined)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId) return
    let mounted = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/comments?poemId=${docId}`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json()
        // The admin endpoint returns { success: true, comments: [...] }
        if (mounted) setComments(json.comments || json.docs || [])
      } catch (e: any) {
        if (mounted) setError(String(e.message || e))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [docId])

  if (!docId) {
    return <div className="py-2 text-sm text-muted">Save the poem to view comments here.</div>
  }

  if (loading) return <div className="py-2">Loading comments…</div>
  if (error) return <div className="py-2 text-red">Error loading comments: {error}</div>
  if (!comments || comments.length === 0)
    return <div className="py-2 text-sm text-muted">No comments yet for this poem.</div>

  return (
    <div className="py-2">
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={String(c.id)} className="p-2 border rounded">
            <div className="text-sm text-muted">{new Date(c.createdAt || '').toLocaleString()}</div>
            <div className="font-medium">{c.name || 'Anonymous'}</div>
            <div className="text-sm text-muted">{c.email || '—'}</div>
            <div className="mt-2 whitespace-pre-wrap">{c.content}</div>
            <div className="mt-2 text-sm">
              Status: {c.approved ? 'Approved' : 'Pending'} —{' '}
              <a href={`/admin/collections/comments/${c.id}`} target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PoemCommentsTab
