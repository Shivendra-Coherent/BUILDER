import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

// Helper to create response with CORS headers
function createResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// Demo data pools for generating realistic sample data
const DEMO_DATA = {
  firstNames: ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Ashley', 'William', 'Amanda', 'John', 'Jennifer', 'Richard', 'Elizabeth', 'Thomas', 'Michelle', 'Christopher', 'Stephanie', 'Daniel', 'Nicole', 'Matthew', 'Rachel', 'Anthony', 'Laura', 'Mark', 'Megan', 'Steven', 'Hannah', 'Andrew', 'Samantha'],
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill'],
  companies: ['Acme Corporation', 'Global Industries Ltd', 'Tech Solutions Inc', 'Premier Services Group', 'Innovative Systems', 'Pacific Trading Co', 'Atlantic Enterprises', 'Summit Holdings', 'Pinnacle Partners', 'Vertex Technologies', 'Horizon Group', 'Stellar Solutions', 'Phoenix Industries', 'Quantum Labs', 'Nexus Corporation', 'Apex Manufacturing', 'Elite Services', 'Prime Ventures', 'Delta Systems', 'Omega Enterprises', 'Alpha Industries', 'Beta Technologies', 'Gamma Solutions', 'Sigma Corp', 'Theta Holdings'],
  industries: ['Healthcare', 'Technology', 'Manufacturing', 'Financial Services', 'Retail', 'Education', 'Energy', 'Telecommunications', 'Automotive', 'Pharmaceuticals', 'Consumer Goods', 'Real Estate', 'Transportation', 'Media & Entertainment', 'Agriculture', 'Construction', 'Hospitality', 'Insurance', 'Logistics', 'Aerospace'],
  cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Nashville', 'Portland', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'],
  countries: ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Japan', 'India', 'Brazil', 'Mexico', 'China', 'Singapore', 'Netherlands', 'Switzerland', 'Italy', 'Spain', 'South Korea', 'Sweden', 'Norway', 'Ireland'],
  regions: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'South Asia', 'Southeast Asia', 'Eastern Europe', 'Western Europe', 'Central America', 'Oceania'],
  states: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Telangana'],
  departments: ['Sales', 'Marketing', 'Engineering', 'Finance', 'Human Resources', 'Operations', 'Customer Success', 'Product', 'Research & Development', 'Legal', 'IT', 'Business Development', 'Procurement', 'Quality Assurance'],
  titles: ['CEO', 'CTO', 'CFO', 'COO', 'VP Sales', 'VP Marketing', 'Director', 'Senior Manager', 'Manager', 'Team Lead', 'Senior Analyst', 'Analyst', 'Consultant', 'Specialist', 'Coordinator', 'Executive', 'Associate', 'Administrator'],
  statuses: ['Active', 'Pending', 'In Progress', 'Completed', 'On Hold', 'Approved', 'Qualified', 'Contacted', 'Negotiating', 'Closed Won', 'Closed Lost'],
  sources: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Email Campaign', 'Social Media', 'Partner', 'Advertisement', 'Webinar', 'Conference', 'Direct Mail', 'Organic Search'],
  products: ['Enterprise Suite', 'Professional Plan', 'Basic Package', 'Premium Service', 'Standard License', 'Advanced Module', 'Core Platform', 'Analytics Pro', 'Security Plus', 'Integration Hub'],
  emailDomains: ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com', 'enterprise.org', 'business.net', 'corporate.io', 'tech.co'],
  streets: ['Main Street', 'Oak Avenue', 'Park Road', 'Cedar Lane', 'Maple Drive', 'Washington Boulevard', 'Lincoln Way', 'Market Street', 'Industrial Park', 'Commerce Drive', 'Tech Park', 'Business Center'],

  // Aviation/Airline specific data
  aircraftTypes: ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350', 'Boeing 787 Dreamliner', 'Airbus A380', 'Embraer E190', 'Bombardier CRJ900', 'ATR 72', 'Boeing 747', 'Airbus A330', 'Boeing 767'],
  aircraftBrands: ['Boeing', 'Airbus', 'Embraer', 'Bombardier', 'ATR', 'Cessna', 'Gulfstream', 'Dassault'],
  engineTypes: ['CFM56', 'GE90', 'PW4000', 'Trent 1000', 'LEAP-1A', 'GEnx', 'PW1100G', 'Trent XWB', 'CF6', 'RB211'],
  maintenanceModels: ['In-house Maintenance', 'Outsourced to MRO', 'Hybrid Model', 'OEM Partnership', 'Third-party Contract'],
  customerTypes: ['Airline Operators (Domestic)', 'Airline Operators (International)', 'MRO Service Providers', 'Component Repair Shops', 'Aircraft Leasing Companies', 'Line Maintenance & Ground Handling', 'Cargo Airlines', 'Charter Airlines', 'Regional Airlines'],
  paymentTerms: ['Net 30', 'Net 45', 'Net 60', 'Net 90', 'Advance Payment', 'Letter of Credit', '50% Advance, 50% Delivery', 'Quarterly Payment'],
  shipmentFrequencies: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'As Required', 'Emergency Only', 'Scheduled Maintenance Cycles'],
  sparePartsTypes: ['Rotable Parts', 'Consumables', 'Expendables', 'Repairable Components', 'Life-limited Parts', 'Engine Parts', 'Avionics', 'Landing Gear Components', 'APU Parts', 'Structural Parts'],
  technicalFeatures: ['FAA Certified', 'EASA Approved', 'OEM Specification', 'PMA Parts Available', 'DER Repairs', 'Trace Documentation', 'Warranty Coverage', 'AOG Support'],
  benchmarkingNotes: ['High potential customer', 'Strong growth trajectory', 'Key strategic account', 'Price-sensitive buyer', 'Quality-focused procurement', 'Long-term partnership potential', 'Requires technical support', 'Volume discount eligible'],
  linkedInProfiles: ['linkedin.com/in/aviation-exec', 'linkedin.com/in/procurement-lead', 'linkedin.com/in/mro-specialist', 'linkedin.com/in/fleet-manager', 'linkedin.com/in/supply-chain-dir'],
}

// Check if a value is a placeholder that should be replaced with demo data
function isPlaceholder(value: string): boolean {
  if (!value) return false
  const normalized = value.toLowerCase().trim()
  return normalized === 'xx' ||
         normalized === 'xxx' ||
         normalized === 'xxxx' ||
         normalized === 'x' ||
         normalized === 'na' ||
         normalized === 'n/a' ||
         normalized === 'tbd' ||
         normalized === 'placeholder' ||
         normalized === '-' ||
         normalized === '--' ||
         normalized === '...' ||
         normalized === 'demo' ||
         normalized === 'sample' ||
         normalized === 'test'
}

// Get a random item from an array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Generate a random number within a range
function randomNumber(min: number, max: number, decimals: number = 0): string {
  const num = Math.random() * (max - min) + min
  return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toString()
}

// Generate a random date within the last 2 years
function randomDate(): string {
  const start = new Date()
  start.setFullYear(start.getFullYear() - 2)
  const end = new Date()
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

// Generate a random phone number
function randomPhone(): string {
  const formats = [
    `+1 (${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`,
    `+91 ${randomNumber(70000, 99999)}${randomNumber(10000, 99999)}`,
    `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`,
  ]
  return randomItem(formats)
}

// Generate demo data based on header name
function generateDemoValue(header: string, rowIndex: number): string {
  const h = header.toLowerCase().trim()

  // Name patterns
  if (h.includes('first name') || h === 'firstname' || h === 'first') {
    return randomItem(DEMO_DATA.firstNames)
  }
  if (h.includes('last name') || h === 'lastname' || h === 'last' || h === 'surname') {
    return randomItem(DEMO_DATA.lastNames)
  }
  if (h.includes('full name') || h === 'name' || h === 'fullname' || h.includes('customer name') || h.includes('contact name') || h.includes('client name') || h.includes('person')) {
    return `${randomItem(DEMO_DATA.firstNames)} ${randomItem(DEMO_DATA.lastNames)}`
  }

  // Company patterns
  if (h.includes('company') || h.includes('organization') || h.includes('org name') || h.includes('business name') || h.includes('account name') || h.includes('firm') || h.includes('enterprise')) {
    return randomItem(DEMO_DATA.companies)
  }

  // Contact patterns
  if (h.includes('email') || h.includes('e-mail') || h.includes('mail')) {
    const firstName = randomItem(DEMO_DATA.firstNames).toLowerCase()
    const lastName = randomItem(DEMO_DATA.lastNames).toLowerCase()
    const domain = randomItem(DEMO_DATA.emailDomains)
    const formats = [`${firstName}.${lastName}@${domain}`, `${firstName}${lastName[0]}@${domain}`, `${firstName[0]}${lastName}@${domain}`]
    return randomItem(formats)
  }
  if (h.includes('phone') || h.includes('mobile') || h.includes('cell') || h.includes('tel') || h.includes('contact number')) {
    return randomPhone()
  }

  // Location patterns
  if (h.includes('city') || h.includes('town')) {
    return randomItem(DEMO_DATA.cities)
  }
  if (h.includes('country') || h.includes('nation')) {
    return randomItem(DEMO_DATA.countries)
  }
  if (h.includes('region') || h.includes('territory') || h.includes('area') || h.includes('zone')) {
    return randomItem(DEMO_DATA.regions)
  }
  if (h.includes('state') || h.includes('province')) {
    return randomItem(DEMO_DATA.states)
  }
  if (h.includes('address') || h.includes('street') || h.includes('location')) {
    return `${randomNumber(100, 9999)} ${randomItem(DEMO_DATA.streets)}, ${randomItem(DEMO_DATA.cities)}`
  }
  if (h.includes('zip') || h.includes('postal') || h.includes('pincode') || h.includes('pin code')) {
    return randomNumber(10000, 99999).toString()
  }

  // Business patterns
  if (h.includes('industry') || h.includes('sector') || h.includes('vertical') || h.includes('segment')) {
    return randomItem(DEMO_DATA.industries)
  }
  if (h.includes('department') || h.includes('dept') || h.includes('division') || h.includes('unit')) {
    return randomItem(DEMO_DATA.departments)
  }
  if (h.includes('title') || h.includes('designation') || h.includes('position') || h.includes('role') || h.includes('job')) {
    return randomItem(DEMO_DATA.titles)
  }
  if (h.includes('status') || h.includes('stage') || h.includes('state')) {
    return randomItem(DEMO_DATA.statuses)
  }
  if (h.includes('source') || h.includes('lead source') || h.includes('channel') || h.includes('origin')) {
    return randomItem(DEMO_DATA.sources)
  }
  if (h.includes('product') || h.includes('service') || h.includes('offering') || h.includes('solution')) {
    return randomItem(DEMO_DATA.products)
  }

  // Numeric patterns
  if (h.includes('revenue') || h.includes('sales') || h.includes('amount') || h.includes('value') || h.includes('deal')) {
    return `$${randomNumber(10000, 500000).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  if (h.includes('employee') || h.includes('headcount') || h.includes('size') || h.includes('staff')) {
    const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    return randomItem(sizes)
  }
  if (h.includes('quantity') || h.includes('qty') || h.includes('count') || h.includes('number') || h.includes('units')) {
    return randomNumber(1, 1000).toString()
  }
  if (h.includes('percent') || h.includes('%') || h.includes('rate') || h.includes('ratio')) {
    return `${randomNumber(1, 100)}%`
  }
  if (h.includes('score') || h.includes('rating') || h.includes('rank')) {
    return randomNumber(1, 10).toString()
  }
  if (h.includes('year') || h === 'yr') {
    return randomNumber(2020, 2025).toString()
  }

  // Date patterns
  if (h.includes('date') || h.includes('created') || h.includes('updated') || h.includes('modified') || h.includes('when')) {
    return randomDate()
  }

  // ID patterns
  if (h.includes('id') || h.includes('code') || h.includes('number') || h === 'no' || h === 'no.' || h === 'sr' || h === 'sno' || h === 's.no' || h.includes('serial')) {
    return `${(rowIndex + 1).toString().padStart(4, '0')}`
  }

  // Website/URL patterns
  if (h.includes('website') || h.includes('url') || h.includes('link') || h.includes('web')) {
    const company = randomItem(DEMO_DATA.companies).toLowerCase().replace(/[^a-z0-9]/g, '')
    return `www.${company}.com`
  }

  // Notes/Comments patterns
  if (h.includes('note') || h.includes('comment') || h.includes('remark') || h.includes('description') || h.includes('detail')) {
    const notes = [
      'Follow up required next week',
      'Interested in premium package',
      'Requested product demo',
      'Waiting for budget approval',
      'Key decision maker identified',
      'Competitive evaluation in progress',
      'Strong buying signals',
      'Requires technical consultation',
      'Referred by existing customer',
      'High priority prospect'
    ]
    return randomItem(notes)
  }

  // Priority patterns
  if (h.includes('priority') || h.includes('urgency') || h.includes('importance')) {
    return randomItem(['High', 'Medium', 'Low', 'Critical', 'Normal'])
  }

  // Type patterns
  if (h.includes('type') || h.includes('category') || h.includes('class')) {
    return randomItem(['Enterprise', 'SMB', 'Startup', 'Government', 'Non-Profit', 'Individual'])
  }

  // Boolean patterns
  if (h.includes('active') || h.includes('enabled') || h.includes('verified') || h.includes('confirmed')) {
    return randomItem(['Yes', 'No'])
  }

  // Aviation/Airline specific patterns
  if (h.includes('aircraft') && (h.includes('type') || h.includes('brand'))) {
    return `${randomItem(DEMO_DATA.aircraftTypes)} (${randomItem(DEMO_DATA.aircraftBrands)})`
  }
  if (h.includes('aircraft') || h.includes('fleet') && h.includes('type')) {
    return randomItem(DEMO_DATA.aircraftTypes)
  }
  if (h.includes('engine') && h.includes('type')) {
    return randomItem(DEMO_DATA.engineTypes)
  }
  if (h.includes('aircraft') && h.includes('age')) {
    return `${randomNumber(1, 20)} years`
  }
  if (h.includes('fleet') && (h.includes('capacity') || h.includes('handling'))) {
    return `${randomNumber(10, 200)} aircraft`
  }
  if (h.includes('fleet') && h.includes('utilization')) {
    return `${randomNumber(8, 16)} hours/day`
  }
  if (h.includes('maintenance') && h.includes('model')) {
    return randomItem(DEMO_DATA.maintenanceModels)
  }
  if (h.includes('customer') && h.includes('type')) {
    return randomItem(DEMO_DATA.customerTypes)
  }
  if (h.includes('payment') && h.includes('term')) {
    return randomItem(DEMO_DATA.paymentTerms)
  }
  if (h.includes('shipment') || h.includes('frequency')) {
    return randomItem(DEMO_DATA.shipmentFrequencies)
  }
  if (h.includes('spare') && h.includes('part')) {
    return randomItem(DEMO_DATA.sparePartsTypes)
  }
  if (h.includes('technical') && h.includes('feature')) {
    return randomItem(DEMO_DATA.technicalFeatures)
  }
  if (h.includes('benchmark') || h.includes('summary')) {
    return randomItem(DEMO_DATA.benchmarkingNotes)
  }
  if (h.includes('linkedin') || h.includes('profile')) {
    return randomItem(DEMO_DATA.linkedInProfiles)
  }
  if (h.includes('whatsapp') || h.includes('app')) {
    return randomPhone()
  }
  if (h.includes('headquarters') || h.includes('headquarter') || h.includes('hq')) {
    return `${randomItem(DEMO_DATA.cities)}, ${randomItem(DEMO_DATA.countries)}`
  }
  if (h.includes('acquisition') || h.includes('airline') && h.includes('new')) {
    return randomItem(['Yes - Active', 'No', 'Under Evaluation', 'Planned for Next Year'])
  }
  if (h.includes('partnership') || h.includes('distributor') || h.includes('supplier')) {
    return randomItem(['Direct OEM', 'Authorized Distributor', 'Third-party Supplier', 'Multiple Partners', 'Exclusive Agreement'])
  }
  if (h.includes('procurement') && h.includes('contact')) {
    return `${randomItem(DEMO_DATA.firstNames)} ${randomItem(DEMO_DATA.lastNames)}`
  }
  if (h.includes('daily') && h.includes('work')) {
    return `${randomNumber(6, 18)} hours`
  }
  if (h.includes('outsource') || h.includes('in-house') || h.includes('inhouse')) {
    return randomItem(['In-house', 'Outsourced', 'Hybrid', 'Partially Outsourced'])
  }

  // Default: return a generic value
  return `Demo-${rowIndex + 1}`
}

/**
 * Detects if the first row contains parent headers (merged cells spanning multiple columns)
 * Parent headers are identified by having some cells empty while others have values
 */
function detectParentHeaders(row1: any[], row2: any[]): { hasParentHeaders: boolean; parentHeaders: { name: string; startCol: number; colSpan: number }[] } {
  if (!row1 || !row2 || row1.length === 0 || row2.length === 0) {
    return { hasParentHeaders: false, parentHeaders: [] }
  }

  // Check if row1 has significantly fewer non-empty cells than row2 (indicating merged parent headers)
  const row1NonEmpty = row1.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '').length
  const row2NonEmpty = row2.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== '').length

  // If row1 has fewer than half the non-empty cells of row2, it likely has parent headers
  // Also check if row2 looks like actual column headers (more specific text)
  const hasParentHeaders = row1NonEmpty > 0 && row1NonEmpty < row2NonEmpty && row2NonEmpty >= 3

  if (!hasParentHeaders) {
    return { hasParentHeaders: false, parentHeaders: [] }
  }

  // Build parent headers with their column spans
  const parentHeaders: { name: string; startCol: number; colSpan: number }[] = []
  let currentParent: { name: string; startCol: number; colSpan: number } | null = null

  for (let i = 0; i < Math.max(row1.length, row2.length); i++) {
    const parentCell = row1[i]
    const hasParentValue = parentCell !== undefined && parentCell !== null && String(parentCell).trim() !== ''

    if (hasParentValue) {
      // New parent header starts
      if (currentParent) {
        parentHeaders.push(currentParent)
      }
      currentParent = {
        name: String(parentCell).trim(),
        startCol: i,
        colSpan: 1
      }
    } else if (currentParent) {
      // Continue current parent's span
      currentParent.colSpan++
    } else {
      // No parent for this column (columns before first parent header)
      // Create empty parent
      if (parentHeaders.length === 0 || parentHeaders[parentHeaders.length - 1].name !== '') {
        currentParent = {
          name: '',
          startCol: i,
          colSpan: 1
        }
      } else {
        parentHeaders[parentHeaders.length - 1].colSpan++
      }
    }
  }

  // Don't forget the last parent
  if (currentParent) {
    parentHeaders.push(currentParent)
  }

  console.log('Detected parent headers:', parentHeaders)

  return { hasParentHeaders: true, parentHeaders }
}

/**
 * API Route to process Intelligence CSV/Excel files
 * Preserves data structure as-is and detects parent headers
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Processing intelligence file request...')

    const contentType = request.headers.get('content-type') || ''
    let fileName: string
    let fileBuffer: Buffer
    let intelligenceType: string = 'distributor'

    // Handle JSON request (base64 encoded file)
    if (contentType.includes('application/json')) {
      console.log('Processing JSON request with base64 data')
      const body = await request.json()

      if (!body.fileData || !body.fileName) {
        return createResponse(
          { error: 'Missing fileData or fileName in request body' },
          400
        )
      }

      fileName = body.fileName.toLowerCase()
      fileBuffer = Buffer.from(body.fileData, 'base64')
      intelligenceType = body.intelligenceType || 'distributor'

      console.log('File name:', body.fileName, 'Size:', fileBuffer.length)
    }
    // Handle FormData request (legacy support)
    else if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData request')
      let formData: FormData
      try {
        formData = await request.formData()
        console.log('FormData parsed successfully')
      } catch (formError: any) {
        console.error('FormData parsing error:', formError.message)
        return createResponse(
          {
            error: 'Failed to parse form data',
            details: formError.message,
            hint: 'Please try refreshing the page and uploading again.'
          },
          400
        )
      }

      const intelligenceFile = formData.get('intelligenceFile') as File | null
      intelligenceType = formData.get('intelligenceType') as string || 'distributor'

      if (!intelligenceFile) {
        return createResponse(
          { error: 'intelligenceFile is required' },
          400
        )
      }

      fileName = intelligenceFile.name.toLowerCase()
      fileBuffer = Buffer.from(await intelligenceFile.arrayBuffer())
      console.log('File name:', intelligenceFile.name, 'Size:', fileBuffer.length)
    }
    else {
      return createResponse(
        { error: 'Unsupported content type. Use application/json or multipart/form-data' },
        400
      )
    }

    console.log('Intelligence type:', intelligenceType)

    // Validate file types
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return createResponse(
        { error: 'File must be Excel (.xlsx, .xls) or CSV (.csv)' },
        400
      )
    }

    const isCsv = fileName.endsWith('.csv')

    // Read workbook
    let workbook: XLSX.WorkBook
    if (isCsv) {
      const csvString = fileBuffer.toString('utf-8')
      workbook = XLSX.read(csvString, {
        type: 'string',
        raw: true // Preserve raw values
      })
    } else {
      workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        raw: true // Preserve raw values
      })
    }

    if (workbook.SheetNames.length === 0) {
      return createResponse(
        { error: 'File has no sheets' },
        400
      )
    }

    // Process first sheet only (for simplicity)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    console.log(`Processing sheet: ${firstSheetName}`)

    // Convert to JSON array (preserving structure)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Array of arrays
      raw: true // Keep raw values as-is
    }) as any[][]

    console.log(`Sheet ${firstSheetName} has ${jsonData.length} rows`)

    if (jsonData.length === 0) {
      return createResponse(
        { error: 'File has no data rows' },
        400
      )
    }

    // Detect if we have parent headers (two-row header structure)
    const { hasParentHeaders, parentHeaders } = detectParentHeaders(jsonData[0], jsonData[1])

    let headers: string[]
    let dataStartRow: number

    if (hasParentHeaders) {
      // Two-row header structure: row 0 = parent headers, row 1 = child headers
      headers = (jsonData[1] || []).map((h: any) =>
        String(h || '').trim()
      )
      dataStartRow = 2
      console.log('Using two-row header structure')
      console.log('Parent headers:', parentHeaders)
      console.log('Child headers:', headers)
    } else {
      // Single-row header structure
      headers = (jsonData[0] || []).map((h: any) =>
        String(h || '').trim()
      )
      dataStartRow = 1
      console.log('Using single-row header structure')
    }

    // Filter out empty headers but keep track of their indices
    const headerIndices: number[] = []
    const filteredHeaders: string[] = []
    headers.forEach((h, index) => {
      if (h) {
        filteredHeaders.push(h)
        headerIndices.push(index)
      }
    })

    console.log(`Headers found:`, filteredHeaders)

    // Rest are data rows - replace placeholders with demo data based on headers
    const rows = jsonData.slice(dataStartRow).filter(row => {
      // Filter out completely empty rows
      return row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')
    }).map((row: any[], rowIndex: number) => {
      const rowData: Record<string, any> = {}
      filteredHeaders.forEach((header, idx) => {
        const originalIndex = headerIndices[idx]
        const value = row[originalIndex]

        // Check if value is empty or a placeholder
        if (value === null || value === undefined || value === '') {
          rowData[header] = ''
        } else {
          const stringValue = String(value).trim()
          // If the value is a placeholder (xx, N/A, etc.), generate demo data
          if (isPlaceholder(stringValue)) {
            rowData[header] = generateDemoValue(header, rowIndex)
          } else {
            rowData[header] = stringValue
          }
        }
      })
      return rowData
    })

    console.log(`Processed ${rows.length} data rows`)
    if (rows.length > 0) {
      console.log(`Sample row:`, rows[0])
    }

    // Adjust parent headers to account for filtered empty headers
    let adjustedParentHeaders: { name: string; startCol: number; colSpan: number }[] = []
    if (hasParentHeaders) {
      // Map parent headers to filtered header indices
      adjustedParentHeaders = parentHeaders.map(ph => {
        // Find how many filtered headers fall within this parent's range
        let newStartCol = -1
        let newColSpan = 0

        for (let i = 0; i < filteredHeaders.length; i++) {
          const originalIndex = headerIndices[i]
          if (originalIndex >= ph.startCol && originalIndex < ph.startCol + ph.colSpan) {
            if (newStartCol === -1) newStartCol = i
            newColSpan++
          }
        }

        return {
          name: ph.name,
          startCol: newStartCol >= 0 ? newStartCol : 0,
          colSpan: newColSpan > 0 ? newColSpan : 1
        }
      }).filter(ph => ph.colSpan > 0) // Remove parents with no child headers
    }

    // Return simplified structure for raw table display
    return createResponse({
      success: true,
      data: {
        type: intelligenceType,
        headers: filteredHeaders,
        parentHeaders: hasParentHeaders ? adjustedParentHeaders : null,
        rows: rows,
        rowCount: rows.length,
        sheetName: firstSheetName
      },
      message: `Processed ${rows.length} rows from ${firstSheetName}`
    })

  } catch (error: any) {
    console.error('Error processing intelligence file:', error)
    return createResponse(
      {
        error: 'Failed to process file',
        details: error.message
      },
      500
    )
  }
}

