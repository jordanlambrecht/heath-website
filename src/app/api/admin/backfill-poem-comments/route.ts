import { NextResponse } from 'next/server'

type PayloadFindResult = {
  docs?: unknown[]
  totalDocs?: number
}

export async function POST(req: Request) {
  // simple secret protection for one-off admin task
  const url = new URL(req.url)
  const provided = url.searchParams.get('secret')
  const body = await req.json().catch(() => ({}))
  const secret = provided || body.secret
  if (!process.env.BACKFILL_SECRET || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // req.payload is injected by Payload when running inside the Payload server context
  const payload = (req as unknown as Record<string, unknown>).payload
  if (!payload) {
    return NextResponse.json({ error: 'payload not available on request' }, { status: 500 })
  }

  try {
    const limit = 500
    let page = 1
    const allComments: unknown[] = []

    while (true) {
      // payload.find returns { docs, totalDocs, limit, page } shape
      const res: PayloadFindResult = await (payload as unknown as {
        find: (args: unknown) => Promise<PayloadFindResult>
      }).find({
        collection: 'comments',
        limit,
        page,
        depth: 0,
        overrideAccess: true,
      })
      const docs = res?.docs || []
      allComments.push(...docs)
      if (!res || docs.length < limit) break
      page += 1
    }

    const map = new Map<string, string[]>()
    for (const c of allComments) {
      const comment = c as Record<string, unknown>
      const poemRef = comment?.poem
      const poemId = poemRef
        ? typeof poemRef === 'object'
          ? ((poemRef as Record<string, unknown>).id ?? (poemRef as Record<string, unknown>)._id ?? null)
          : poemRef
        : null
      const commentId = comment?.id ?? comment?._id
      if (!poemId || !commentId) continue
      const key = String(poemId)
      const arr = map.get(key) || []
      arr.push(String(commentId))
      map.set(key, arr)
    }

  let poemsUpdated = 0
  const errors: Array<Record<string, unknown>> = []
    for (const [poemId, ids] of map.entries()) {
      const uniq = Array.from(new Set(ids))
      try {
  await (payload as unknown as { update: (args: unknown) => Promise<unknown> }).update({
          collection: 'poems',
          id: poemId,
          data: { comments: uniq },
          overrideAccess: true,
        })
        poemsUpdated += 1
      } catch (e) {
    errors.push({ poemId, error: String(e) })
      }
    }

    return NextResponse.json({ totalComments: allComments.length, poemsUpdated, errors })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
