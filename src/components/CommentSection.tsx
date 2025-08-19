'use client'
import React, { useEffect, useRef, useState } from 'react'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'

type CommentType = {
  id?: string | number
  name?: string | null
  createdAt?: string | number | Date | null
  content?: string
  poem?: string | number | { id?: string | number; slug?: string }
  parent?: string | number | { id?: string | number }
}

export default function CommentSection({ poemId }: { poemId: string }) {
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<unknown[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    let observer: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComments()
            observer?.disconnect()
          }
        })
      })
      observer.observe(ref.current)
    } else {
      // Fallback: just load immediately
      loadComments()
    }

    return () => {
      observer?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current])

  async function loadComments() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/comments?poemId=${encodeURIComponent(poemId)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to load comments')
        setComments([])
      } else {
        setComments(data?.comments || [])
      }
    } catch (_ignore) {
      setError('Network error')
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref}>
      <div className="space-y-4">
        {loading && (
          <div className="space-y-3">
            <div className="p-3 border rounded bg-background animate-pulse h-20" />
            <div className="p-3 border rounded bg-background animate-pulse h-20" />
            <div className="p-3 border rounded bg-background animate-pulse h-20" />
          </div>
        )}

        {!loading && error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && comments && comments.length === 0 && (
          <div className="text-sm text-muted">No comments yet</div>
        )}

        {!loading && comments && comments.length > 0 && (
          <div className="space-y-4">
            {(() => {
              // Build a one-level tree: top-level comments (no parent) and direct children
              const byId = new Map<string, Record<string, unknown>>()
              const childrenMap = new Map<string, Record<string, unknown>[]>()
              const commentList = comments as Record<string, unknown>[]
              commentList.forEach((comment) => {
                const id = String(comment.id)
                byId.set(id, comment)
              })
              commentList.forEach((comment) => {
                const parent = comment.parent
                let pid: string | null = null
                if (parent) {
                  pid = typeof parent === 'object' ? String(((parent as Record<string, unknown>).id as unknown) || parent) : String(parent)
                }
                if (pid) {
                  const arr = childrenMap.get(pid) || []
                  arr.push(comment)
                  childrenMap.set(pid, arr)
                }
              })

              // Render top-level comments and their direct children
              return Array.from(byId.values())
                .filter((c) => {
                  const parent = c.parent
                  const pid = parent
                    ? typeof parent === 'object'
                      ? String(((parent as Record<string, unknown>).id as unknown) || parent)
                      : String(parent)
                    : null
                  return !pid
                })
                .map((c) => (
                  <div key={String((c as Record<string, unknown>).id)}>
                    <CommentItem
                      comment={c as unknown as CommentType}
                      allowReply={true}
                      childrenComments={(childrenMap.get(String((c as Record<string, unknown>).id)) as unknown as CommentType[]) || []}
                    />
                  </div>
                ))
            })()}
          </div>
        )}

        <div className="mt-6">
          <CommentForm poemId={poemId} />
        </div>
      </div>
    </div>
  )
}
