import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })

  try {
    // Reuse the simple in-memory rate limiter pattern
    const RATE_LIMIT_PER_MIN = Number(process.env.LIKES_RATE_PER_MIN || '10')
    const RATE_WINDOW_MS = 60_000
    ;(global as unknown as Record<string, unknown>).__comments_rate_limits =
      (global as unknown as Record<string, unknown>).__comments_rate_limits || new Map()
    const rateMap: Map<string, { count: number; windowStart: number }> = (
      global as unknown as Record<string, unknown>
    ).__comments_rate_limits as unknown as Map<
      string,
      {
        count: number
        windowStart: number
      }
    >
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

    // Robustly parse body: prefer JSON, fallback to text -> JSON, then URLSearchParams (form-encoded)
    let body: unknown = {}
    try {
      body = await req.json()
    } catch (_jsonErr) {
      try {
        const txt = await req.text()
        // Try parsing JSON from text
        try {
          body = JSON.parse(txt)
        } catch (_e) {
          // fallback to form-encoded parsing
          const params = new URLSearchParams(txt)
          body = Object.fromEntries(params.entries())
        }
      } catch (_txtErr) {
        body = {}
      }
    }

    const b = (body as Record<string, unknown>) || {}
    const { poemId: rawPoemId, parentId: rawParentId, name, email, content, hp_name } = b

    // Normalize poemId when the client sends an object (e.g., comment.poem may be an object)
    let lookupPoemId: string | number | undefined = rawPoemId as unknown as
      | string
      | number
      | undefined
    if (lookupPoemId && typeof lookupPoemId === 'object') {
      const lp = lookupPoemId as unknown as Record<string, unknown>
      if ('id' in lp) lookupPoemId = lp.id as string | number
      else if ('_id' in lp) lookupPoemId = lp._id as string | number
      else if ('slug' in lp) lookupPoemId = lp.slug as string
      else lookupPoemId = String(lookupPoemId)
    }

    // Normalize parentId similarly so we can accept parent objects
    let parentId: string | number | null = (rawParentId as unknown as string | number) ?? null
    if (parentId && typeof parentId === 'object') {
      const pp = parentId as unknown as Record<string, unknown>
      if ('id' in pp) parentId = pp.id as string | number
      else if ('_id' in pp) parentId = pp._id as string | number
      else parentId = String(parentId)
    }
    // Honeypot check: if the hidden field has a value, likely a bot — reject
    if (hp_name && String(hp_name).trim().length > 0) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }
    // If poemId wasn't provided directly, try to infer it from the parent comment when replying.
    if (!lookupPoemId && parentId) {
      try {
        const parentComment = await (
          payload as unknown as { findByID: (args: unknown) => Promise<unknown> }
        ).findByID({
          collection: 'comments',
          id: parentId,
          depth: 1,
          overrideAccess: false,
        })
        if (parentComment) {
          const p = (parentComment as unknown as Record<string, unknown>).poem
          if (p) {
            if (typeof p === 'object') {
              const pr = p as Record<string, unknown>
              lookupPoemId = (pr.id ?? pr._id ?? pr.slug) as string | number | undefined
            } else {
              lookupPoemId = p as string | number
            }
          }
        }
      } catch (_e) {
        console.error('Error finding parent comment to infer poemId', _e)
      }
    }

    if (!lookupPoemId || !content || String(content).trim().length < 3) {
      return NextResponse.json({ error: 'Missing poemId or content too short' }, { status: 400 })
    }

    // Validate optional email server-side
    const emailTrim = email ? String(email).trim() : null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailTrim && !emailRegex.test(emailTrim)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Respect per-poem allowComments toggle (default: allow)
    try {
      const poem = await (
        payload as unknown as { findByID: (args: unknown) => Promise<unknown> }
      ).findByID({
        collection: 'poems',
        id: lookupPoemId,
        depth: 0,
        overrideAccess: false,
      })
      if (!poem) {
        return NextResponse.json({ error: 'Poem not found' }, { status: 404 })
      }
      // If the poem explicitly disables comments, reject the creation
      if ((poem as unknown as Record<string, unknown>).allowComments === false) {
        return NextResponse.json({ error: 'Comments disabled for this poem' }, { status: 403 })
      }
    } catch (_e) {
      console.error('Error checking poem for comments toggle', _e)
      // If we cannot determine, proceed conservatively (allow), but log.
    }

    // Resolve the poem to an actual existing poem id to satisfy Payload relationship validation.
    let resolvedPoemId: string | number | null = null
    try {
      // Prefer numeric ID lookup to avoid findByID throwing when given a slug-like value
      if (/^\d+$/.test(String(lookupPoemId))) {
        const maybe = await (
          payload as unknown as { findByID: (args: unknown) => Promise<unknown> }
        ).findByID({
          collection: 'poems',
          id: Number(lookupPoemId),
          depth: 0,
          overrideAccess: false,
        })
        if (maybe)
          resolvedPoemId = (maybe as unknown as Record<string, unknown>).id as string | number
      }

      // If still not found, try searching by slug (or by string id)
      if (!resolvedPoemId) {
        const found = await (
          payload as unknown as { find: (args: unknown) => Promise<unknown> }
        ).find({
          collection: 'poems',
          where: { slug: { equals: String(lookupPoemId) } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        })
        if (
          (found as unknown as Record<string, unknown>)?.docs &&
          ((found as unknown as Record<string, unknown>).docs as unknown[]).length > 0
        )
          resolvedPoemId = (
            ((found as unknown as Record<string, unknown>).docs as unknown[])[0] as Record<
              string,
              unknown
            >
          ).id as string | number | null
      }
    } catch (_e) {
      console.error('Error finding poem by id/slug', _e)
    }

    if (!resolvedPoemId) {
      return NextResponse.json({ error: 'Poem not found' }, { status: 404 })
    }

    const parentRelation = parentId
      ? /^\d+$/.test(String(parentId))
        ? Number(parentId)
        : String(parentId)
      : null

    // Create comment (approved defaults to false) using the resolved poem id
    const created = await (
      payload as unknown as { create: (args: unknown) => Promise<unknown> }
    ).create({
      collection: 'comments',
      data: {
        poem: resolvedPoemId,
        parent: parentRelation,
        name: name || null,
        email: emailTrim || null,
        content: String(content).trim(),
        approved: false,
      },
      overrideAccess: true,
    })
    // Send notifications (best-effort)
    try {
      // Build notification recipients: prefer all emails from the `users` collection
      let notifyTo: string[] = []
      try {
        const usersRes = await (
          payload as unknown as { find: (args: unknown) => Promise<{ docs?: unknown[] }> }
        ).find({
          collection: 'users',
          where: { email: { exists: true } },
          limit: 0,
          depth: 0,
          overrideAccess: false,
        })
        const docs = (usersRes && (usersRes as { docs?: unknown[] }).docs) || []
        notifyTo = docs
          .map((d) => (d as Record<string, unknown>).email)
          .filter(Boolean)
          .map((e) => String(e).trim())
      } catch (e) {
        console.error('Failed to fetch users for comment notifications', e)
      }

      // Fallback to env var or SMTP from address when no users found
      if (!notifyTo.length) {
        notifyTo = (process.env.COMMENT_NOTIFICATION_EMAILS || process.env.SMTP_FROM_ADDRESS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }

      if (
        notifyTo.length &&
        typeof (payload as unknown as Record<string, unknown>).sendEmail === 'function'
      ) {
        try {
          await (
            payload as unknown as { sendEmail: (opts: unknown) => Promise<unknown> }
          ).sendEmail({
            to: notifyTo,
            subject: `New comment on poem ${String(lookupPoemId)}`,
            html: `<p>New comment on poem <strong>${String(lookupPoemId)}</strong></p>
                   <p><strong>${name || 'Anonymous'}</strong> (${email || 'no-email'})</p>
                   <p>${String(content).trim()}</p>
                   <p>Approve in the admin to publish.</p>`,
          })
        } catch (e) {
          console.error('Failed to send comment notification email', e)
        }
      }

      // Webhook notification
      const webhook = process.env.COMMENTS_WEBHOOK_URL
      if (webhook) {
        try {
          await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              poemId: resolvedPoemId,
              parentId: parentId || null,
              name: name || null,
              email: emailTrim || null,
              content: String(content).trim(),
              createdAt:
                ((created as unknown as Record<string, unknown>).createdAt as string) ||
                new Date().toISOString(),
            }),
          })
        } catch (e) {
          console.error('Failed to POST comment webhook', e)
        }
      }
    } catch (_notifyErr) {
      console.error('Notifications failed', _notifyErr)
    }

    return NextResponse.json({
      success: true,
      commentId: (created as unknown as Record<string, unknown>).id,
    })
  } catch (err) {
    console.error('Error creating comment', err)
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const payload = await getPayload({ config: configPromise })

  try {
    const url = new URL(req.url)
    const poemId = url.searchParams.get('poemId')
    if (!poemId) return NextResponse.json({ error: 'Missing poemId' }, { status: 400 })

    // Normalize poem id like in POST
    const poemRelation = /^\d+$/.test(String(poemId)) ? Number(poemId) : String(poemId)

    const res = await (
      payload as unknown as { find: (args: unknown) => Promise<{ docs?: unknown[] }> }
    ).find({
      collection: 'comments',
      where: {
        poem: { equals: poemRelation },
        approved: { equals: true },
      },
      sort: 'createdAt',
      depth: 1,
      limit: 0,
      overrideAccess: false,
    })

    return NextResponse.json({ success: true, comments: res.docs || [] })
  } catch (err) {
    console.error('Error fetching comments', err)
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 })
  }
}
