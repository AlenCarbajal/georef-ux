// Límites (polígonos) de unidades territoriales. La API Georef sólo devuelve el
// centroide, así que la geometría se trae del geoservicio WFS del IGN, que usa
// los mismos códigos INDEC que los `id` de Georef (campo `in1`) y tiene CORS abierto.

import type { FeatureCollection } from 'geojson'
import type { GeorefResource } from './types'

const IGN_WFS = 'https://wms.ign.gob.ar/geoserver/ows'

/** Recursos cuyos límites publica el IGN: capa y campo de código (= id de Georef). */
const BOUNDARY_LAYER: Partial<
  Record<GeorefResource, { layer: string; codeField: string }>
> = {
  provincias: { layer: 'ign:provincia', codeField: 'in1' },
  departamentos: { layer: 'ign:departamento', codeField: 'in1' },
  municipios: { layer: 'ign:municipio', codeField: 'in1' },
}

/** Indica si el recurso tiene límites disponibles para graficar. */
export function supportsBoundaries(resource: GeorefResource | null): boolean {
  return !!resource && resource in BOUNDARY_LAYER
}

/**
 * Trae los polígonos de las entidades indicadas (por `id`) en una sola consulta
 * WFS. Devuelve null si el recurso no tiene límites o no hay ids.
 */
export async function fetchBoundaries(
  resource: GeorefResource,
  ids: string[],
): Promise<FeatureCollection | null> {
  const cfg = BOUNDARY_LAYER[resource]
  if (!cfg || ids.length === 0) return null

  const list = ids.map((id) => `'${id}'`).join(',')
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: cfg.layer,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    CQL_FILTER: `${cfg.codeField} IN (${list})`,
  })

  const res = await fetch(`${IGN_WFS}?${params.toString()}`)
  if (!res.ok) throw new Error(`El IGN respondió ${res.status}`)
  return (await res.json()) as FeatureCollection
}
