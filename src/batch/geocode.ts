// Motor de carga en lote: parsea el CSV, arma las consultas según el mapeo
// columna→campo de la operación elegida, las envía en lotes y enriquece el CSV.

import Papa from 'papaparse'
import { BATCH_MAX, extractEntities, fetchGeorefBatch } from '../api/georef'
import type { GeorefResource } from '../api/types'
import type { BatchOperation } from './operations'

export interface CsvData {
  fields: string[]
  rows: Record<string, string>[]
}

/** Origen del valor de un campo: una columna del CSV, un valor fijo, o nada. */
export interface FieldSource {
  mode: 'none' | 'column' | 'fixed'
  value: string
}

export type Mapping = Record<string, FieldSource>

export interface RunConfig {
  operation: BatchOperation
  endpoint: GeorefResource
  mapping: Mapping
}

export interface GeocodeProgress {
  done: number
  total: number
}

export interface GeocodeResult {
  rows: Record<string, string>[]
  /** Filas con coincidencia. */
  matched: number
  /** Filas enviadas a la API (con los campos requeridos completos). */
  sent: number
}

/** Parsea un archivo CSV con encabezados. */
export function parseCsv(file: File): Promise<CsvData> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (res) => {
        const fields = res.meta.fields ?? []
        if (fields.length === 0) {
          reject(new Error('El CSV no tiene encabezados detectables.'))
          return
        }
        resolve({ fields, rows: res.data })
      },
      error: (err) => reject(err),
    })
  })
}

/**
 * Parsea un archivo Excel (.xls/.xlsx) con SheetJS: toma la primera hoja y usa
 * la primera fila como encabezados. Todos los valores se devuelven como texto.
 */
export async function parseExcel(file: File): Promise<CsvData> {
  // Import dinámico: SheetJS es pesado y solo se necesita para Excel, así que
  // se baja en un chunk aparte recién cuando el usuario sube un .xls/.xlsx.
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = sheetName ? wb.Sheets[sheetName] : undefined
  if (!ws) throw new Error('El archivo no tiene hojas.')
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })
  if (matrix.length === 0) throw new Error('La hoja está vacía.')
  const fields = (matrix[0] as unknown[])
    .map((h) => String(h ?? '').trim())
    .filter(Boolean)
  if (fields.length === 0) {
    throw new Error('No se detectaron encabezados en la primera fila.')
  }
  const rows = (matrix.slice(1) as unknown[][])
    .map((arr) => {
      const obj: Record<string, string> = {}
      fields.forEach((f, i) => {
        obj[f] = String(arr[i] ?? '').trim()
      })
      return obj
    })
    .filter((r) => Object.values(r).some((v) => v !== ''))
  return { fields, rows }
}

/**
 * Parsea una planilla por extensión: CSV con PapaParse, Excel (.xls/.xlsx) con
 * SheetJS. Devuelve siempre la misma forma `{ fields, rows }`.
 */
export function parseFile(file: File): Promise<CsvData> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseExcel(file)
  return parseCsv(file)
}

/** Resuelve el valor de un campo para una fila según el mapeo. */
function valueFor(
  field: BatchOperation['fields'][number],
  source: FieldSource | undefined,
  row: Record<string, string>,
): string {
  if (!source || source.mode === 'none') return ''
  const raw =
    source.mode === 'column' ? (row[source.value] ?? '') : source.value
  let val = raw.trim()
  if (field.numeric && val) val = val.replace(',', '.')
  return val
}

/**
 * Procesa todas las filas en lotes de BATCH_MAX. Las filas a las que les falta
 * algún campo requerido no se envían (quedan como `georef_match=no`).
 */
export async function runBatch(
  data: CsvData,
  config: RunConfig,
  onProgress?: (p: GeocodeProgress) => void,
): Promise<GeocodeResult> {
  const { operation, endpoint, mapping } = config

  const out: Record<string, string>[] = data.rows.map((r) => ({
    ...r,
    ...operation.enrich(undefined),
  }))

  // Armar las consultas con los requeridos completos, recordando el índice.
  const sendable: { idx: number; query: Record<string, unknown> }[] = []
  data.rows.forEach((row, idx) => {
    const query: Record<string, unknown> = { max: 1 }
    let ok = true
    for (const field of operation.fields) {
      const val = valueFor(field, mapping[field.name], row)
      if (val) {
        query[field.name] = field.numeric ? Number(val) : val
        if (field.numeric && Number.isNaN(query[field.name])) ok = false
      } else if (field.required) {
        ok = false
      }
    }
    if (ok) sendable.push({ idx, query })
  })

  const total = sendable.length
  let done = 0
  let matched = 0
  onProgress?.({ done, total })

  for (let i = 0; i < sendable.length; i += BATCH_MAX) {
    const chunk = sendable.slice(i, i + BATCH_MAX)
    const resultados = await fetchGeorefBatch(
      endpoint,
      chunk.map((c) => c.query),
    )
    chunk.forEach((item, j) => {
      const resp = resultados[j]
      const entity = resp ? extractEntities(endpoint, resp)[0] : undefined
      if (entity) matched++
      out[item.idx] = { ...data.rows[item.idx], ...operation.enrich(entity) }
    })
    done += chunk.length
    onProgress?.({ done, total })
  }

  return { rows: out, matched, sent: total }
}

/** Serializa las filas enriquecidas a CSV. */
export function rowsToCsv(rows: Record<string, string>[]): string {
  return Papa.unparse(rows)
}

/** Dispara la descarga del CSV enriquecido en el navegador. */
export function downloadCsv(rows: Record<string, string>[], filename: string) {
  const csv = rowsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
