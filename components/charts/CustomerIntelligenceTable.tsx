'use client'

import { useState, useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { Users } from 'lucide-react'

interface ParentHeader {
  name: string
  startCol: number
  colSpan: number
}

interface PropositionData {
  headers: string[]
  rows: Record<string, any>[]
  parentHeaders?: ParentHeader[] | null
}

// Define a fixed color palette for sections - each section gets a distinct color
// Colors are designed to be visually distinct and accessible
const sectionColorPalette = [
  { header: '#F5DEB3', subHeader: '#FAEBD7', row: '#FDF8F0', rowAlt: '#FBF4E9', border: '#DEB887' },      // Wheat/Tan - Customer Info
  { header: '#87CEEB', subHeader: '#B0E2FF', row: '#E6F3FA', rowAlt: '#D6EBFA', border: '#5CACEE' },      // Sky Blue - Contact Details
  { header: '#DDA0DD', subHeader: '#E6C3E6', row: '#F5EBF5', rowAlt: '#EDE3ED', border: '#BA55D3' },      // Plum/Purple - Professional Drivers
  { header: '#98D8C8', subHeader: '#B8E8D8', row: '#E8F8F3', rowAlt: '#DEF4ED', border: '#66CDAA' },      // Mint/Teal - Purchasing Behavior
  { header: '#F0E68C', subHeader: '#F5EFB8', row: '#FDFBE6', rowAlt: '#FCF9DC', border: '#DAA520' },      // Khaki/Gold - Solution Requirements
  { header: '#FFB6C1', subHeader: '#FFC8D0', row: '#FFF0F3', rowAlt: '#FFE8EC', border: '#FF69B4' },      // Light Pink
  { header: '#90EE90', subHeader: '#B0F4B0', row: '#E8FBE8', rowAlt: '#DEF7DE', border: '#32CD32' },      // Light Green
  { header: '#FFA07A', subHeader: '#FFB899', row: '#FFF0EB', rowAlt: '#FFE8E0', border: '#FA8072' },      // Light Salmon/Orange
  { header: '#ADD8E6', subHeader: '#C5E5F0', row: '#EBF5FA', rowAlt: '#E0F0F7', border: '#6495ED' },      // Light Blue
  { header: '#D8BFD8', subHeader: '#E5D5E5', row: '#F5EFF5', rowAlt: '#EDE5ED', border: '#9370DB' },      // Thistle/Lavender
]

// Keyword-based color mapping for better semantic matching
const parentHeaderKeywords: Record<string, number> = {
  // Customer/Company Information - Index 0 (Wheat/Tan)
  'customer': 0, 'company': 0, 'business': 0, 'organization': 0, 'information': 0,

  // Contact Details - Index 1 (Sky Blue)
  'contact': 1, 'communication': 1, 'email': 1, 'phone': 1,

  // Professional Drivers - Index 2 (Plum/Purple)
  'professional': 2, 'driver': 2, 'motivation': 2, 'pain': 2, 'trigger': 2,

  // Purchasing Behavior - Index 3 (Mint/Teal)
  'purchasing': 3, 'procurement': 3, 'behavior': 3, 'metric': 3, 'budget': 3,

  // Solution Requirements - Index 4 (Khaki/Gold)
  'solution': 4, 'requirement': 4, 'expectation': 4, 'integration': 4, 'performance': 4,

  // Other categories
  'fleet': 5, 'operation': 5, 'aircraft': 5,
  'growth': 6, 'expansion': 6,
  'maintenance': 7,
  'financial': 8, 'payment': 8,
  'location': 9, 'region': 9,
}

// Get color palette index for a parent header based on its name
const getColorIndexForHeader = (name: string, fallbackIndex: number): number => {
  if (!name || name.trim() === '') {
    return fallbackIndex % sectionColorPalette.length
  }
  const lowerName = name.toLowerCase()
  for (const [keyword, colorIndex] of Object.entries(parentHeaderKeywords)) {
    if (lowerName.includes(keyword)) {
      return colorIndex
    }
  }
  return fallbackIndex % sectionColorPalette.length
}


// Build a mapping of column index to section color index
function buildColumnColorMap(parentHeaders: ParentHeader[] | null | undefined, totalColumns: number): number[] {
  const colorMap: number[] = []

  if (parentHeaders && parentHeaders.length > 0) {
    parentHeaders.forEach((ph, sectionIndex) => {
      const colorIndex = getColorIndexForHeader(ph.name, sectionIndex)
      for (let i = 0; i < ph.colSpan; i++) {
        colorMap.push(colorIndex)
      }
    })
  }

  // Fill remaining columns with cycling colors if needed
  while (colorMap.length < totalColumns) {
    colorMap.push(colorMap.length % sectionColorPalette.length)
  }

  return colorMap
}

// Table component for displaying proposition data
function PropositionTableContent({ data }: { data: PropositionData }) {
  const headers = data.headers || Object.keys(data.rows[0] || {})
  const parentHeaders = data.parentHeaders

  // Build color map for columns
  const columnColorMap = buildColumnColorMap(parentHeaders, headers.length)

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Parent Headers Row (if available) */}
        {parentHeaders && parentHeaders.length > 0 && (
          <thead>
            <tr>
              {parentHeaders.map((ph, index) => {
                const colorIndex = getColorIndexForHeader(ph.name, index)
                const colors = sectionColorPalette[colorIndex]
                return (
                  <th
                    key={index}
                    colSpan={ph.colSpan}
                    className="px-4 py-3 text-center text-sm font-bold text-black uppercase tracking-wider border-r last:border-r-0"
                    style={{
                      backgroundColor: colors.header,
                      borderColor: colors.border
                    }}
                  >
                    {ph.name || ''}
                  </th>
                )
              })}
            </tr>
          </thead>
        )}
        {/* Child Headers Row - Section-based colors */}
        <thead>
          <tr>
            {headers.map((header, index) => {
              const colorIndex = columnColorMap[index]
              const colors = sectionColorPalette[colorIndex]
              return (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-r last:border-r-0"
                  style={{
                    backgroundColor: colors.subHeader,
                    borderColor: colors.border
                  }}
                >
                  {header}
                </th>
              )
            })}
          </tr>
        </thead>
        {/* Table Body - Section-based alternating colors */}
        <tbody className="divide-y divide-gray-200">
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => {
                const colorIndex = columnColorMap[colIndex]
                const colors = sectionColorPalette[colorIndex]
                return (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-sm text-black border-r last:border-r-0"
                    style={{
                      backgroundColor: rowIndex % 2 === 0 ? colors.row : colors.rowAlt,
                      borderColor: `${colors.border}40`
                    }}
                  >
                    {row[header] !== undefined && row[header] !== null && row[header] !== ''
                      ? String(row[header])
                      : <span className="text-gray-400">-</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CustomerIntelligenceTableProps {
  title?: string
}

type TabType = 'prop1' | 'prop2' | 'prop3'

export function CustomerIntelligenceTable({ title }: CustomerIntelligenceTableProps) {
  const {
    rawIntelligenceData,
    proposition2Data,
    proposition3Data,
    intelligenceType
  } = useDashboardStore()

  // Determine which tabs have data
  const hasProp1 = rawIntelligenceData && rawIntelligenceData.rows && rawIntelligenceData.rows.length > 0
  const hasProp2 = proposition2Data && proposition2Data.rows && proposition2Data.rows.length > 0
  const hasProp3 = proposition3Data && proposition3Data.rows && proposition3Data.rows.length > 0

  // Get the first available tab
  const getDefaultTab = (): TabType => {
    if (hasProp1) return 'prop1'
    if (hasProp2) return 'prop2'
    if (hasProp3) return 'prop3'
    return 'prop1'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab())

  // Update active tab when data changes
  useEffect(() => {
    const currentTabHasData =
      (activeTab === 'prop1' && hasProp1) ||
      (activeTab === 'prop2' && hasProp2) ||
      (activeTab === 'prop3' && hasProp3)

    if (!currentTabHasData) {
      setActiveTab(getDefaultTab())
    }
  }, [rawIntelligenceData, proposition2Data, proposition3Data])

  // Check if we have any data to display
  const hasData = hasProp1 || hasProp2 || hasProp3

  if (!hasData) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-black font-medium mb-2">No Customer Intelligence Data Available</p>
        <p className="text-sm text-gray-600">
          Upload Excel files in the Dashboard Builder to display customer intelligence tables.
        </p>
      </div>
    )
  }

  const typeLabel = intelligenceType === 'distributor' ? 'Distributor' : 'Customer'

  // Tab configuration
  const tabs = [
    { id: 'prop1' as TabType, label: 'Proposition 1', sublabel: 'Basic', hasData: hasProp1, count: rawIntelligenceData?.rows?.length || 0, color: '#FFC107' },
    { id: 'prop2' as TabType, label: 'Proposition 2', sublabel: 'Advance', hasData: hasProp2, count: proposition2Data?.rows?.length || 0, color: '#FFB300' },
    { id: 'prop3' as TabType, label: 'Proposition 3', sublabel: 'Premium', hasData: hasProp3, count: proposition3Data?.rows?.length || 0, color: '#FFA000' },
  ]

  // Get active data
  const getActiveData = (): PropositionData | null => {
    switch (activeTab) {
      case 'prop1': return rawIntelligenceData as PropositionData | null
      case 'prop2': return proposition2Data as PropositionData | null
      case 'prop3': return proposition3Data as PropositionData | null
      default: return null
    }
  }

  const activeData = getActiveData()
  const availableTabs = tabs.filter(tab => tab.hasData)

  return (
    <div className="w-full">
      {/* Main Title */}
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {typeLabel} intelligence data organized by proposition level
          </p>
        </div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-4">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-black shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? tab.color : undefined
            }}
          >
            <span>{tab.label}</span>
            <span className={`text-xs ${activeTab === tab.id ? 'text-gray-700' : 'text-gray-500'}`}>
              ({tab.sublabel})
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-black/10 text-black' : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Table Content */}
      {activeData && activeData.rows && activeData.rows.length > 0 && (
        <PropositionTableContent data={activeData} />
      )}

      {/* Summary Footer */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            Total Records: {' '}
            <span className="font-semibold text-black">
              {(rawIntelligenceData?.rows?.length || 0) +
               (proposition2Data?.rows?.length || 0) +
               (proposition3Data?.rows?.length || 0)}
            </span>
          </span>
          <span className="text-gray-600">
            Available Propositions: {' '}
            {availableTabs.map(t => t.sublabel).join(', ') || 'None'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CustomerIntelligenceTable
