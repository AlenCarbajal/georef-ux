// Genera fragmentos de código listos para copiar a partir del recurso y los
// parámetros del formulario. Conecta el explorador con las librerías oficiales
// pygeorefar (Python) y georefar (R), además de cURL y fetch (JavaScript).

import { buildUrl } from './georef'
import type { GeorefResource, QueryParams } from './types'

export interface Snippet {
  label: string
  code: string
}

/** Método del cliente Python (pygeorefar) por recurso. */
const PY_METHOD: Record<GeorefResource, string> = {
  provincias: 'get_provincias',
  departamentos: 'get_departamentos',
  municipios: 'get_municipios',
  'gobiernos-locales': 'get_gobiernos_locales',
  localidades: 'get_localidades',
  'localidades-censales': 'get_localidades_censales',
  asentamientos: 'get_asentamientos',
  calles: 'get_calles',
  direcciones: 'get_direcciones',
  ubicacion: 'get_georef_inversa',
}

/** Función de la librería R (georefar) por recurso. */
const R_FN: Record<GeorefResource, string> = {
  provincias: 'get_provincias',
  departamentos: 'get_departamentos',
  municipios: 'get_municipios',
  'gobiernos-locales': 'get_gobiernos_locales',
  localidades: 'get_localidades',
  'localidades-censales': 'get_localidades_censales',
  asentamientos: 'get_asentamientos',
  calles: 'get_calles',
  direcciones: 'normalizar_direccion',
  ubicacion: 'get_ubicacion',
}

// Tipos de parámetro para formatear el valor según el lenguaje.
const NUMERIC = new Set(['max', 'inicio', 'lat', 'lon'])
const BOOLEAN = new Set(['exacto', 'aplanar'])

/** Pares [clave, valor] sin los vacíos. */
function nonEmpty(params: QueryParams): [string, string][] {
  return Object.entries(params)
    .map(([k, v]) => [k, v.trim()] as [string, string])
    .filter(([, v]) => v !== '')
}

function pyValue(key: string, value: string): string {
  if (BOOLEAN.has(key)) return 'True'
  if (NUMERIC.has(key)) return value
  return `'${value.replace(/'/g, "\\'")}'`
}

function rValue(key: string, value: string): string {
  if (BOOLEAN.has(key)) return 'TRUE'
  if (NUMERIC.has(key)) return value
  return `"${value.replace(/"/g, '\\"')}"`
}

export function buildSnippets(
  resource: GeorefResource,
  params: QueryParams,
): Snippet[] {
  const entries = nonEmpty(params)
  const url = buildUrl(resource, params)

  const curl = `curl "${url}"`

  const js =
    `const res = await fetch(\n  "${url}"\n)\nconst data = await res.json()\nconsole.log(data)`

  const pyArgs = entries
    .map(([k, v]) => `'${k}': ${pyValue(k, v)}`)
    .join(', ')
  const py =
    `# pip install -e pygeorefar\n` +
    `from src.georef_client import GeorefClient\n\n` +
    `client = GeorefClient()\n` +
    `resultado = client.${PY_METHOD[resource]}(${pyArgs ? `{${pyArgs}}` : ''})`

  const rArgs = entries.map(([k, v]) => `${k} = ${rValue(k, v)}`).join(', ')
  const r = `library(georefar)\n\n` + `resultado <- ${R_FN[resource]}(${rArgs})`

  return [
    { label: 'cURL', code: curl },
    { label: 'Python', code: py },
    { label: 'R', code: r },
    { label: 'JavaScript', code: js },
  ]
}
