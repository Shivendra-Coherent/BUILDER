'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, Eye, Users, Building2, ArrowRight, TrendingUp, DollarSign } from 'lucide-react'
import Image from 'next/image'
import { useDashboardStore } from '@/lib/store'
import type { ComparisonData } from '@/lib/types'
import type { IntelligenceType } from '@/components/dashboard-builder/IntelligenceDataInput'
import { IntelligenceDataInput } from '@/components/dashboard-builder/IntelligenceDataInput'

export default function DashboardBuilderPage() {
  const router = useRouter()
  const { 
    setData, 
    setLoading, 
    setError, 
    clearData,
    setIntelligenceType,
    setCustomerIntelligenceData,
    setDistributorIntelligenceData,
    setParentHeaders,
    setRawIntelligenceData,
    setProposition2Data,
    setProposition3Data,
    setCompetitiveIntelligenceData,
    setPricingAnalysisData,
    setDashboardName,
    setCurrency
  } = useDashboardStore()
  
  // Section 1: Market Intelligence
  const [dashboardNameInput, setDashboardNameInput] = useState('India Market Analysis')
  const [currencyInput, setCurrencyInput] = useState<'USD' | 'INR'>('USD')
  const [valueFile, setValueFile] = useState<File | null>(null)
  const [volumeFile, setVolumeFile] = useState<File | null>(null)
  const [isProcessingMarket, setIsProcessingMarket] = useState(false)
  const [marketStatus, setMarketStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [marketStatusMessage, setMarketStatusMessage] = useState('')
  const [processedData, setProcessedData] = useState<ComparisonData | null>(null)
  
  // Section 2: Intelligence Data (Optional)
  const [intelligenceType, setLocalIntelligenceType] = useState<IntelligenceType>('customer')
  const [intelligenceFile, setIntelligenceFile] = useState<File | null>(null)
  const [intelligenceFileData, setIntelligenceFileData] = useState<{ name: string; data: string } | null>(null)
  const [proposition2File, setProposition2File] = useState<File | null>(null)
  const [proposition2FileData, setProposition2FileData] = useState<{ name: string; data: string } | null>(null)
  const [proposition3File, setProposition3File] = useState<File | null>(null)
  const [proposition3FileData, setProposition3FileData] = useState<{ name: string; data: string } | null>(null)
  const [isProcessingIntelligence, setIsProcessingIntelligence] = useState(false)
  const [intelligenceStatus, setIntelligenceStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [intelligenceStatusMessage, setIntelligenceStatusMessage] = useState('')
  const [hasIntelligenceData, setHasIntelligenceData] = useState(false)
  const [activeTab, setActiveTab] = useState<'market' | 'intelligence' | 'competitive' | 'pricing'>('market')

  // Drag and drop states
  const [isDraggingIntelligence, setIsDraggingIntelligence] = useState(false)
  const [isDraggingProp2, setIsDraggingProp2] = useState(false)
  const [isDraggingProp3, setIsDraggingProp3] = useState(false)

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

  const handleIntelligenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIntelligenceFile(file)
      setIntelligenceStatus('idle')
      setIntelligenceStatusMessage('Reading file...')

      // Create a FileReader and read synchronously in the event handler
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          if (result) {
            const base64 = result.split(',')[1]
            if (base64) {
              setIntelligenceFileData({ name: file.name, data: base64 })
              setIntelligenceStatusMessage('')
              console.log('Intelligence file read successfully:', file.name, 'base64 length:', base64.length)
            } else {
              throw new Error('Failed to extract base64 data')
            }
          } else {
            throw new Error('FileReader returned empty result')
          }
        } catch (error: any) {
          console.error('Error processing file:', error)
          setIntelligenceStatus('error')
          setIntelligenceStatusMessage(`Error reading file: ${error.message}`)
          setIntelligenceFileData(null)
        }
      }

      reader.onerror = () => {
        console.error('FileReader error:', reader.error)
        setIntelligenceStatus('error')
        const errorMsg = reader.error?.message || 'Unknown error'
        if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
          setIntelligenceStatusMessage('File cannot be read due to Windows permissions. Please copy the file to your Documents folder and try again.')
        } else {
          setIntelligenceStatusMessage(`Error reading file: ${errorMsg}`)
        }
        setIntelligenceFileData(null)
      }

      // Start reading immediately - this happens synchronously in the event loop
      reader.readAsDataURL(file)
    }
  }

  const handleProposition2FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProposition2File(file)
      setIntelligenceStatusMessage('Reading Proposition 2 file...')

      // Use FileReader instead of arrayBuffer for better Windows compatibility
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          if (result) {
            const base64 = result.split(',')[1]
            if (base64) {
              setProposition2FileData({ name: file.name, data: base64 })
              setIntelligenceStatusMessage('')
              console.log('Proposition 2 file read successfully:', file.name, 'base64 length:', base64.length)
            } else {
              throw new Error('Failed to extract base64 data')
            }
          } else {
            throw new Error('FileReader returned empty result')
          }
        } catch (error: any) {
          console.error('Error processing proposition 2 file:', error)
          setIntelligenceStatus('error')
          setIntelligenceStatusMessage(`Error reading Proposition 2 file: ${error.message}`)
          setProposition2FileData(null)
        }
      }

      reader.onerror = () => {
        console.error('FileReader error for Proposition 2:', reader.error)
        setIntelligenceStatus('error')
        const errorMsg = reader.error?.message || 'Unknown error'
        if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
          setIntelligenceStatusMessage('Proposition 2 file cannot be read. Please copy the file to your Documents folder and try again.')
        } else {
          setIntelligenceStatusMessage(`Error reading Proposition 2 file: ${errorMsg}`)
        }
        setProposition2FileData(null)
      }

      reader.readAsDataURL(file)
    }
  }

  const handleProposition3FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProposition3File(file)
      setIntelligenceStatusMessage('Reading Proposition 3 file...')

      // Use FileReader instead of arrayBuffer for better Windows compatibility
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          if (result) {
            const base64 = result.split(',')[1]
            if (base64) {
              setProposition3FileData({ name: file.name, data: base64 })
              setIntelligenceStatusMessage('')
              console.log('Proposition 3 file read successfully:', file.name, 'base64 length:', base64.length)
            } else {
              throw new Error('Failed to extract base64 data')
            }
          } else {
            throw new Error('FileReader returned empty result')
          }
        } catch (error: any) {
          console.error('Error processing proposition 3 file:', error)
          setIntelligenceStatus('error')
          setIntelligenceStatusMessage(`Error reading Proposition 3 file: ${error.message}`)
          setProposition3FileData(null)
        }
      }

      reader.onerror = () => {
        console.error('FileReader error for Proposition 3:', reader.error)
        setIntelligenceStatus('error')
        const errorMsg = reader.error?.message || 'Unknown error'
        if (errorMsg.includes('NotReadableError') || reader.error?.name === 'NotReadableError') {
          setIntelligenceStatusMessage('Proposition 3 file cannot be read. Please copy the file to your Documents folder and try again.')
        } else {
          setIntelligenceStatusMessage(`Error reading Proposition 3 file: ${errorMsg}`)
        }
        setProposition3FileData(null)
      }

      reader.readAsDataURL(file)
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

  // Intelligence file drop handler
  const handleIntelligenceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingIntelligence(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processDroppedFile(
        files[0],
        setIntelligenceFile,
        setIntelligenceFileData,
        setIntelligenceStatus,
        setIntelligenceStatusMessage
      )
    }
  }

  // Proposition 2 drop handler
  const handleProp2Drop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingProp2(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      setProposition2File(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setProposition2FileData({ name: file.name, data: base64 })
            console.log('Proposition 2 dropped file read successfully:', file.name)
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Proposition 3 drop handler
  const handleProp3Drop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingProp3(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      setProposition3File(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          const base64 = result.split(',')[1]
          if (base64) {
            setProposition3FileData({ name: file.name, data: base64 })
            console.log('Proposition 3 dropped file read successfully:', file.name)
          }
        }
      }
      reader.readAsDataURL(file)
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

      const response = await fetch('/api/process-excel', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to process files')
      }

      const data: ComparisonData = await response.json()
      
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
    setIntelligenceStatusMessage('Uploading...')
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

  // Process Intelligence Data
  const handleProcessIntelligenceFile = async () => {
    if (!intelligenceFileData) {
      setIntelligenceStatus('error')
      setIntelligenceStatusMessage('Please select a file to upload. If you already selected a file, try selecting it again.')
      return
    }

    setIsProcessingIntelligence(true)
    setIntelligenceStatus('processing')
    setIntelligenceStatusMessage('Uploading file...')

    try {
      // IMPORTANT: Clear ALL proposition data first to ensure only uploaded files show
      // This prevents stale data from previous uploads from appearing
      setRawIntelligenceData(null)
      setProposition2Data(null)
      setProposition3Data(null)

      // Use pre-read file data (more reliable than reading at upload time)
      const result = await uploadFileData('/api/process-intelligence-file', intelligenceFileData, intelligenceType)

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const processedData = result.data

      setRawIntelligenceData({
        headers: processedData.headers || [],
        rows: processedData.rows || [],
        parentHeaders: processedData.parentHeaders || null
      })
      setIntelligenceType(intelligenceType)
      
      let processedCount = 1
      let message = `Processed ${processedData.rows?.length || 0} rows from Proposition 1`
      
      // Process Proposition 2 if file is uploaded
      if (proposition2FileData) {
        try {
          setIntelligenceStatusMessage('Processing Proposition 2...')
          const prop2Result = await uploadFileData('/api/process-intelligence-file', proposition2FileData, intelligenceType)

          if (prop2Result.success && prop2Result.data) {
            setProposition2Data({
              headers: prop2Result.data.headers || [],
              rows: prop2Result.data.rows || [],
              parentHeaders: prop2Result.data.parentHeaders || null
            })
            processedCount++
            message += `, ${prop2Result.data.rows?.length || 0} rows from Proposition 2`
          }
        } catch (error) {
          console.warn('Failed to process Proposition 2 file:', error)
        }
      }

      // Process Proposition 3 if file is uploaded
      if (proposition3FileData) {
        try {
          setIntelligenceStatusMessage('Processing Proposition 3...')
          const prop3Result = await uploadFileData('/api/process-intelligence-file', proposition3FileData, intelligenceType)

          if (prop3Result.success && prop3Result.data) {
            setProposition3Data({
              headers: prop3Result.data.headers || [],
              rows: prop3Result.data.rows || [],
              parentHeaders: prop3Result.data.parentHeaders || null
            })
            processedCount++
            message += `, ${prop3Result.data.rows?.length || 0} rows from Proposition 3`
          }
        } catch (error) {
          console.warn('Failed to process Proposition 3 file:', error)
        }
      }
      
      setHasIntelligenceData(true)
      setIntelligenceStatus('success')
      setIntelligenceStatusMessage(message)
    } catch (error: any) {
      console.error('Error processing intelligence file:', error)
      setIntelligenceStatus('error')

      let errorMessage = 'Failed to process intelligence file'
      if (error.message) {
        errorMessage = error.message
      }

      // Add helpful suggestions based on error type
      if (errorMessage.includes('Network error') || errorMessage.includes('ERR_ACCESS_DENIED')) {
        errorMessage += '\n\nTroubleshooting:\n• Make sure the file is not open in Excel\n• Try closing and reopening your browser\n• Check if antivirus is blocking the upload'
      }

      setIntelligenceStatusMessage(errorMessage)
    } finally {
      setIsProcessingIntelligence(false)
    }
  }

  // Handle intelligence data save from IntelligenceDataInput component
  const handleIntelligenceDataSave = (data: any[]) => {
    if (intelligenceType === 'customer') {
      setCustomerIntelligenceData(data)
    } else {
      setDistributorIntelligenceData(data)
    }
    setHasIntelligenceData(true)
  }

  // Handle auto-save from IntelligenceDataInput component (for bulk paste)
  const handleIntelligenceAutoSave = (data: any[], parentHeaders?: { prop1: string; prop2: string; prop3: string }) => {
    if (intelligenceType === 'customer') {
      setCustomerIntelligenceData(data)
    } else {
      setDistributorIntelligenceData(data)
    }
    if (parentHeaders) {
      setParentHeaders(parentHeaders)
    }
    setHasIntelligenceData(true)
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

  // Navigate to dashboard
  const handleViewDashboard = () => {
    // If only intelligence data was processed (no market data in this session),
    // clear any existing market data from the store to show intelligence-only view
    if (marketStatus !== 'success' && intelligenceStatus === 'success') {
      console.log('Clearing market data for intelligence-only view')
      clearData() // This clears market data but keeps intelligence data
    }
    router.push('/')
  }

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
                onClick={() => setActiveTab('competitive')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'competitive'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                3. Competitive Intelligence
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
                4. Pricing Analysis
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'market' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">1. Market Intelligence</h2>
              <p className="text-sm text-gray-600">Upload your value and volume sheets to build the market analysis dashboard</p>
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

            <IntelligenceDataInput
              intelligenceType={intelligenceType}
              onTypeChange={(type) => {
                setLocalIntelligenceType(type)
                setIntelligenceType(type)
              }}
              onDataSave={handleIntelligenceDataSave}
              onAutoSave={handleIntelligenceAutoSave}
            />

            {/* File Upload Option */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-4">Or Upload Excel Files</h3>
              <div className="space-y-4">
                {/* Proposition 1 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 1 (Basic) <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingIntelligence
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleIntelligenceDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingIntelligence)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingIntelligence)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className={`mx-auto h-12 w-12 ${isDraggingIntelligence ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="intelligenceFile"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="intelligenceFile"
                            name="intelligenceFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleIntelligenceFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingIntelligence && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">Drop file here!</p>
                      )}
                      {intelligenceFile && !isDraggingIntelligence && (
                        <p className="text-sm text-green-600 mt-2">
                          {intelligenceFileData ? '✓' : '⏳'} {intelligenceFile.name} ({(intelligenceFile.size / 1024 / 1024).toFixed(2)} MB)
                          {intelligenceFileData && <span className="text-green-700 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposition 2 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 2 (Advance) (Optional)
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingProp2
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleProp2Drop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingProp2)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingProp2)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className={`mx-auto h-12 w-12 ${isDraggingProp2 ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="proposition2File"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="proposition2File"
                            name="proposition2File"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleProposition2FileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingProp2 && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">Drop file here!</p>
                      )}
                      {proposition2File && !isDraggingProp2 && (
                        <p className="text-sm text-green-600 mt-2">
                          {proposition2FileData ? '✓' : '⏳'} {proposition2File.name} ({(proposition2File.size / 1024 / 1024).toFixed(2)} MB)
                          {proposition2FileData && <span className="text-green-700 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposition 3 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 3 (Premium) (Optional)
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDraggingProp3
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleProp3Drop}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setIsDraggingProp3)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingProp3)}
                  >
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className={`mx-auto h-12 w-12 ${isDraggingProp3 ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="proposition3File"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="proposition3File"
                            name="proposition3File"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleProposition3FileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {isDraggingProp3 && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">Drop file here!</p>
                      )}
                      {proposition3File && !isDraggingProp3 && (
                        <p className="text-sm text-green-600 mt-2">
                          {proposition3FileData ? '✓' : '⏳'} {proposition3File.name} ({(proposition3File.size / 1024 / 1024).toFixed(2)} MB)
                          {proposition3FileData && <span className="text-green-700 ml-1">(Ready)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {intelligenceStatusMessage && (
                  <div
                    className={`p-4 rounded-md flex items-start gap-3 ${
                      intelligenceStatus === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : intelligenceStatus === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {intelligenceStatus === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : intelligenceStatus === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <p
                      className={`text-sm ${
                        intelligenceStatus === 'success'
                          ? 'text-green-800'
                          : intelligenceStatus === 'error'
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      }`}
                    >
                      {intelligenceStatusMessage}
                    </p>
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={handleProcessIntelligenceFile}
                  disabled={!intelligenceFile || isProcessingIntelligence}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isProcessingIntelligence ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Process Intelligence Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'competitive' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">3. Competitive Intelligence</h2>
              <p className="text-sm text-gray-600">Upload competitive intelligence CSV file to display in the competitive intelligence section</p>
            </div>

            <div className="space-y-6">
              {/* Competitive Intelligence File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Competitive Intelligence File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="competitiveFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="competitiveFile"
                          name="competitiveFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCompetitiveFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {competitiveFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {competitiveFile.name} ({(competitiveFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Expected CSV Format:</strong> The CSV should include columns like Company ID, Company Name, Headquarters, CEO, Year Established, Product/Service Portfolio, Strategies, Regional Strength, Overall Revenue, Segmental Revenue, Market Share, and Proposition fields (Proposition 1 Title, Proposition 1 Description, Proposition 1 Category, etc.)
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {competitiveStatusMessage && (
                <div
                  className={`p-4 rounded-md flex items-start gap-3 ${
                    competitiveStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : competitiveStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {competitiveStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : competitiveStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p
                    className={`text-sm ${
                      competitiveStatus === 'success'
                        ? 'text-green-800'
                        : competitiveStatus === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {competitiveStatusMessage}
                  </p>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcessCompetitiveIntelligence}
                disabled={!competitiveFile || isProcessingCompetitive}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessingCompetitive ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Competitive Intelligence Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">4. Pricing Analysis</h2>
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
        {(marketStatus === 'success' || intelligenceStatus === 'success' || pricingStatus === 'success') && (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Ready to View Dashboard!</h3>
                  <p className="text-sm text-blue-800">
                    {[
                      marketStatus === 'success' && 'Market',
                      intelligenceStatus === 'success' && 'Intelligence',
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
          </div>
        )}
      </div>
    </div>
  )
}
