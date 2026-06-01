import { NextRequest, NextResponse } from 'next/server'
import { upsertDashboard, getDashboard, isValidDashboardId } from '@/lib/dashboard-mongo'
import { assignPartition } from '@/lib/partition'
import { cacheSet, cacheInvalidate } from '@/lib/slave-cache'
import { getPublicAppOrigin } from '@/lib/app-origin'
import { parseIntelligenceSheet } from '@/lib/intelligence-sheet-types'
import { getPublicMongoErrorMessage } from '@/lib/mongo-errors'
import { getMongoUri } from '@/lib/mongo-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!getMongoUri()) {
    return NextResponse.json(
      {
        error:
          'Database is not configured on the server. In Vercel → Settings → Environment Variables, add MONGODB_URI (same as your .env.local), then redeploy.',
      },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body is not valid JSON.' }, { status: 400 })
  }

  const { data, rawIntelligenceData, pricingAnalysisData, dashboardId } = body

  if (!data && !rawIntelligenceData && !pricingAnalysisData) {
    return NextResponse.json(
      { error: 'No dashboard data provided. Upload at least one data file before generating a link.' },
      { status: 400 }
    )
  }

  try {
    const existingId = isValidDashboardId(dashboardId) ? (dashboardId as string) : null

    let partitionKey = 0
    if (existingId) {
      const existing = await getDashboard(existingId)
      partitionKey = existing?.partitionKey ?? (await assignPartition())
    } else {
      partitionKey = await assignPartition()
    }

    const payload = {
      name: typeof body.name === 'string' ? body.name : 'Untitled Dashboard',
      currency: body.currency === 'INR' ? ('INR' as const) : ('USD' as const),
      partitionKey,
      data: (body.data as any) ?? null,
      intelligenceType: (body.intelligenceType as any) ?? null,
      rawIntelligenceData: parseIntelligenceSheet(body.rawIntelligenceData),
      proposition2Data: parseIntelligenceSheet(body.proposition2Data),
      proposition3Data: parseIntelligenceSheet(body.proposition3Data),
      distributorRawIntelligenceData: parseIntelligenceSheet(body.distributorRawIntelligenceData),
      distributorProposition2Data: parseIntelligenceSheet(body.distributorProposition2Data),
      distributorProposition3Data: parseIntelligenceSheet(body.distributorProposition3Data),
      pricingAnalysisData: body.pricingAnalysisData ?? null,
      showDemoNote: body.showDemoNote === true,
    }

    const id = await upsertDashboard(existingId, payload)

    try {
      cacheInvalidate(id, partitionKey)
      cacheSet(id, partitionKey, {
        _id: id,
        ...payload,
        readCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (cacheErr) {
      console.warn('[dashboards/save] Cache warm failed (non-fatal):', cacheErr)
    }

    const origin = getPublicAppOrigin(request)
    if (!origin) {
      return NextResponse.json(
        {
          error:
            'Could not determine a public URL for this link. Set NEXT_PUBLIC_APP_URL on Vercel to your site URL (e.g. https://your-app.vercel.app) and redeploy.',
        },
        { status: 500 }
      )
    }

    const shareUrl = `${origin}/shared/${id}`
    return NextResponse.json({ id, shareUrl }, { status: 201 })
  } catch (err) {
    console.error('[dashboards/save] Error:', err)
    const { message, status } = getPublicMongoErrorMessage(err)
    return NextResponse.json({ error: message }, { status })
  }
}
