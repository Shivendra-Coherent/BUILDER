'use client'

import { useEffect, useState, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'
import { createMockData } from '@/lib/mock-data'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { EnhancedFilterPanel } from '@/components/filters/EnhancedFilterPanel'
import { GroupedBarChart } from '@/components/charts/GroupedBarChart'
import { MultiLineChart } from '@/components/charts/MultiLineChart'
import { MatrixHeatmap } from '@/components/charts/MatrixHeatmap'
import { ComparisonTable } from '@/components/charts/ComparisonTable'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { D3BubbleChartIndependent } from '@/components/charts/D3BubbleChartIndependent'
import { CompetitiveIntelligence } from '@/components/charts/CompetitiveIntelligence'
import DistributorsIntelligence from '@/components/charts/DistributorsIntelligenceTable'
import { CustomerIntelligenceTable } from '@/components/charts/CustomerIntelligenceTable'
import { PricingAnalysisView } from '@/components/charts/PricingAnalysisView'
import { InsightsPanel } from '@/components/InsightsPanel'
import { FilterPresets } from '@/components/filters/FilterPresets'
import { ChartGroupSelector } from '@/components/filters/ChartGroupSelector'
import { CustomScrollbar } from '@/components/ui/CustomScrollbar'
import { GlobalKPICards } from '@/components/GlobalKPICards'
import { DashboardBuilderDownload } from '@/components/DashboardBuilderDownload'
import { getChartsForGroup } from '@/lib/chart-groups'
import { Lightbulb, X, Layers, LayoutGrid, Settings, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const {
    setData,
    setLoading,
    setError,
    data,
    isLoading,
    error,
    filters,
    selectedChartGroup,
    dashboardName,
    rawIntelligenceData,
    proposition2Data,
    proposition3Data,
    intelligenceType,
    pricingAnalysisData
  } = useDashboardStore()
  const [mounted, setMounted] = useState(false)
  const [hasCheckedStore, setHasCheckedStore] = useState(false)
  const [activeTab, setActiveTab] = useState<'bar' | 'line' | 'heatmap' | 'table' | 'waterfall' | 'bubble' | 'competitive-intelligence' | 'customer-intelligence' | 'pricing-bar' | 'pricing-line' | 'pricing-heatmap' | 'pricing-table'>('bar')
  const [showInsights, setShowInsights] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'tabs' | 'vertical'>('tabs')
  const sidebarScrollRef = useRef<HTMLDivElement>(null)

  // Check what data is available
  const hasMarketData = !!data
  const hasIntelligenceData = (rawIntelligenceData && rawIntelligenceData.rows && rawIntelligenceData.rows.length > 0) ||
                              (proposition2Data && proposition2Data.rows && proposition2Data.rows.length > 0) ||
                              (proposition3Data && proposition3Data.rows && proposition3Data.rows.length > 0)
  const hasPricingData = !!(pricingAnalysisData?.data?.value?.geography_segment_matrix?.length)
  const hasAnyData = hasMarketData || hasIntelligenceData || hasPricingData

  // Get visible charts based on selected chart group
  const visibleCharts = getChartsForGroup(selectedChartGroup)

  // Helper function to check if a chart should be visible
  const isChartVisible = (chartId: string): boolean => {
    // If no market data, only show customer intelligence
    if (!hasMarketData && chartId !== 'customer-intelligence') {
      return false
    }
    return visibleCharts.includes(chartId)
  }

  // Map chart IDs to tab values
  const chartIdToTab: Record<string, typeof activeTab> = {
    'grouped-bar': 'bar',
    'multi-line': 'line',
    'heatmap': 'heatmap',
    'comparison-table': 'table',
    'waterfall': 'waterfall',
    'bubble': 'bubble',
    'competitive-intelligence': 'competitive-intelligence',
    'customer-intelligence': 'customer-intelligence',
    'pricing-grouped-bar': 'pricing-bar',
    'pricing-multi-line': 'pricing-line',
    'pricing-heatmap': 'pricing-heatmap',
    'pricing-comparison-table': 'pricing-table'
  }

  // Auto-switch to first available tab when chart group changes or data availability changes
  useEffect(() => {
    // If only intelligence data, always show customer intelligence tab
    if (!hasMarketData && hasIntelligenceData) {
      setActiveTab('customer-intelligence')
      return
    }

    const firstVisibleChart = visibleCharts[0]
    if (firstVisibleChart && chartIdToTab[firstVisibleChart]) {
      setActiveTab(chartIdToTab[firstVisibleChart])
    }
  }, [selectedChartGroup, hasMarketData, hasIntelligenceData])

  // Auto-switch to heatmap when matrix mode is selected
  useEffect(() => {
    if (filters.viewMode === 'matrix' && isChartVisible('heatmap')) {
      setActiveTab('heatmap')
    }
  }, [filters.viewMode])

  useEffect(() => {
    setMounted(true)

    // Check if data already exists in store (from dashboard builder)
    const storeState = useDashboardStore.getState()
    const existingData = storeState.data
    const existingIntelligence = storeState.rawIntelligenceData || storeState.proposition2Data || storeState.proposition3Data

    if ((existingData || existingIntelligence) && !hasCheckedStore) {
      // Data already exists from dashboard builder, don't reload
      console.log('✅ Using existing data from store (from Dashboard Builder)')
      setHasCheckedStore(true)
      setLoading(false)
      // Load default filters for existing data if we have market data
      if (existingData) {
        const { loadDefaultFilters } = useDashboardStore.getState()
        loadDefaultFilters()
      }
      return
    }

    // Only load from API if we haven't checked the store yet and no data exists
    if (hasCheckedStore) {
      return
    }

    setHasCheckedStore(true)

    // Load data from API only if no data exists in store
    async function loadData() {
      try {
        setLoading(true)

        // Fetch data from API with default paths
        const response = await fetch('/api/process-data?valuePath=value.json&volumePath=volume.json&segmentationPath=segmentation_analysis.json')

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.details || `Failed to load data: ${response.statusText}`
          const debugInfo = errorData.debug ? `\nDebug: ${JSON.stringify(errorData.debug, null, 2)}` : ''
          throw new Error(`${errorMessage}${debugInfo}`)
        }

        const data = await response.json()
        setData(data) // This will automatically set default filters via store

        // Explicitly load default filters (redundant but ensures it happens)
        const { loadDefaultFilters } = useDashboardStore.getState()
        loadDefaultFilters()
      } catch (err) {
        console.error('Error loading data:', err)
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        console.error('Full error details:', {
          message: errorMessage,
          error: err
        })
        // Fallback to mock data if API fails
        console.warn('Falling back to mock data')
        const mockData = createMockData()
        setData(mockData)
        setError(`${errorMessage}. Using mock data.`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setData, setLoading, setError, hasCheckedStore])

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-black">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !hasAnyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-2xl font-semibold mb-3">Error</div>
          <p className="text-black mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // No data at all - show prompt to use dashboard builder
  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="container mx-auto px-6 py-6 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Coherent Market Insights Logo"
                width={150}
                height={60}
                className="h-auto w-auto max-w-[150px]"
                priority
              />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-black mb-1">
                  Coherent Dashboard
                </h1>
                <h2 className="text-sm text-black">
                  {dashboardName || 'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/dashboard-builder')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard Builder</span>
              </button>
            </div>
          </div>

          {/* No Data Message */}
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-black mb-2">No Data Available</h2>
              <p className="text-gray-600 mb-6">
                Upload your data files using the Dashboard Builder to get started. You can upload market intelligence data, customer/distributor intelligence, or both.
              </p>
              <button
                onClick={() => router.push('/dashboard-builder')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Dashboard Builder
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Intelligence-only mode (no market data)
  if (!hasMarketData && hasIntelligenceData) {
    const typeLabel = intelligenceType === 'distributor' ? 'Distributor' : 'Customer'

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="container mx-auto px-6 py-6 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Coherent Market Insights Logo"
                width={150}
                height={60}
                className="h-auto w-auto max-w-[150px]"
                priority
              />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-black mb-1">
                  Coherent Dashboard
                </h1>
                <h2 className="text-sm text-black">
                  {dashboardName || `${typeLabel} Intelligence`}
                </h2>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/dashboard-builder')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard Builder</span>
              </button>
            </div>
          </div>

          {/* Intelligence Data Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomerIntelligenceTable
              title={`${typeLabel} Intelligence Database`}
            />
          </div>
        </div>

        {/* Dashboard Builder Download Button */}
        <DashboardBuilderDownload />

        <Footer />
      </div>
    )
  }

  // Full dashboard with market data (and optionally intelligence data)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 flex-1">
        {/* Header with Logo */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Coherent Market Insights Logo"
              width={150}
              height={60}
              className="h-auto w-auto max-w-[150px]"
              priority
            />
          </div>

          {/* Centered Title and Subtitle */}
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black mb-1">
                Coherent Dashboard
              </h1>
              <h2 className="text-sm text-black">
                {dashboardName || ' Market Analysis'}
              </h2>
            </div>
          </div>

          {/* Dashboard Builder Button on the right */}
          <div className="flex-shrink-0 flex items-center">
            <button
              onClick={() => router.push('/dashboard-builder')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              title="Open Dashboard Builder to upload Excel/CSV files"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Dashboard Builder</span>
            </button>
          </div>
        </div>

        {/* Global KPI Cards - Only show when market data exists */}
        <div className="mb-6">
          <GlobalKPICards />
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Enhanced Filter Panel */}
          <aside className={`transition-all duration-300 ${
            sidebarCollapsed
              ? 'col-span-12 lg:col-span-1'
              : 'col-span-12 lg:col-span-3'
          }`}>
            {sidebarCollapsed ? (
              <div className="sticky top-6">
                <div className="bg-white rounded-lg shadow-sm p-2 space-y-4">
                  <button
                    onClick={() => {
                      setShowInsights(false)
                      setSidebarCollapsed(false)
                    }}
                    className="w-full flex flex-col items-center gap-1 py-2 hover:bg-gray-50 rounded"
                    title="Expand Filters"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs text-black">Filters</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="sticky top-6 self-start">
                <div className="max-h-[calc(100vh-6rem)] relative">
                  <CustomScrollbar containerRef={sidebarScrollRef}>
                    <div ref={sidebarScrollRef} className="overflow-y-auto pr-6 space-y-3 sidebar-scroll max-h-[calc(100vh-6rem)]">
                      <ChartGroupSelector />
                      <FilterPresets />
                      <EnhancedFilterPanel />
                    </div>
                  </CustomScrollbar>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className={`transition-all duration-300 ${
            sidebarCollapsed
              ? showInsights
                ? 'col-span-12 lg:col-span-8'
                : 'col-span-12 lg:col-span-11'
              : showInsights
                ? 'col-span-12 lg:col-span-6'
                : 'col-span-12 lg:col-span-9'
          } space-y-6`}>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <nav className="flex items-center -mb-px">
                    {/* View Mode Toggle */}
                    <div className="flex gap-1 mr-4 ml-4 py-2">
                      <button
                        onClick={() => setViewMode('tabs')}
                        className={`p-1.5 rounded ${
                          viewMode === 'tabs'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-black hover:text-black'
                        }`}
                        title="Tab View"
                      >
                        <Layers className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('vertical')}
                        className={`p-1.5 rounded ${
                          viewMode === 'vertical'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-black hover:text-black'
                        }`}
                        title="Vertical View (All Charts)"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Tab Buttons - Only show in tabs mode */}
                    {viewMode === 'tabs' && (
                      <>
                        {isChartVisible('grouped-bar') && (
                          <button
                            onClick={() => setActiveTab('bar')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'bar'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Grouped Bar Chart
                          </button>
                        )}
                        {isChartVisible('multi-line') && (
                          <button
                            onClick={() => setActiveTab('line')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'line'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Line Chart
                          </button>
                        )}
                        {isChartVisible('heatmap') && (
                          <button
                            onClick={() => setActiveTab('heatmap')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'heatmap'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Heatmap
                          </button>
                        )}
                        {isChartVisible('comparison-table') && (
                          <button
                            onClick={() => setActiveTab('table')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'table'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Table
                          </button>
                        )}
                        {isChartVisible('waterfall') && (
                          <button
                            onClick={() => setActiveTab('waterfall')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'waterfall'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Waterfall
                          </button>
                        )}
                        {isChartVisible('bubble') && (
                          <button
                            onClick={() => setActiveTab('bubble')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'bubble'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Bubble Chart
                          </button>
                        )}
                        {isChartVisible('customer-intelligence') && (
                          <button
                            onClick={() => setActiveTab('customer-intelligence')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'customer-intelligence'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Customer Intelligence
                          </button>
                        )}
                        {/* Pricing Analysis Tabs */}
                        {isChartVisible('pricing-grouped-bar') && (
                          <button
                            onClick={() => setActiveTab('pricing-bar')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'pricing-bar'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Pricing Bar
                          </button>
                        )}
                        {isChartVisible('pricing-multi-line') && (
                          <button
                            onClick={() => setActiveTab('pricing-line')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'pricing-line'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Pricing Line
                          </button>
                        )}
                        {isChartVisible('pricing-heatmap') && (
                          <button
                            onClick={() => setActiveTab('pricing-heatmap')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'pricing-heatmap'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Pricing Heatmap
                          </button>
                        )}
                        {isChartVisible('pricing-comparison-table') && (
                          <button
                            onClick={() => setActiveTab('pricing-table')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === 'pricing-table'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-black hover:text-black hover:border-gray-300'
                            }`}
                          >
                            Pricing Table
                          </button>
                        )}
                      </>
                    )}
                  </nav>

                  {/* Insights Button */}
                  <div className="flex gap-2 px-4">
                    <button
                      onClick={() => {
                        setShowInsights(!showInsights)
                        setSidebarCollapsed(!showInsights)
                      }}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                        showInsights
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'text-black hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <Lightbulb className="h-4 w-4" />
                      Insights
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {viewMode === 'tabs' ? (
                  <>
                    {activeTab === 'bar' && (
                      <div id="grouped-bar-chart">
                        <GroupedBarChart
                          title="Comparative Analysis - Grouped Bars"
                          height={450}
                        />
                      </div>
                    )}

                    {activeTab === 'line' && (
                      <div id="line-chart">
                        <MultiLineChart
                          title="Trend Analysis - Multiple Series"
                          height={450}
                        />
                      </div>
                    )}

                    {activeTab === 'heatmap' && (
                      <div id="heatmap-chart">
                        <MatrixHeatmap
                          title="Matrix View - Geography x Segment"
                          height={450}
                        />
                      </div>
                    )}

                    {activeTab === 'table' && (
                      <div id="comparison-table">
                        <ComparisonTable
                          title="Data Comparison Table"
                          height={500}
                        />
                      </div>
                    )}

                    {activeTab === 'waterfall' && (
                      <div id="waterfall-chart">
                        <WaterfallChart
                          title="Contribution Analysis - Waterfall Chart"
                          height={450}
                        />
                      </div>
                    )}

                    {activeTab === 'bubble' && (
                      <div id="bubble-chart">
                        <D3BubbleChartIndependent
                          title="Coherent Opportunity Matrix"
                          height={500}
                        />
                      </div>
                    )}

                    {activeTab === 'competitive-intelligence' && (
                      <div id="competitive-intelligence-chart">
                        <CompetitiveIntelligence
                          height={600}
                        />
                      </div>
                    )}

                    {activeTab === 'customer-intelligence' && (
                      <div id="customer-intelligence-chart" className="space-y-8">
                        {/* Customer Intelligence Tables from Excel Upload */}
                        <div>
                          <CustomerIntelligenceTable
                            title="Customer Intelligence Database"
                          />
                        </div>
                        {/* Distributors Intelligence Table */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                          <DistributorsIntelligence
                            title="Distributors Intelligence Database"
                            height={500}
                          />
                        </div>
                      </div>
                    )}

                    {/* Pricing Analysis Views */}
                    {activeTab === 'pricing-bar' && (
                      <div id="pricing-bar-chart">
                        <PricingAnalysisView activeTab="bar" />
                      </div>
                    )}

                    {activeTab === 'pricing-line' && (
                      <div id="pricing-line-chart">
                        <PricingAnalysisView activeTab="line" />
                      </div>
                    )}

                    {activeTab === 'pricing-heatmap' && (
                      <div id="pricing-heatmap-chart">
                        <PricingAnalysisView activeTab="heatmap" />
                      </div>
                    )}

                    {activeTab === 'pricing-table' && (
                      <div id="pricing-table-chart">
                        <PricingAnalysisView activeTab="table" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-8">
                    {isChartVisible('grouped-bar') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Grouped Bar Chart</h3>
                        <GroupedBarChart
                          title="Comparative Analysis - Grouped Bars"
                          height={400}
                        />
                      </div>
                    )}

                    {isChartVisible('multi-line') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Line Chart</h3>
                        <MultiLineChart
                          title="Trend Analysis - Multiple Series"
                          height={400}
                        />
                      </div>
                    )}

                    {isChartVisible('heatmap') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Heatmap</h3>
                        <MatrixHeatmap
                          title="Matrix View - Geography x Segment"
                          height={400}
                        />
                      </div>
                    )}

                    {isChartVisible('comparison-table') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Data Table</h3>
                        <ComparisonTable
                          title="Data Comparison Table"
                          height={400}
                        />
                      </div>
                    )}

                    {isChartVisible('waterfall') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Waterfall Chart</h3>
                        <WaterfallChart
                          title="Contribution Analysis - Waterfall Chart"
                          height={400}
                        />
                      </div>
                    )}

                    {isChartVisible('bubble') && (
                      <div className="border-b pb-8">
                        <h3 className="text-lg font-semibold text-black mb-4">Bubble Chart</h3>
                        <D3BubbleChartIndependent
                          title="Coherent Opportunity Matrix"
                          height={450}
                        />
                      </div>
                    )}

                    {isChartVisible('competitive-intelligence') && (
                      <div className="border-b pb-8">
                        <CompetitiveIntelligence
                          height={600}
                        />
                      </div>
                    )}

                    {isChartVisible('customer-intelligence') && (
                      <div className="space-y-8">
                        {/* Customer Intelligence Tables from Excel Upload */}
                        <div className="border-b pb-8">
                          <h3 className="text-lg font-semibold text-black mb-4">Customer Intelligence Database</h3>
                          <CustomerIntelligenceTable
                            title=""
                          />
                        </div>
                        {/* Distributors Intelligence Table */}
                        <div>
                          <h3 className="text-lg font-semibold text-black mb-4">Distributors Intelligence Database</h3>
                          <DistributorsIntelligence
                            title="Distributors Intelligence Database"
                            height={500}
                          />
                        </div>
                      </div>
                    )}

                    {/* Pricing Analysis in Vertical View */}
                    {isChartVisible('pricing-grouped-bar') && (
                      <div className="border-b pb-8">
                        <PricingAnalysisView activeTab="bar" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Insights Panel */}
          {showInsights && (
            <aside className="col-span-12 lg:col-span-3 transition-all duration-300">
              <div className="sticky top-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-black flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Key Insights
                      </h2>
                      <button
                        onClick={() => {
                          setShowInsights(false)
                          setSidebarCollapsed(false)
                        }}
                        className="rounded-md text-black hover:text-black focus:outline-none"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-black mt-1">
                      Auto-generated analysis
                    </p>
                  </div>

                  <div
                    className="px-4 py-3 overflow-y-auto sidebar-scroll"
                    style={{
                      maxHeight: 'calc(100vh - 8rem)',
                      overflowY: 'auto',
                      minHeight: 'auto'
                    }}
                    id="insights-panel"
                  >
                    <InsightsPanel />
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Dashboard Builder Download Button - Shows after previewing */}
      <DashboardBuilderDownload />

      {/* Footer */}
      <Footer />
    </div>
  )
}
