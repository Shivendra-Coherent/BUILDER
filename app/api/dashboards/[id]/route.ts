/**
 * Slave read path — GET /api/dashboards/[id]
 *
 * Flow:
 *  1. Validate the ID (prevent invalid/malicious lookups)
 *  2. Check the partition's slave cache → HIT: return immediately
 *  3. MISS: fetch from MongoDB → store in cache → return
 *  4. Increment readCount in the background (non-blocking, zero latency impact)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboard, incrementReadCount, isValidDashboardId } from '@/lib/dashboard-mongo'
import { cacheGet, cacheSet } from '@/lib/slave-cache'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing dashboard ID.' }, { status: 400 })
  }

  if (!isValidDashboardId(id)) {
    return NextResponse.json(
      { error: 'The dashboard ID in this link is not valid.' },
      { status: 400 }
    )
  }

  try {
    // ── Slave: check partition cache first ───────────────────────────────
    // We need the partitionKey to know which cache bucket to check.
    // For existing documents we'll get it from MongoDB on a miss and then
    // cache it so subsequent requests are instant.

    // Fast path: try to find it in all partitions via direct key lookup.
    // Since we store by dashboardId in the correct bucket, we need the
    // partitionKey first. We attempt a quick MongoDB fetch which also
    // gives us the partitionKey to use for all future cache operations.

    // Check if it's in any cache bucket by doing a DB fetch to get partitionKey,
    // then use that to check the correct cache bucket.
    // On first access this is one MongoDB round trip; every access after is cached.

    // Step 1: get the document (from cache or MongoDB)
    let doc = null
    let fromCache = false

    // We need the partitionKey to do a cache lookup. Fetch from MongoDB to get it.
    // On subsequent requests, the cache will be warm and we skip the fetch.
    // To avoid the bootstrap problem, we store a lightweight index in cache partition 0
    // mapping dashboardId → partitionKey. But for simplicity, we do a conditional:
    // try each partition's cache for this id (O(8) map lookups, sub-microsecond)
    const { PARTITION_COUNT } = await import('@/lib/slave-cache')
    for (let p = 0; p < PARTITION_COUNT; p++) {
      const cached = cacheGet(id, p)
      if (cached) {
        doc = cached
        fromCache = true
        break
      }
    }

    if (!doc) {
      // Cache miss — fetch from MongoDB
      doc = await getDashboard(id)

      if (!doc) {
        return NextResponse.json(
          {
            error: 'Dashboard not found.',
            detail: 'This link may be invalid or the dashboard was never saved.',
          },
          { status: 404 }
        )
      }

      // Store in the correct partition cache for future requests
      cacheSet(id, doc.partitionKey ?? 0, doc)
    }

    // ── Increment read counter (fire-and-forget, non-blocking) ───────────
    if (!fromCache) {
      // Only count on cache misses to avoid DB write on every cached hit
      incrementReadCount(id)
    }

    return NextResponse.json(doc)

  } catch (err) {
    console.error('[dashboards/[id]] Error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while loading the dashboard.' },
      { status: 500 }
    )
  }
}
