'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useDashboardStore } from '@/lib/store'
import { DashboardShell } from '@/components/DashboardShell'
import type { DashboardDocument } from '@/lib/dashboard-mongo'
import { parseIntelligenceSheet } from '@/lib/intelligence-sheet-types'

export default function SharedDashboardPage() {
  const params = useParams()
  const id = params?.id as string

  const {
    setData,
    setDashboardName,
    setCurrency,
    setIntelligenceType,
    setRawIntelligenceData,
    setProposition2Data,
    setProposition3Data,
    setDistributorRawIntelligenceData,
    setDistributorProposition2Data,
    setDistributorProposition3Data,
    setPricingAnalysisData,
    setShowDemoNote,
    loadDefaultFilters,
    clearData,
  } = useDashboardStore()

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) {
      setErrorMsg('Invalid dashboard link.')
      setStatus('error')
      return
    }

    async function load() {
      try {
        const res = await fetch(`/api/dashboards/${id}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }

        const snapshot: DashboardDocument = await res.json()

        // Clear any previously loaded dashboard before hydrating
        clearData()

        if (snapshot.data) {
          setData(snapshot.data)
          loadDefaultFilters()
        }
        setDashboardName(snapshot.name || null)
        setCurrency(snapshot.currency || 'USD')
        if (snapshot.intelligenceType) setIntelligenceType(snapshot.intelligenceType)
        const rawIntel = parseIntelligenceSheet(snapshot.rawIntelligenceData)
        if (rawIntel) setRawIntelligenceData(rawIntel)
        const prop2 = parseIntelligenceSheet(snapshot.proposition2Data)
        if (prop2) setProposition2Data(prop2)
        const prop3 = parseIntelligenceSheet(snapshot.proposition3Data)
        if (prop3) setProposition3Data(prop3)
        const distRaw = parseIntelligenceSheet(snapshot.distributorRawIntelligenceData)
        if (distRaw) setDistributorRawIntelligenceData(distRaw)
        const distProp2 = parseIntelligenceSheet(snapshot.distributorProposition2Data)
        if (distProp2) setDistributorProposition2Data(distProp2)
        const distProp3 = parseIntelligenceSheet(snapshot.distributorProposition3Data)
        if (distProp3) setDistributorProposition3Data(distProp3)
        if (snapshot.pricingAnalysisData) setPricingAnalysisData(snapshot.pricingAnalysisData)
        setShowDemoNote(snapshot.showDemoNote || false)

        setStatus('ready')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard'
        setErrorMsg(msg)
        setStatus('error')
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Not Found</h1>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <a
            href="/dashboard-builder"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create a New Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Pass readOnly so the "Dashboard Builder" button is hidden for clients
  return <DashboardShell readOnly />
}
