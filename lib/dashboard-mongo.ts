/**
 * MongoDB CRUD layer for dashboard snapshots.
 *
 * Database  : DBbuilder
 * Collection: Builder
 *
 * Each document represents one saved dashboard and is identified by a
 * custom `dashboardId` (24-char hex, stored as the MongoDB _id for fast
 * single-field lookups without a secondary index).
 */

import { getMongoClient } from './mongodb'
import type { ComparisonData } from './types'
import type { IntelligenceSheetData } from './intelligence-sheet-types'

export type { IntelligenceSheetData } from './intelligence-sheet-types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardDocument {
  /** 24-char hex – used as MongoDB _id */
  _id: string
  name: string
  currency: 'USD' | 'INR'
  createdAt: string
  updatedAt: string
  /** Partition this dashboard belongs to (0–7). Assigned by master at creation. */
  partitionKey: number
  /** Total number of times this shared link has been opened. */
  readCount: number
  /** Core market data (value / volume) */
  data: ComparisonData | null
  intelligenceType: 'customer' | 'distributor' | 'both' | null
  rawIntelligenceData: IntelligenceSheetData | null
  proposition2Data: IntelligenceSheetData | null
  proposition3Data: IntelligenceSheetData | null
  distributorRawIntelligenceData: IntelligenceSheetData | null
  distributorProposition2Data: IntelligenceSheetData | null
  distributorProposition3Data: IntelligenceSheetData | null
  pricingAnalysisData: unknown
  showDemoNote: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  // 12 random bytes → 24 hex chars = 96 bits of entropy
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

const VALID_ID_RE = /^[0-9a-f]{24}$/

export function isValidDashboardId(id: unknown): id is string {
  return typeof id === 'string' && VALID_ID_RE.test(id)
}

async function getCollection() {
  const client = await getMongoClient()
  return client.db('DBbuilder').collection<DashboardDocument>('Builder')
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a brand-new dashboard snapshot to MongoDB.
 * Returns the generated dashboardId.
 */
export async function createDashboard(
  partial: Omit<DashboardDocument, '_id' | 'createdAt' | 'updatedAt' | 'readCount'>
): Promise<string> {
  const col = await getCollection()
  const id = generateId()
  const now = new Date().toISOString()

  const doc: DashboardDocument = {
    ...partial,
    _id: id,
    createdAt: now,
    updatedAt: now,
    readCount: 0,
  }

  await col.insertOne(doc)
  return id
}

/**
 * Load a dashboard by its ID.
 * Returns null when not found or when the ID is invalid.
 */
export async function getDashboard(id: string): Promise<DashboardDocument | null> {
  if (!isValidDashboardId(id)) return null

  const col = await getCollection()
  return col.findOne({ _id: id }) as Promise<DashboardDocument | null>
}

/**
 * Update an existing dashboard with a partial payload.
 * Always sets `updatedAt` to now.
 * Returns true when a document was actually updated.
 */
export async function updateDashboard(
  id: string,
  partial: Partial<Omit<DashboardDocument, '_id' | 'createdAt'>>
): Promise<boolean> {
  if (!isValidDashboardId(id)) return false

  const col = await getCollection()
  const result = await col.updateOne(
    { _id: id },
    { $set: { ...partial, updatedAt: new Date().toISOString() } }
  )
  return result.matchedCount > 0
}

/**
 * Increment readCount by 1.
 * Fire-and-forget — never awaited on the hot path so it adds zero latency
 * to the response served to the client.
 */
export function incrementReadCount(id: string): void {
  if (!isValidDashboardId(id)) return
  getCollection()
    .then(col => col.updateOne({ _id: id }, { $inc: { readCount: 1 } }))
    .catch(err => console.error('[dashboard-mongo] incrementReadCount failed:', err))
}

/**
 * Upsert: update if `id` exists and is valid, otherwise create a new document.
 * Returns the dashboardId (same as `id` if updated, new id if created).
 */
export async function upsertDashboard(
  id: string | null | undefined,
  payload: Omit<DashboardDocument, '_id' | 'createdAt' | 'updatedAt' | 'readCount'>
): Promise<string> {
  if (id && isValidDashboardId(id)) {
    const updated = await updateDashboard(id, payload)
    if (updated) return id
  }
  // No valid id or document not found – create fresh
  return createDashboard(payload)
}
