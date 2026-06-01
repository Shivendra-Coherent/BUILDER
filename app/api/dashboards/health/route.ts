/**
 * Master health endpoint — GET /api/dashboards/health
 *
 * Returns a real-time snapshot of:
 *  • How many dashboards are in each partition (MongoDB load)
 *  • How many are currently cached in each partition (memory load)
 *  • Cache hit/miss rates per partition
 *  • Overall system status (healthy / degraded)
 *
 * The master uses this to detect partition imbalance.
 * A human operator (or future auto-rebalancer) can query this to
 * understand which partitions are hot and which are idle.
 */

import { NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/master-registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const health = await getSystemHealth()
    return NextResponse.json(health)
  } catch (err) {
    console.error('[health] Failed to collect system health:', err)
    return NextResponse.json(
      { error: 'Could not collect health data.' },
      { status: 500 }
    )
  }
}
