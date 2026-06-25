// Cliente tipado de la API Georef v2. Única fuente de verdad de red:
// componentes y (en Fase 2) el batch reutilizan BASE_URL, buildUrl y los tipos.

import type {
  GeorefEntity,
  GeorefResource,
  GeorefResponse,
  QueryParams,
} from './types'

/** Máximo de consultas por request batch que acepta Georef. */
export const BATCH_MAX = 1000

// Fijamos la versión vigente (v2.1). Sin versión la API sirve "la última" y
// la v2.0 quedó deprecada (deja de responder), por eso conviene pinearla.
export const BASE_URL = 'https://apis.datos.gob.ar/georef/api/v2.1'

/** Error con el mensaje legible que devuelve Georef en `errores[]`. */
export class GeorefApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GeorefApiError'
  }
}

/** Construye la URL del recurso omitiendo parámetros vacíos. */
export function buildUrl(
  resource: GeorefResource,
  params: QueryParams,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const v = value.trim()
    if (v !== '') search.set(key, v)
  }
  const qs = search.toString()
  return `${BASE_URL}/${resource}${qs ? `?${qs}` : ''}`
}

/** Devuelve el array de resultados desde la respuesta (maneja `ubicacion`). */
export function extractEntities(
  resource: GeorefResource,
  data: GeorefResponse,
): GeorefEntity[] {
  // La clave del array en la respuesta usa guión bajo aunque el path use guión
  // (ej. `gobiernos-locales` -> `gobiernos_locales`).
  const value = data[resource.replace(/-/g, '_')]
  if (Array.isArray(value)) return value as GeorefEntity[]
  // `ubicacion` devuelve un único objeto.
  if (value && typeof value === 'object') return [value as GeorefEntity]
  return []
}

/** Ejecuta el GET y normaliza errores de red y de la API. */
export async function fetchGeoref(
  resource: GeorefResource,
  params: QueryParams,
): Promise<GeorefResponse> {
  const url = buildUrl(resource, params)
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch (err) {
    throw new GeorefApiError(
      `No se pudo conectar con la API: ${(err as Error).message}`,
    )
  }

  let body: GeorefResponse | null = null
  try {
    body = (await res.json()) as GeorefResponse
  } catch {
    // respuesta sin JSON (raro): caemos al manejo por status
  }

  if (!res.ok) {
    const msg = body?.errores?.map((e) => e.mensaje).filter(Boolean).join(' · ')
    throw new GeorefApiError(
      msg || `La API respondió ${res.status} ${res.statusText}`,
      res.status,
    )
  }

  if (!body) {
    throw new GeorefApiError('Respuesta vacía o no válida de la API.')
  }
  return body
}

/**
 * Ejecuta un request batch (POST) de hasta BATCH_MAX consultas en un solo
 * cuerpo `{ <recurso>: [...] }`. Devuelve los `resultados` en el mismo orden
 * que las consultas enviadas. No hace chunking: ver `geocodeRows` para eso.
 */
export async function fetchGeorefBatch(
  resource: GeorefResource,
  queries: Record<string, unknown>[],
): Promise<GeorefResponse[]> {
  if (queries.length > BATCH_MAX) {
    throw new GeorefApiError(
      `El batch admite hasta ${BATCH_MAX} consultas (recibidas ${queries.length}).`,
    )
  }

  // La clave del body es el plural del recurso. Casi todos los recursos ya son
  // plurales (provincias, direcciones…), pero `ubicacion` espera `ubicaciones`.
  const bodyKey = resource === 'ubicacion' ? 'ubicaciones' : resource

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${resource}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ [bodyKey]: queries }),
    })
  } catch (err) {
    throw new GeorefApiError(
      `No se pudo conectar con la API: ${(err as Error).message}`,
    )
  }

  let body: { resultados?: GeorefResponse[]; errores?: GeorefResponse['errores'] } | null = null
  try {
    body = await res.json()
  } catch {
    // se maneja por status abajo
  }

  if (!res.ok) {
    const msg = body?.errores?.map((e) => e.mensaje).filter(Boolean).join(' · ')
    throw new GeorefApiError(
      msg || `La API respondió ${res.status} ${res.statusText}`,
      res.status,
    )
  }

  if (!body?.resultados) {
    throw new GeorefApiError('Respuesta batch sin `resultados`.')
  }
  return body.resultados
}
