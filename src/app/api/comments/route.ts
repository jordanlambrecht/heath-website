import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })

  try {
    // Reuse the simple in-memory rate limiter pattern
    const RATE_LIMIT_PER_MIN = Number(process.env.LIKES_RATE_PER_MIN || '10')
    const RATE_WINDOW_MS = 60_000
    ;(global as any).__comments_rate_limits = (global as any).__comments_rate_limits || new Map()
    const rateMap: Map<string, { count: number; windowStart: number }> = (global as any)
      .__comments_rate_limits
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
    let body: any = {}
    try {
      body = await req.json()
    } catch (jsonErr) {
      try {
        const txt = await req.text()
        // Try parsing JSON from text
        try {
          body = JSON.parse(txt)
        } catch (e) {
          // fallback to form-encoded parsing
          const params = new URLSearchParams(txt)
          body = Object.fromEntries(params.entries())
        }
      } catch (txtErr) {
        body = {}
      }
    }

    const { poemId: rawPoemId, parentId: rawParentId, name, email, content, hp_name } = body

    // Normalize poemId when the client sends an object (e.g., comment.poem may be an object)
    let lookupPoemId: string | number | undefined = rawPoemId as any
    if (lookupPoemId && typeof lookupPoemId === 'object') {
      if ('id' in (lookupPoemId as any)) lookupPoemId = (lookupPoemId as any).id
      else if ('_id' in (lookupPoemId as any)) lookupPoemId = (lookupPoemId as any)._id
      else if ('slug' in (lookupPoemId as any)) lookupPoemId = (lookupPoemId as any).slug
      else lookupPoemId = String(lookupPoemId)
    }

    // Normalize parentId similarly so we can accept parent objects
    let parentId: string | number | null = rawParentId ?? null
    if (parentId && typeof parentId === 'object') {
      if ('id' in (parentId as any)) parentId = (parentId as any).id
      else if ('_id' in (parentId as any)) parentId = (parentId as any)._id
      else parentId = String(parentId)
    }
    // Honeypot check: if the hidden field has a value, likely a bot — reject
    if (hp_name && String(hp_name).trim().length > 0) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }
    // If poemId wasn't provided directly, try to infer it from the parent comment when replying.
    if (!lookupPoemId && parentId) {
      try {
        const parentComment = await (payload as any).findByID({
          collection: 'comments',
          id: parentId,
          depth: 1,
          overrideAccess: false,
        })
        if (parentComment) {
          const p = (parentComment as any).poem
          if (p) {
            if (typeof p === 'object') {
              lookupPoemId = p.id ?? p._id ?? p.slug
            } else {
              lookupPoemId = p
            }
          }
        }
      } catch (e) {
        console.error('Error finding parent comment to infer poemId', e)
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
      const poem = await (payload as any).findByID({
        collection: 'poems',
        id: lookupPoemId,
        depth: 0,
        overrideAccess: false,
      })
      if (!poem) {
        return NextResponse.json({ error: 'Poem not found' }, { status: 404 })
      }
      // If the poem explicitly disables comments, reject the creation
      if ((poem as any).allowComments === false) {
        return NextResponse.json({ error: 'Comments disabled for this poem' }, { status: 403 })
      }
    } catch (e) {
      console.error('Error checking poem for comments toggle', e)
      // If we cannot determine, proceed conservatively (allow), but log.
    }

    // Resolve the poem to an actual existing poem id to satisfy Payload relationship validation.
    let resolvedPoemId: string | number | null = null
    try {
      // Prefer numeric ID lookup to avoid findByID throwing when given a slug-like value
      if (/^\d+$/.test(String(lookupPoemId))) {
        const maybe = await (payload as any).findByID({
          collection: 'poems',
          id: Number(lookupPoemId),
          depth: 0,
          overrideAccess: false,
        })
        if (maybe) resolvedPoemId = (maybe as any).id
      }

      // If still not found, try searching by slug (or by string id)
      if (!resolvedPoemId) {
        const found = await (payload as any).find({
          collection: 'poems',
          where: { slug: { equals: String(lookupPoemId) } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        })
        if (found?.docs && found.docs.length > 0) resolvedPoemId = found.docs[0].id
      }
    } catch (e) {
      console.error('Error finding poem by id/slug', e)
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
    const created = await (payload as any).create({
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
      // Email notification using Payload's configured email adapter if available
      const notifyTo = (
        process.env.COMMENT_NOTIFICATION_EMAILS ||
        process.env.SMTP_FROM_ADDRESS ||
        ''
      )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (notifyTo.length && typeof (payload as any).sendEmail === 'function') {
        try {
          await (payload as any).sendEmail({
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
              createdAt: (created as any).createdAt || new Date().toISOString(),
            }),
          })
        } catch (e) {
          console.error('Failed to POST comment webhook', e)
        }
      }
    } catch (notifyErr) {
      console.error('Notifications failed', notifyErr)
    }

    return NextResponse.json({ success: true, commentId: (created as any).id })
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

    const res = await (payload as any).find({
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
