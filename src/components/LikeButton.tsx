'use client'

import React, { useEffect, useState } from 'react'

export default function LikeButton({
  poemId,
  initialLikes,
}: {
  poemId: string
  initialLikes?: number
}) {
  const [likes, setLikes] = useState<number>(initialLikes || 0)
  const [pressed, setPressed] = useState(false)

  // load pressed state from localStorage
  useEffect(() => {
    try {
      const key = `liked_poem_${poemId}`
      const stored = localStorage.getItem(key)
      if (stored === '1') setPressed(true)
    } catch (e) {
      // ignore
    }
  }, [poemId])

  const handleClick = async () => {
    const key = `liked_poem_${poemId}`
    const willUnlike = pressed

    // optimistic UI
    setPressed((p) => !p)
    setLikes((l) => (willUnlike ? Math.max(0, l - 1) : l + 1))

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poemId, action: willUnlike ? 'unlike' : 'like' }),
      })
      if (res.ok) {
        const data = await res.json()
        setLikes(data.likes)
        try {
          if (willUnlike) localStorage.removeItem(key)
          else localStorage.setItem(key, '1')
        } catch {}
      } else {
        // revert optimistic UI on error
        setPressed((p) => !p)
        setLikes((l) => (willUnlike ? l + 1 : Math.max(0, l - 1)))
      }
    } catch (err) {
      setPressed((p) => !p)
      setLikes((l) => (willUnlike ? l + 1 : Math.max(0, l - 1)))
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={pressed}
      className={`transform-color duration-300 ease-in-out cursor-pointer inline-flex items-center gap-2 px-3 py-1 rounded-md border ${pressed ? 'bg-primary text-white' : 'bg-transparent'} `}
    >
      <span className="font-medium">{likes}</span>
      <span className="text-sm">{pressed ? 'Liked' : 'Like'}</span>
    </button>
  )
}
