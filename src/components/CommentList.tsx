import React, { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import CommentItem from './CommentItem'

const queryComments = cache(async (poemId: string) => {
  const payload = await getPayload({ config: configPromise })
  const res = await (payload as any).find({
    collection: 'comments',
    where: { poem: { equals: Number(poemId) } },
    depth: 1,
    limit: 50,
    sort: 'createdAt',
    overrideAccess: false,
  })
  return res.docs || []
})

export default async function CommentList({ poemId }: { poemId: string }) {
  const comments: any[] = await queryComments(poemId)

  if (!comments || comments.length === 0)
    return <div className="text-sm text-muted">No comments yet</div>

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
    </div>
  )
}
