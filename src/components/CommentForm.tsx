'use client'
import { useState, FormEvent, useRef, useEffect } from 'react'

export default function CommentForm({
  poemId,
  parentId,
  onSubmitted,
}: {
  poemId: string
  parentId?: string | null
  // onSubmitted can optionally receive a message to display in the parent
  onSubmitted?: (message?: string) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // Honeypot field state — bots often fill hidden fields; keep it empty
  const [hp_name, setHpName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const contentTrim = content?.trim()
    if (!contentTrim || contentTrim.length < 3) {
      setMessage('Please write a longer comment')
      return
    }

    const emailTrim = email?.trim()
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setMessage('Please provide a valid email address or leave it empty')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poemId,
          parentId,
          name: name?.trim() || '',
          email: emailTrim ?? '',
          content: contentTrim,
          hp_name,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Call parent callback first so parent can close/unmount this form.
        try {
          onSubmitted?.('Reply submitted — pending moderation')
        } catch (_ignore) {
          // ignore
        }
        // Only update local state if still mounted (parent may have unmounted us)
        if (mountedRef.current) {
          setMessage('Thanks — your comment is pending moderation')
          setName('')
          setEmail('')
          setContent('')
        }
      } else {
        if (mountedRef.current) setMessage(data?.error || 'Error submitting comment')
      }
    } catch (_err) {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot field — visually hidden but present in the DOM */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <label>Leave this field empty</label>
        <input
          value={hp_name}
          onChange={(e) => setHpName(e.target.value)}
          name="hp_name"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-3 gap-x-5 ">
        <div className="col-span-3 md:col-span-1">
          <label className=" text-sm font-medium">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
        <div className="col-span-3 md:col-span-2">
          <label className=" text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Comment</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
          rows={4}
        />
      </div>
      <div>
        <button
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded cursor-pointer transition-colors duration-300 ease-in-out"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  )
}
