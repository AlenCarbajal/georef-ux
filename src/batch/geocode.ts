// Georreferenciación / normalización de direcciones en lote.
// Reutiliza el cliente tipado de src/api (fetchGeorefBatch, extractEntities).

import Papa from 'papaparse'
import { BATCH_MAX, extractEntities, fetchGeorefBatch } from '../api/georef'
import type { GeorefEntity } from '../api/types'

export interface CsvData {
  fields: string[]
  rows: Record<string, string>[]
}

export interface ColumnMapping {
  /** Columna del CSV que contiene la dirección a normalizar. */
  direccion: string
  /** Columna opcional con la provincia por fila. */
  provincia?: string
  /** Provincia fija aplicada a todas las filas (si no hay columna). */
  provinciaFija?: string
}

export interface GeocodeProgress {
  done: number
  total: number
}

export interface GeocodeResult {
  /** Filas originales + columnas `georef_*`. */
  rows: Record<string, string>[]
  /** Cantidad de filas con coincidencia. */
  matched: number
  /** Cantidad de filas con dirección no vacía enviadas a la API. */
  sent: number
}

/** Columnas que se agregan a cada fila del CSV de salida. */
const ENRICH_KEYS = [
  'georef_match',
  'georef_nomenclatura',
  'georef_lat',
  'georef_lon',
  'georef_provincia',
  'georef_departamento',
  'georef_localidad_censal',
  'georef_calle',
  'georef_altura',
] as const

type Enrichment = Record<(typeof ENRICH_KEYS)[number], string>

const EMPTY_ENRICHMENT: Enrichment = {
  georef_match: 'no',
  georef_nomenclatura: '',
  georef_lat: '',
  georef_lon: '',
  georef_provincia: '',
  georef_departamento: '',
  georef_localidad_censal: '',
  georef_calle: '',
  georef_altura: '',
}

function name(ref?: { nombre?: string }): string {
  return ref?.nombre ?? ''
}

function num(n?: number): string {
  return typeof n === 'number' ? String(n) : ''
}

/** Construye las columnas georef_* a partir de la entidad de `direcciones`. */
function enrichmentFromEntity(e: GeorefEntity): Enrichment {
  const coord = e.ubicacion ?? e.centroide
  return {
    georef_match: 'si',
    georef_nomenclatura: (e.nomenclatura as string) ?? '',
    georef_lat: num(coord?.lat),
    georef_lon: num(coord?.lon),
    georef_provincia: name(e.provincia),
    georef_departamento: name(e.departamento),
    georef_localidad_censal: name(e.localidad_censal),
    georef_calle: name(e.calle),
    georef_altura: num(e.altura?.valor),
  }
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
 * Georreferencia todas las filas en lotes de BATCH_MAX. Las filas con
 * dirección vacía no se envían (quedan como `georef_match=no`).
 */
export async function geocodeRows(
  data: CsvData,
  mapping: ColumnMapping,
  onProgress?: (p: GeocodeProgress) => void,
): Promise<GeocodeResult> {
  // Salida inicial: cada fila con enriquecimiento vacío.
  const out: Record<string, string>[] = data.rows.map((r) => ({
    ...r,
    ...EMPTY_ENRICHMENT,
  }))

  // Construir solo las consultas con dirección no vacía, recordando su índice.
  const sendable: { idx: number; query: Record<string, unknown> }[] = []
  data.rows.forEach((row, idx) => {
    const direccion = (row[mapping.direccion] ?? '').trim()
    if (!direccion) return
    const query: Record<string, unknown> = { direccion, max: 1 }
    const prov = mapping.provincia
      ? (row[mapping.provincia] ?? '').trim()
      : (mapping.provinciaFija ?? '').trim()
    if (prov) query.provincia = prov
    sendable.push({ idx, query })
  })

  const total = sendable.length
  let done = 0
  let matched = 0
  onProgress?.({ done, total })

  for (let i = 0; i < sendable.length; i += BATCH_MAX) {
    const chunk = sendable.slice(i, i + BATCH_MAX)
    const resultados = await fetchGeorefBatch(
      'direcciones',
      chunk.map((c) => c.query),
    )
    chunk.forEach((item, j) => {
      const resp = resultados[j]
      const entity = resp ? extractEntities('direcciones', resp)[0] : undefined
      if (entity) {
        matched++
        out[item.idx] = { ...data.rows[item.idx], ...enrichmentFromEntity(entity) }
      }
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
