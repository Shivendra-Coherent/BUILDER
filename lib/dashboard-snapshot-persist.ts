/**
 * Prepare / restore dashboard snapshots for MongoDB (size limits + gzip).
 */

import { gzipSync, gunzipSync } from 'zlib'
import type { ComparisonData, DataRecord } from './types'
import type { DashboardDocument } from './dashboard-mongo'

const INLINE_MAX_BYTES = 1_500_000
const MONGO_DOC_SOFT_LIMIT = 15_000_000

function slimRecords(records: DataRecord[]): DataRecord[] {
  return records.filter(
    (r) => r.is_aggregated !== true && r.segment !== '__ALL_SEGMENTS__'
  )
}

/** Drop redundant aggregated rows; charts filter on leaf data. */
export function slimComparisonData(data: ComparisonData | null): ComparisonData | null {
  if (!data?.data) return data

  return {
    ...data,
    data: {
      value: {
        geography_segment_matrix: slimRecords(
          data.data.value?.geography_segment_matrix ?? []
        ),
      },
      volume: {
        geography_segment_matrix: slimRecords(
          data.data.volume?.geography_segment_matrix ?? []
        ),
      },
    },
  }
}

function gzipToBase64(json: string): string {
  return gzipSync(Buffer.from(json, 'utf8')).toString('base64')
}

function gunzipFromBase64(b64: string): string {
  return gunzipSync(Buffer.from(b64, 'base64')).toString('utf8')
}

export type PersistedMarketData = {
  data: ComparisonData | null
  dataCompressed: string | null
}

export function persistMarketData(
  raw: ComparisonData | null | undefined
): PersistedMarketData {
  const slim = slimComparisonData(raw ?? null)
  if (!slim) return { data: null, dataCompressed: null }

  const json = JSON.stringify(slim)
  if (json.length <= INLINE_MAX_BYTES) {
    return { data: slim, dataCompressed: null }
  }

  const compressed = gzipToBase64(json)
  if (compressed.length > MONGO_DOC_SOFT_LIMIT) {
    throw new Error('DASHBOARD_TOO_LARGE')
  }

  return { data: null, dataCompressed: compressed }
}

export function restoreMarketData(doc: {
  data?: ComparisonData | null
  dataCompressed?: string | null
}): ComparisonData | null {
  if (doc.data) return doc.data
  if (!doc.dataCompressed) return null
  try {
    return JSON.parse(gunzipFromBase64(doc.dataCompressed)) as ComparisonData
  } catch (err) {
    console.error('[snapshot-persist] Failed to decompress market data:', err)
    return null
  }
}

export function persistJsonField(value: unknown): {
  inline: unknown
  compressed: string | null
} {
  if (value == null) return { inline: null, compressed: null }
  const json = JSON.stringify(value)
  if (json.length <= INLINE_MAX_BYTES) {
    return { inline: value, compressed: null }
  }
  const compressed = gzipToBase64(json)
  if (compressed.length > MONGO_DOC_SOFT_LIMIT) {
    throw new Error('DASHBOARD_TOO_LARGE')
  }
  return { inline: null, compressed }
}

export function restoreJsonField(doc: {
  inline?: unknown
  compressed?: string | null
}): unknown {
  if (doc.inline != null) return doc.inline
  if (!doc.compressed) return null
  try {
    return JSON.parse(gunzipFromBase64(doc.compressed))
  } catch {
    return null
  }
}

/** Decode client upload when body was gzip-compressed in the browser. */
export function decodeSaveRequestBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (body._compressed === true && typeof body.payload === 'string') {
    const json = gunzipFromBase64(body.payload)
    return JSON.parse(json) as Record<string, unknown>
  }
  return body
}

export function hydrateDashboardDocument(doc: DashboardDocument): DashboardDocument {
  return {
    ...doc,
    data: restoreMarketData(doc),
    pricingAnalysisData: restoreJsonField({
      inline: doc.pricingAnalysisData,
      compressed: doc.pricingAnalysisCompressed ?? null,
    }),
  }
}
