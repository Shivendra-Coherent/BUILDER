'use client'

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, Eye, Users, Building2, ArrowRight, TrendingUp, DollarSign } from 'lucide-react'
import Image from 'next/image'
import { useDashboardStore } from '@/lib/store'
import type { ComparisonData } from '@/lib/types'
import { IntelligenceDataInput, type IntelligenceMode } from '@/components/dashboard-builder/IntelligenceDataInput'

function modeToStoreType(m: IntelligenceMode): 'customer' | 'distributor' | 'both' | null {
  if (m.customer && m.distributor) return 'both'
  if (m.customer) return 'customer'
  if (m.distributor) return 'distributor'
  return null
}

export default function DashboardBuilderPage() {
  const router = useRouter()
  const { 
    setData, 
    setLoading, 
    setError, 
    clearData,
    setIntelligenceType,
    setParentHeaders,
    setRawIntelligenceData,
    setProposition2Data,
    setProposition3Data,
    setDistributorRawIntelligenceData,
    setDistributorProposition2Data,
    setDistributorProposition3Data,
    setCompetitiveIntelligenceData,
    setPricingAnalysisData,
    setDashboardName,
    setCurrency,
    setShowDemoNote
  } = useDashboardStore()
  
  // Section 1: Market Intelligence
  const [dashboardNameInput, setDashboardNameInput] = useState('India Market Analysis')
  const [currencyInput, setCurrencyInput] = useState<'USD' | 'INR'>('USD')
  const [volumeUnitInput, setVolumeUnitInput] = useState<
    'million-units' | 'units' | 'th-units' | 'tons'
  >('units')
  const [valueFile, setValueFile] = useState<File | null>(null)
  const [volumeFile, setVolumeFile] = useState<File | null>(null)
  const [crossValueFile, setCrossValueFile] = useState<File | null>(null)
  const [crossVolumeFile, setCrossVolumeFile] = useState<File | null>(null)
  const [isProcessingMarket, setIsProcessingMarket] = useState(false)
  const [marketStatus, setMarketStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [marketStatusMessage, setMarketStatusMessage] = useState('')
  const [processedData, setProcessedData] = useState<ComparisonData | null>(null)
  const [showDemoNoteToggle, setShowDemoNoteToggle] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareLinkError, setShareLinkError] = useState<string | null>(null)
  
  // Section 2: Intelligence Data (Optional)
  const [intelMode, setIntelMode] = useState<IntelligenceMode>({ customer: true, distributor: false })
  const [customerIntelFile, setCustomerIntelFile] = useState<File | null>(null)
  const [customerIntelFileData, setCustomerIntelFileData] = useState<{ name: string; data: string } | null>(null)
  const [distributorIntelFile, setDistributorIntelFile] = useState<File | null>(null)
  const [distributorIntelFileData, setDistributorIntelFileData] = useState<{ name: string; data: string } | null>(null)
  const [intelProcessing, setIntelProcessing] = useState<null | 'customer' | 'distributor'>(null)
  const [customerIntelStatus, setCustomerIntelStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [customerIntelStatusMessage, setCustomerIntelStatusMessage] = useState('')
  const [distributorIntelStatus, setDistributorIntelStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [distributorIntelStatusMessage, setDistributorIntelStatusMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'market' | 'intelligence' | 'competitive' | 'pricing'>('market')

  useEffect(() => {
    setIntelligenceType(modeToStoreType(intelMode))
  }, [intelMode, setIntelligenceType])

  const [isDraggingCustomerIntel, setIsDraggingCustomerIntel] = useState(false)
  const [isDraggingDistributorIntel, setIsDraggingDistributorIntel] = useState(false)

  // Section 3: Competitive Intelligence Data
  const [competitiveFile, setCompetitiveFile] = useState<File | null>(null)
  const [isProcessingCompetitive, setIsProcessingCompetitive] = useState(false)
  const [competitiveStatus, setCompetitiveStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [competitiveStatusMessage, setCompetitiveStatusMessage] = useState('')

  // Section 4: Pricing Analysis Data
  const [pricingFile, setPricingFile] = useState<File | null>(null)
  const [isProcessingPricing, setIsProcessingPricing] = useState(false)
  const [pricingStatus, setPricingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [pricingStatusMessage, setPricingStatusMessage] = useState('')

  const handleValueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValueFile(e.target.files[0])
      setMarketStatus('idle')
      setMarketStatusMessage('')
      setProcessedData(null)
    }
  }

  const handleVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVolumeFile(e.target.files[0])
    }
  }

  const handleCrossValueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCrossValueFile(e.target.files[0])
    }
  }

  const handleCrossVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCrossVolumeFile(e.target.files[0])
    }
  }

  const readIntelFileToState = (
    file: File,
    setFile: Dispatch<SetStateAction<File | null>>,
    setFileData: Dispatch<SetStateAction<{ name: string; data: string } | null>>,
    setStatus: Dispatch<SetStateAction<'idle' | 'processing' | 'success' | 'error'>>,
    setStatusMessage: Dispatch<SetStateAction<string>>
  ) => {
    setFile(file)
    setStatus('idle')
    setStatusMessage('Reading file...')

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setFileData({ name: file.name, data: base64 })
            setStatusMessage('')
            console.log('Intelligence file read successfully:', file.name, 'base64 length:', base64.length)
          } else {
            throw new Error('Failed to extract base64 data')
          }
        } else {
          throw new Error('FileReader returned empty result')
        }
      } catch (error: any) {
        console.error('Error processing file:', error)
        setStatus('error')
        setStatusMessage(`Error reading file: ${error.message}`)
        setFileData(null)
      }
    }

    reader.onerror = () => {
      console.error('FileReader error:', reader.error)
      setStatus('error')
      const errorMsg = reader.error?.message || 'Unknown error'
      if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
        setStatusMessage('File cannot be read due to Windows permissions. Please copy the file to your Documents folder and try again.')
      } else {
        setStatusMessage(`Error reading file: ${errorMsg}`)
      }
      setFileData(null)
    }

    reader.readAsDataURL(file)
  }

  const handleCustomerIntelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      readIntelFileToState(f, setCustomerIntelFile, setCustomerIntelFileData, setCustomerIntelStatus, setCustomerIntelStatusMessage)
    }
  }

  const handleDistributorIntelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      readIntelFileToState(
        f,
        setDistributorIntelFile,
        setDistributorIntelFileData,
        setDistributorIntelStatus,
        setDistributorIntelStatusMessage
      )
    }
  }

  const handleCompetitiveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompetitiveFile(e.target.files[0])
      setCompetitiveStatus('idle')
      setCompetitiveStatusMessage('')
    }
  }

  // Drag and drop handlers - these often have different permission handling
  const processDroppedFile = (
    file: File,
    setFile: (f: File) => void,
    setFileData: (d: { name: string; data: string } | null) => void,
    setStatus: (s: 'idle' | 'processing' | 'success' | 'error') => void,
    setStatusMessage: (m: string) => void
  ) => {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValid = validTypes.some(type => fileName.endsWith(type))

    if (!isValid) {
      setStatus('error')
      setStatusMessage('Invalid file type. Please upload CSV, XLSX, or XLS files.')
      return
    }

    setFile(file)
    setStatus('idle')
    setStatusMessage('Reading dropped file...')

    // Read the file immediately using FileReader
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setFileData({ name: file.name, data: base64 })
            setStatusMessage('File ready for upload!')
            console.log('Dropped file read successfully:', file.name, 'base64 length:', base64.length)
          } else {
            throw new Error('Failed to extract base64 data')
          }
        } else {
          throw new Error('FileReader returned empty result')
        }
      } catch (error: any) {
        console.error('Error processing dropped file:', error)
        setStatus('error')
        setStatusMessage(`Error reading file: ${error.message}`)
        setFileData(null)
      }
    }

    reader.onerror = () => {
      console.error('FileReader error for dropped file:', reader.error)
      setStatus('error')
      const errorMsg = reader.error?.message || 'Unknown error'
      if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
        setStatusMessage('File cannot be read. Try copying the file to a different folder (e.g., Documents) first.')
      } else {
        setStatusMessage(`Error reading file: ${errorMsg}`)
      }
      setFileData(null)
    }

    reader.readAsDataURL(file)
  }

  // Intelligence file drop handlers
  const handleCustomerIntelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingCustomerIntel(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFile(
        files[0],
        setCustomerIntelFile,
        setCustomerIntelFileData,
        setCustomerIntelStatus,
        setCustomerIntelStatusMessage
      )
    }
  }

  const handleDistributorIntelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingDistributorIntel(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFile(
        files[0],
        setDistributorIntelFile,
        setDistributorIntelFileData,
        setDistributorIntelStatus,
        setDistributorIntelStatusMessage
      )
    }
  }

  // Generic drag event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, setDragging: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  // Generate a shareable permanent link for the current dashboard
  const handleGenerateLink = async () => {
    const storeState = useDashboardStore.getState()
    const {
      data,
      dashboardName: name,
      currency,
      intelligenceType,
      rawIntelligenceData,
      proposition2Data,
      proposition3Data,
      distributorRawIntelligenceData,
      distributorProposition2Data,
      distributorProposition3Data,
      pricingAnalysisData,
      showDemoNote,
    } = storeState

    if (!data && !rawIntelligenceData && !pricingAnalysisData) {
      setShareLinkError('Please process your dashboard data first before generating a link.')
      return
    }

    setIsGeneratingLink(true)
    setShareLinkError(null)

    try {
      const payload = {
        name: name || dashboardNameInput || 'Untitled Dashboard',
        currency: currency || currencyInput,
        data,
        intelligenceType,
        rawIntelligenceData,
        proposition2Data,
        proposition3Data,
        distributorRawIntelligenceData,
        distributorProposition2Data,
        distributorProposition3Data,
        pricingAnalysisData,
        showDemoNote,
      }

      const serialised = JSON.stringify(payload)
      if (serialised.length > 48 * 1024 * 1024) {
        setShareLinkError(`Dashboard data is too large (~${(serialised.length / 1_048_576).toFixed(0)} MB). Try reducing segments or geographies.`)
        return
      }

      const res = await fetch('/api/dashboards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialised,
      })

      let body: any
      try { body = await res.json() } catch { body = {} }

      if (!res.ok) {
        throw new Error(body?.error || `Server error (${res.status})`)
      }

      setShareUrl(body.shareUrl)
    } catch (err) {
      setShareLinkError(err instanceof Error ? err.message : 'Could not generate link – please try again.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      const el = document.createElement('input')
      el.value = shareUrl
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    }
  }

  // Process Market Intelligence Data
  const handleProcessMarketIntelligence = async () => {
    if (!valueFile) {
      setMarketStatus('error')
      setMarketStatusMessage('Please upload a value file (CSV or Excel)')
      return
    }

    setIsProcessingMarket(true)
    setMarketStatus('processing')
    setMarketStatusMessage('Processing files and generating dashboard preview...')

    try {
      const formData = new FormData()
      formData.append('valueFile', valueFile)
      if (volumeFile) {
        formData.append('volumeFile', volumeFile)
      }
      formData.append('volumeUnit', volumeUnitInput)
      if (crossValueFile) {
        formData.append('crossValueFile', crossValueFile)
      }
      if (crossVolumeFile) {
        formData.append('crossVolumeFile', crossVolumeFile)
      }

      const response = await fetch('/api/process-excel', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to process files')
      }

      const raw = await response.json()
      const { _ingestMetrics, ...data } = raw as ComparisonData & {
        _ingestMetrics?: Record<string, number>
      }
      if (_ingestMetrics) {
        console.log('[process-excel] server metrics:', _ingestMetrics)
      }

      // Clear old data and set new data
      clearData()
      setData(data)
      setLoading(false)
      setError(null)
      
      // Store dashboard name and currency
      setDashboardName(dashboardNameInput || 'India Market Analysis')
      setCurrency(currencyInput)
      
      // Store processed data
      setProcessedData(data)
      
      // Store context in the store
      const { setDashboardBuilderContext } = useDashboardStore.getState()
      setDashboardBuilderContext({
        valueFile,
        volumeFile,
        projectName: dashboardNameInput || 'market-dashboard'
      })
      
      setMarketStatus('success')
      setMarketStatusMessage('Market intelligence data processed successfully!')
    } catch (error) {
      console.error('Error processing files:', error)
      setMarketStatus('error')
      setMarketStatusMessage(
        error instanceof Error ? error.message : 'An error occurred while processing the files'
      )
    } finally {
      setIsProcessingMarket(false)
    }
  }

  // Helper function to read file as base64 using arrayBuffer (more reliable on Windows)
  const readFileAsBase64 = async (file: File): Promise<string> => {
    // Validate file first
    if (!file) {
      throw new Error('No file provided')
    }
    if (file.size === 0) {
      throw new Error('File is empty')
    }

    console.log('Reading file:', file.name, 'Size:', file.size, 'Type:', file.type)

    try {
      // Use arrayBuffer() which is more reliable than FileReader on Windows
      const arrayBuffer = await file.arrayBuffer()

      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize)
        binary += String.fromCharCode.apply(null, Array.from(chunk))
      }
      const base64 = btoa(binary)

      console.log('File read successfully, base64 length:', base64.length)
      return base64
    } catch (e: any) {
      console.error('Error reading file:', e)
      // Provide helpful error message
      if (e.name === 'NotReadableError') {
        throw new Error('File cannot be read. Please try: (1) Copy the file to your Documents folder, (2) Close Excel if it\'s open, (3) Try a different browser.')
      }
      throw new Error(`Failed to read file: ${e.message}`)
    }
  }

  // Helper function to upload pre-read file data
  const uploadFileData = async (url: string, fileData: { name: string; data: string }, intelligenceType: string): Promise<any> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileData.name,
        fileData: fileData.data,
        intelligenceType: intelligenceType,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`)
    }

    return response.json()
  }

  const applyIntelligenceApiResult = (
    result: any,
    target: 'customer' | 'distributor',
    onSuccessMessage: (msg: string) => void
  ) => {
    const setP1 = target === 'customer' ? setRawIntelligenceData : setDistributorRawIntelligenceData
    const setP2 = target === 'customer' ? setProposition2Data : setDistributorProposition2Data
    const setP3 = target === 'customer' ? setProposition3Data : setDistributorProposition3Data

    if (
      result.multiPropositionFramework &&
      result.proposition1 &&
      result.proposition2 &&
      result.proposition3
    ) {
      const p1 = result.proposition1
      const p2 = result.proposition2
      const p3 = result.proposition3

      setP1({
        headers: p1.headers || [],
        rows: p1.rows || [],
        parentHeaders: p1.parentHeaders ?? null,
      })
      setP2({
        headers: p2.headers || [],
        rows: p2.rows || [],
        parentHeaders: p2.parentHeaders ?? null,
      })
      setP3({
        headers: p3.headers || [],
        rows: p3.rows || [],
        parentHeaders: p3.parentHeaders ?? null,
      })
      setIntelligenceType(modeToStoreType(intelMode))
      onSuccessMessage(
        `Processed workbook: ${p1.rowCount} rows (${p1.sheetName}), ${p2.rowCount} rows (${p2.sheetName}), ${p3.rowCount} rows (${p3.sheetName})`
      )
      return
    }

    if (!result.data) {
      throw new Error('Invalid response from server')
    }

    const processedData = result.data

    setP1({
      headers: processedData.headers || [],
      rows: processedData.rows || [],
      parentHeaders: processedData.parentHeaders || null,
    })
    setP2(null)
    setP3(null)
    setIntelligenceType(modeToStoreType(intelMode))
    onSuccessMessage(
      `Processed ${processedData.rows?.length || 0} rows${processedData.sheetName ? ` from ${processedData.sheetName}` : ''}`
    )
  }

  const handleProcessIntelligenceForTarget = async (target: 'customer' | 'distributor') => {
    const fileData = target === 'customer' ? customerIntelFileData : distributorIntelFileData
    const setStatus = target === 'customer' ? setCustomerIntelStatus : setDistributorIntelStatus
    const setStatusMessage = target === 'customer' ? setCustomerIntelStatusMessage : setDistributorIntelStatusMessage

    if (!fileData) {
      setStatus('error')
      setStatusMessage(
        'Please select a file to upload. If you already selected a file, try selecting it again.'
      )
      return
    }

    setIntelProcessing(target)
    setStatus('processing')
    setStatusMessage('Uploading file...')

    try {
      if (target === 'customer') {
        setRawIntelligenceData(null)
        setProposition2Data(null)
        setProposition3Data(null)
      } else {
        setDistributorRawIntelligenceData(null)
        setDistributorProposition2Data(null)
        setDistributorProposition3Data(null)
      }

      const apiType = target === 'customer' ? 'customer' : 'distributor'

      const result = await uploadFileData('/api/process-intelligence-file', fileData, apiType)

      if (!result.success) {
        throw new Error('Invalid response from server')
      }

      applyIntelligenceApiResult(result, target, (msg) => {
        setStatus('success')
        setStatusMessage(msg)
      })
    } catch (error: any) {
      console.error('Error processing intelligence file:', error)
      setStatus('error')

      let errorMessage = 'Failed to process intelligence file'
      if (error.message) {
        errorMessage = error.message
      }

      if (errorMessage.includes('Network error') || errorMessage.includes('ERR_ACCESS_DENIED')) {
        errorMessage +=
          '\n\nTroubleshooting:\n• Make sure the file is not open in Excel\n• Try closing and reopening your browser\n• Check if antivirus is blocking the upload'
      }

      setStatusMessage(errorMessage)
    } finally {
      setIntelProcessing(null)
    }
  }

  // Process Competitive Intelligence Data
  const handleProcessCompetitiveIntelligence = async () => {
    if (!competitiveFile) {
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingCompetitive(true)
    setCompetitiveStatus('processing')
    setCompetitiveStatusMessage('Processing competitive intelligence file...')

    try {
      const formData = new FormData()
      formData.append('competitiveFile', competitiveFile)

      const response = await fetch('/api/process-competitive-intelligence', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const processedData = result.data
      
      // Store competitive intelligence data in the store
      setCompetitiveIntelligenceData({
        headers: processedData.headers || [],
        rows: processedData.rows || []
      })
      
      setCompetitiveStatus('success')
      setCompetitiveStatusMessage(`Processed ${processedData.rows?.length || 0} rows successfully`)
    } catch (error: any) {
      console.error('Error processing competitive intelligence file:', error)
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage(error.message || 'Failed to process competitive intelligence file')
    } finally {
      setIsProcessingCompetitive(false)
    }
  }

  // Process Pricing Analysis Data
  const handleProcessPricingAnalysis = async () => {
    if (!pricingFile) {
      setPricingStatus('error')
      setPricingStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingPricing(true)
    setPricingStatus('processing')
    setPricingStatusMessage('Processing pricing analysis file...')

    try {
      const formData = new FormData()
      formData.append('pricingFile', pricingFile)

      const response = await fetch('/api/process-pricing-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      // Store pricing analysis data in the store
      setPricingAnalysisData(result.data)

      setPricingStatus('success')
      const recordCount = result.data?.data?.value?.geography_segment_matrix?.length || 0
      const geoCount = result.data?.dimensions?.geographies?.all_geographies?.length || 0
      setPricingStatusMessage(`Processed ${recordCount} records across ${geoCount} geographies`)
    } catch (error: any) {
      console.error('Error processing pricing analysis file:', error)
      setPricingStatus('error')
      setPricingStatusMessage(error.message || 'Failed to process pricing analysis file')
    } finally {
      setIsProcessingPricing(false)
    }
  }

  const hadIntelligenceUploadSuccess =
    (intelMode.customer && customerIntelStatus === 'success') ||
    (intelMode.distributor && distributorIntelStatus === 'success')

  // Navigate to dashboard
  const handleViewDashboard = () => {
    // If only intelligence data was processed (no market data in this session),
    // clear any existing market data from the store to show intelligence-only view
    if (marketStatus !== 'success' && hadIntelligenceUploadSuccess) {
      console.log('Clearing market data for intelligence-only view')
      clearData() // This clears market data but keeps intelligence data
    }
    router.push('/')
  }

  const renderIntelStatusBlock = (
    status: 'idle' | 'processing' | 'success' | 'error',
    message: string
  ) =>
    message ? (
      <div
        className={`p-4 rounded-md flex items-start gap-3 ${
          status === 'success'
            ? 'bg-green-50 border border-green-200'
            : status === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
        }`}
      >
        {status === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : status === 'error' ? (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
        )}
        <p
          className={`text-sm whitespace-pre-wrap ${
            status === 'success' ? 'text-green-800' : status === 'error' ? 'text-red-800' : 'text-yellow-800'
          }`}
        >
          {message}
        </p>
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/logo.png" 
                alt="Coherent Market Insights Logo" 
                width={150} 
                height={60}
                className="h-auto w-auto max-w-[150px]"
                priority
              />
              <div>
                <h1 className="text-xl font-bold text-black">Dashboard Builder</h1>
                <p className="text-sm text-gray-600">Build your custom dashboard step by step</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('market')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'market'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                1. Market Intelligence
              </button>
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'intelligence'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                2. Customer/Distributor Intelligence
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'pricing'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                3. Pricing Analysis
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'market' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">1. Market Intelligence</h2>
                  <p className="text-sm text-gray-600">Upload your value and volume sheets to build the market analysis dashboard</p>
                </div>
                {/* Demo Note Toggle */}
                <div className="flex items-center gap-3 ml-6 flex-shrink-0">
                  <span className="text-sm text-gray-600 font-medium">Show Demo Note</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showDemoNoteToggle
                      setShowDemoNoteToggle(next)
                      setShowDemoNote(next)
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      showDemoNoteToggle ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-pressed={showDemoNoteToggle}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        showDemoNoteToggle ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dashboard Name */}
              <div>
                <label htmlFor="dashboardName" className="block text-sm font-medium text-black mb-2">
                  Dashboard Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dashboardName"
                  value={dashboardNameInput}
                  onChange={(e) => setDashboardNameInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="India Market Analysis"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear as the subtitle below "Coherent Dashboard"
                </p>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="USD"
                      checked={currencyInput === 'USD'}
                      onChange={() => setCurrencyInput('USD')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-black">USD ($)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="INR"
                      checked={currencyInput === 'INR'}
                      onChange={() => setCurrencyInput('INR')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-black">INR (₹)</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select the currency for displaying values throughout the dashboard
                </p>
              </div>

              {/* Value File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Value File (Required) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="valueFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="valueFile"
                          name="valueFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleValueFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {valueFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {valueFile.name} ({(valueFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Volume File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Volume File (Optional)
                </label>
                <div className="mb-3">
                  <span className="block text-sm font-medium text-black mb-2">Volume units</span>
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={volumeUnitInput === 'million-units'}
                        onChange={() => setVolumeUnitInput('million-units')}
                      />
                      <span className="text-sm text-black">Million units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={volumeUnitInput === 'units'}
                        onChange={() => setVolumeUnitInput('units')}
                      />
                      <span className="text-sm text-black">Units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={volumeUnitInput === 'th-units'}
                        onChange={() => setVolumeUnitInput('th-units')}
                      />
                      <span className="text-sm text-black">Th units</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="volumeUnit"
                        className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={volumeUnitInput === 'tons'}
                        onChange={() => setVolumeUnitInput('tons')}
                      />
                      <span className="text-sm text-black">Tons</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select how volume figures in your file should be labeled on charts and KPIs
                  </p>
                </div>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="volumeFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="volumeFile"
                          name="volumeFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleVolumeFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {volumeFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {volumeFile.name} ({(volumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cross Value File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Cross Value File <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  CSV/Excel with columns: Region, Segment, Sub-segment, Sub-segment 1, [years…] — adds a cross-tabulated segment to the dashboard.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="crossValueFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="crossValueFile"
                          name="crossValueFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCrossValueFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {crossValueFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {crossValueFile.name} ({(crossValueFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cross Volume File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Cross Volume File <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Same format as Cross Value but for volume data.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="crossVolumeFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="crossVolumeFile"
                          name="crossVolumeFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCrossVolumeFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {crossVolumeFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {crossVolumeFile.name} ({(crossVolumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {marketStatusMessage && (
                <div
                  className={`p-4 rounded-md flex items-start gap-3 ${
                    marketStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : marketStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {marketStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : marketStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p
                    className={`text-sm ${
                      marketStatus === 'success'
                        ? 'text-green-800'
                        : marketStatus === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {marketStatusMessage}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessMarketIntelligence}
                disabled={!valueFile || isProcessingMarket}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessingMarket ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Files...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Process Market Intelligence Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'intelligence' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">2. Intelligence Data Input</h2>
              <p className="text-sm text-gray-600">Add customer or distributor intelligence data to your dashboard</p>
            </div>

            <IntelligenceDataInput mode={intelMode} onModeChange={setIntelMode} />

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-black mb-2">Upload intelligence workbooks</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Each workbook may include three worksheets whose names contain{' '}
                  <span className="font-medium text-gray-800">Proposition 1</span>,{' '}
                  <span className="font-medium text-gray-800">Proposition 2</span>, and{' '}
                  <span className="font-medium text-gray-800">Proposition 3</span>. Basic, Advance, and Premium tables
                  map to those sheets. CSV or single-sheet Excel files use the first sheet as Proposition 1. When{' '}
                  <strong>both</strong> customer and distributor are enabled, upload <strong>two separate files</strong>{' '}
                  and process each one so parsers apply the correct column rules.
                </p>
              </div>

              {intelMode.customer && (
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h4 className="text-sm font-semibold text-black">Customer intelligence workbook</h4>
                  </div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Customer workbook <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingCustomerIntel
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleCustomerIntelDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingCustomerIntel)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingCustomerIntel)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet
                        className={`mx-auto h-12 w-12 ${isDraggingCustomerIntel ? 'text-blue-500' : 'text-gray-400'}`}
                      />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="customerIntelFile"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="customerIntelFile"
                            name="customerIntelFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleCustomerIntelFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingCustomerIntel && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">Drop file here!</p>
                      )}
                      {customerIntelFile && !isDraggingCustomerIntel && (
                        <p className="text-sm text-green-600 mt-2">
                          {customerIntelFileData ? '✓' : '⏳'} {customerIntelFile.name} (
                          {(customerIntelFile.size / 1024 / 1024).toFixed(2)} MB)
                          {customerIntelFileData && <span className="text-green-700 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderIntelStatusBlock(customerIntelStatus, customerIntelStatusMessage)}
                  <button
                    type="button"
                    onClick={() => handleProcessIntelligenceForTarget('customer')}
                    disabled={!customerIntelFileData || intelProcessing !== null}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {intelProcessing === 'customer' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Process Customer Intelligence Data
                      </>
                    )}
                  </button>
                </div>
              )}

              {intelMode.distributor && (
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <h4 className="text-sm font-semibold text-black">Distributor intelligence workbook</h4>
                  </div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Distributor workbook <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingDistributorIntel
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDistributorIntelDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingDistributorIntel)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingDistributorIntel)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet
                        className={`mx-auto h-12 w-12 ${isDraggingDistributorIntel ? 'text-blue-500' : 'text-gray-400'}`}
                      />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="distributorIntelFile"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="distributorIntelFile"
                            name="distributorIntelFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleDistributorIntelFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingDistributorIntel && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">Drop file here!</p>
                      )}
                      {distributorIntelFile && !isDraggingDistributorIntel && (
                        <p className="text-sm text-green-600 mt-2">
                          {distributorIntelFileData ? '✓' : '⏳'} {distributorIntelFile.name} (
                          {(distributorIntelFile.size / 1024 / 1024).toFixed(2)} MB)
                          {distributorIntelFileData && <span className="text-green-700 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderIntelStatusBlock(distributorIntelStatus, distributorIntelStatusMessage)}
                  <button
                    type="button"
                    onClick={() => handleProcessIntelligenceForTarget('distributor')}
                    disabled={!distributorIntelFileData || intelProcessing !== null}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {intelProcessing === 'distributor' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Process Distributor Intelligence Data
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}

          {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">3. Pricing Analysis</h2>
              <p className="text-sm text-gray-600">Upload pricing analysis CSV/Excel file to display average selling price trends and analysis</p>
            </div>

            <div className="space-y-6">
              {/* Pricing Analysis File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Pricing Analysis File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="pricingFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="pricingFile"
                          name="pricingFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPricingFile(e.target.files[0])
                              setPricingStatus('idle')
                              setPricingStatusMessage('')
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {pricingFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {pricingFile.name} ({(pricingFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Expected Format:</strong> The file should include columns: Region, Segment, Sub-segment, and year columns (e.g., 2020, 2021, 2022...) with pricing values. Similar structure to market value/volume data.
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {pricingStatusMessage && (
                <div
                  className={`p-4 rounded-md flex items-start gap-3 ${
                    pricingStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : pricingStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {pricingStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : pricingStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p
                    className={`text-sm ${
                      pricingStatus === 'success'
                        ? 'text-green-800'
                        : pricingStatus === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {pricingStatusMessage}
                  </p>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcessPricingAnalysis}
                disabled={!pricingFile || isProcessingPricing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessingPricing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Pricing Analysis Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* View Dashboard Button - Shows when any data is processed */}
        {(marketStatus === 'success' || hadIntelligenceUploadSuccess || pricingStatus === 'success') && (
          <div className="mt-6 space-y-4">
            {/* View Dashboard */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Ready to View Dashboard!</h3>
                  <p className="text-sm text-blue-800">
                    {[
                      marketStatus === 'success' && 'Market',
                      hadIntelligenceUploadSuccess && 'Intelligence',
                      pricingStatus === 'success' && 'Pricing'
                    ].filter(Boolean).join(', ')} data processed. Click to view dashboard.
                  </p>
                </div>
                <button
                  onClick={handleViewDashboard}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye className="h-5 w-5" />
                  View Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Generate Shareable Link */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-1 flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generate Shareable Link
                  </h3>
                  <p className="text-sm text-green-800 mb-3">
                    Create a permanent link to share this dashboard with your client. The link works on any browser and never expires.
                  </p>

                  {shareLinkError && (
                    <div className="flex items-start gap-2 p-2.5 mb-3 bg-red-50 border border-red-200 rounded-md">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-red-700">{shareLinkError}</p>
                    </div>
                  )}

                  {shareUrl ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded-md font-mono text-gray-700 select-all"
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          linkCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-400 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { setShareUrl(null); setLinkCopied(false); setShareLinkError(null) }}
                        className="px-3 py-2 text-sm text-green-700 hover:text-green-900 border border-green-300 rounded-md hover:bg-green-100 transition-colors"
                        title="Generate a new link"
                      >
                        New Link
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Dashboard…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Generate Shareable Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
