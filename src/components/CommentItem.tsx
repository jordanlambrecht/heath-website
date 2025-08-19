'use client'
import { useState } from 'react'
import { formatRelativeDate } from '@/utilities/formatDate'
import CommentForm from './CommentForm'

export default function CommentItem({
  comment,
  allowReply = true,
  childrenComments = [],
}: {
  comment: any
  allowReply?: boolean
  childrenComments?: any[]
}) {
  const [replying, setReplying] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  return (
    <div className="p-3 border rounded bg-background">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">{comment.name || 'Anonymous'}</div>
        {allowReply && (
          <button
            onClick={() => setReplying((r) => !r)}
            className="text-sm text-primary cursor-pointer"
          >
            {replying ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>
      <div className="text-sm text-muted">{formatRelativeDate(comment.createdAt || '')}</div>
      <div className="mt-2 whitespace-pre-wrap">{comment.content}</div>
      {replying && (
        <div className="mt-3">
          <CommentForm
            poemId={String(
              typeof comment.poem === 'object'
                ? (comment.poem?.id ?? comment.poem?._id ?? '')
                : comment.poem,
            )}
            parentId={String(comment.id)}
            onSubmitted={(msg) => {
              // let parent close the form
              try {
                setReplying(false)
              } catch (e) {
                /* ignore */
              }
              // show transient confirmation message
              if (msg) {
                setSubmittedMessage(msg)
                setTimeout(() => setSubmittedMessage(null), 5000)
              }
            }}
          />
        </div>
      )}

      {submittedMessage && <div className="mt-2 text-sm text-success">{submittedMessage}</div>}

      {/* Render one-level children indented */}
      {childrenComments && childrenComments.length > 0 && (
        <div className="mt-4 pl-6 border-l">
          {childrenComments.map((cc) => (
            <div key={String(cc.id)} className="mb-3">
              <div className="text-sm font-medium">{cc.name || 'Anonymous'}</div>
              <div className="text-sm text-muted">
                {new Date(cc.createdAt || '').toLocaleString()}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{cc.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
