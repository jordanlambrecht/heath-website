import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
// Reuse a global pool in serverless/dev to avoid creating too many connections
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __payload_pg_pool: any
}

async function getPool() {
  if (global.__payload_pg_pool) return global.__payload_pg_pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
    // dynamic import to avoid requiring 'pg' types at build time
    // @ts-expect-error - 'pg' may not have types installed in this environment; handle missing module at runtime
    const pgModule = await import('pg').catch(() => null)
  if (!pgModule) return null
  const { Pool } = pgModule
  const pool = new Pool({ connectionString })
  // store on global to reuse across hot-reloads
  global.__payload_pg_pool = pool
  return pool
}

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  try {
    // Basic per-IP rate limiting (in-memory). This is intentionally simple and
    // will be reset on server restart. For production use, replace with a
    // centralized store (Redis) to share limits across instances.
    const RATE_LIMIT_PER_MIN = Number(process.env.LIKES_RATE_PER_MIN || '30')
    const RATE_WINDOW_MS = 60_000
    // global map of ip -> { count, windowStart }
    ;(global as unknown as Record<string, unknown>).__likes_rate_limits =
      (global as unknown as Record<string, unknown>).__likes_rate_limits || new Map()
    const rateMap: Map<string, { count: number; windowStart: number }> =
      ((global as unknown as Record<string, unknown>).__likes_rate_limits as unknown) as Map<string, {
        count: number
        windowStart: number
      }>
    // determine client IP from headers (behind proxies or Vercel) or fallback
  const forwardedFor: string = (req.headers.get('x-forwarded-for') || '') as string
  const realIp: string = (req.headers.get('x-real-ip') || '') as string
    const firstForward = (forwardedFor.split(',')[0] ?? '').trim()
    const ip = firstForward || realIp || 'local'
    const now = Date.now()
    const entry = rateMap.get(ip) || { count: 0, windowStart: now }
    if (now - entry.windowStart > RATE_WINDOW_MS) {
      entry.count = 0
      entry.windowStart = now
    }
    if (entry.count >= RATE_LIMIT_PER_MIN) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    entry.count += 1
    rateMap.set(ip, entry)

  const body = (await req.json()) as unknown
  const { poemId, action } = (body as Record<string, unknown>) || {}
    if (!poemId) return NextResponse.json({ error: 'Missing poemId' }, { status: 400 })
    const act = action === 'unlike' ? 'unlike' : 'like'
    // normalize poemId into a string|number for downstream calls
    const poemIdParam: string | number = typeof poemId === 'number' ? poemId : String(poemId)

    // Try an atomic DB update if we have a Postgres connection string
    const pool = await getPool()
    if (pool) {
      const delta = act === 'like' ? 1 : -1
      // Determine whether poemId looks like a numeric id or a slug
      const isNumericId = /^\d+$/.test(String(poemId))
      // Use explicit ::int cast when matching numeric id path to ensure Postgres interprets parameter as integer
      const whereClause = isNumericId ? 'id = $2::int' : 'slug = $2'
      // Use GREATEST to prevent negative counts
      const sql = `UPDATE poems SET likes = GREATEST(likes + $1, 0) WHERE ${whereClause} RETURNING likes`
  const result = await pool.query(sql, [delta, isNumericId ? Number(poemIdParam) : String(poemIdParam)])
      if (result && result.rows && result.rows[0]) {
        // pg may return numeric as string — coerce to number
        const likes = Number(result.rows[0].likes)
        return NextResponse.json({ success: true, likes })
      }
      // If update matched no rows, return 404
      return NextResponse.json({ error: 'Poem not found' }, { status: 404 })
    }

    // Fallback: payload local API read-then-update (non-atomic)
    try {
      const existing = await payload.findByID({
        collection: 'poems',
        id: poemIdParam,
        depth: 0,
        overrideAccess: true,
      })
      const currentLikes = ((existing as unknown) as Record<string, unknown>)?.likes as number | undefined
      const currentLikesNum = typeof currentLikes === 'number' ? currentLikes : Number(currentLikes) || 0
      const newLikes = act === 'like' ? currentLikesNum + 1 : Math.max(0, currentLikesNum - 1)
      // use unknown cast to update without broad any
  await (payload as unknown as { update: (args: unknown) => Promise<unknown> }).update({
        collection: 'poems',
        id: poemIdParam,
        data: { likes: newLikes },
        overrideAccess: true,
      })
      return NextResponse.json({ success: true, likes: newLikes })
    } catch (e: unknown) {
      // If payload couldn't find the document, return 404 to the client
      const err = e as Record<string, unknown>
      if (err && ((err.status as number) === 404 || /Not Found/i.test(String((err.message as string) || '')))) {
        return NextResponse.json({ error: 'Poem not found' }, { status: 404 })
      }
      // rethrow to be handled by outer catch
      throw e
    }
  } catch (err) {
    console.error('Error incrementing likes', err)
    return NextResponse.json({ error: 'Error incrementing likes' }, { status: 500 })
  }
}
