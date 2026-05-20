import { NextRequest, NextResponse } from 'next/server'
import { saveDashboard, StorageError } from '@/lib/dashboard-storage'

export const dynamic = 'force-dynamic'

/** Derive the public origin from the request so the share URL works behind
 *  any hostname (localhost, custom domain, Vercel preview URL, etc.). */
function getOrigin(req: NextRequest): string {
  // Prefer the explicit x-forwarded-host header set by Vercel / reverse proxies
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  if (host) return `${proto}://${host}`

  // Last resort: derive from Origin header (present on same-origin fetch)
  return req.headers.get('origin') || ''
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  // ── Parse body ────────────────────────────────────────────────────────────
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body is not valid JSON.' },
      { status: 400 }
    )
  }

  // ── Basic validation ──────────────────────────────────────────────────────
  const { data, rawIntelligenceData, pricingAnalysisData } = body
  if (!data && !rawIntelligenceData && !pricingAnalysisData) {
    return NextResponse.json(
      { error: 'No dashboard data provided. Upload at least one data file before generating a link.' },
      { status: 400 }
    )
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  try {
    const id = await saveDashboard({
      name:                           typeof body.name === 'string' ? body.name : 'Untitled Dashboard',
      currency:                       body.currency === 'INR' ? 'INR' : 'USD',
      data:                           (body.data as any)                           ?? null,
      intelligenceType:               (body.intelligenceType as any)               ?? null,
      rawIntelligenceData:            body.rawIntelligenceData                     ?? null,
      proposition2Data:               body.proposition2Data                        ?? null,
      proposition3Data:               body.proposition3Data                        ?? null,
      distributorRawIntelligenceData: body.distributorRawIntelligenceData          ?? null,
      distributorProposition2Data:    body.distributorProposition2Data             ?? null,
      distributorProposition3Data:    body.distributorProposition3Data             ?? null,
      pricingAnalysisData:            body.pricingAnalysisData                     ?? null,
      showDemoNote:                   body.showDemoNote === true,
    })

    const shareUrl = `${getOrigin(request)}/shared/${id}`
    return NextResponse.json({ id, shareUrl }, { status: 201 })

  } catch (err) {
    if (err instanceof StorageError) {
      if (err.code === 'TOO_LARGE') {
        return NextResponse.json({ error: err.message }, { status: 413 })
      }
      if (err.code === 'WRITE_FAILED') {
        console.error('[dashboards/save] Write failed:', err)
        return NextResponse.json(
          { error: 'Could not persist the dashboard. Please try again.' },
          { status: 503 }
        )
      }
    }
    console.error('[dashboards/save] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving the dashboard.' },
      { status: 500 }
    )
  }
}
