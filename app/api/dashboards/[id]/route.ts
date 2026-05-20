import { NextRequest, NextResponse } from 'next/server'
import { loadDashboard, StorageError } from '@/lib/dashboard-storage'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing dashboard ID.' }, { status: 400 })
  }

  try {
    const snapshot = await loadDashboard(id)

    if (!snapshot) {
      return NextResponse.json(
        {
          error: 'Dashboard not found.',
          detail: 'This link may be invalid, or the dashboard was never saved. Please ask the sender for a new link.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(snapshot)

  } catch (err) {
    if (err instanceof StorageError && err.code === 'INVALID_ID') {
      return NextResponse.json(
        { error: 'The dashboard ID in this link is not valid.' },
        { status: 400 }
      )
    }

    console.error('[dashboards/[id]] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred while loading the dashboard. Please try again.' },
      { status: 500 }
    )
  }
}
