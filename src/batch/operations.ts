// Operaciones de carga en lote: qué se puede normalizar/georreferenciar a partir
// de un CSV. Cada operación define el endpoint, los campos mapeables (columna del
// CSV o valor fijo) y cómo construir las columnas `georef_*` de salida.

import type { GeorefEntity, GeorefResource } from '../api/types'

export interface BatchField {
  name: string
  label: string
  required: boolean
  /** Permite mapear un valor fijo (además de una columna). Solo para opcionales. */
  allowFixed: boolean
  /** Se serializa como número (lat/lon). Acepta coma o punto decimal. */
  numeric?: boolean
  help: string
}

export interface BatchOperation {
  key: string
  label: string
  description: string
  /** Si está, el usuario elige la entidad; si no, el endpoint es fijo. */
  endpoints?: { value: GeorefResource; label: string }[]
  endpoint?: GeorefResource
  fields: BatchField[]
  /** Columnas de salida en orden (para encabezado estable). */
  outputColumns: string[]
  /** Construye las columnas de salida desde la entidad (o vacías si no hubo match). */
  enrich: (e: GeorefEntity | undefined) => Record<string, string>
}

const nm = (r?: { nombre?: string }) => r?.nombre ?? ''
const num = (n?: number) => (typeof n === 'number' ? String(n) : '')
function coordOf(e: GeorefEntity) {
  return (
    e.ubicacion ??
    e.centroide ??
    (typeof e.lat === 'number' && typeof e.lon === 'number'
      ? { lat: e.lat, lon: e.lon }
      : undefined)
  )
}

/** Devuelve un objeto con todas las claves en '' (fila sin coincidencia). */
function empty(cols: string[]): Record<string, string> {
  const o: Record<string, string> = {}
  for (const c of cols) o[c] = ''
  o.georef_match = 'no'
  return o
}

const DIRECCIONES_COLS = [
  'georef_match',
  'georef_nomenclatura',
  'georef_lat',
  'georef_lon',
  'georef_provincia',
  'georef_departamento',
  'georef_localidad_censal',
  'georef_calle',
  'georef_altura',
]

const UBICACION_COLS = [
  'georef_match',
  'georef_provincia',
  'georef_departamento',
  'georef_municipio',
  'georef_gobierno_local',
]

const TERRITORIAL_COLS = [
  'georef_match',
  'georef_id',
  'georef_nombre',
  'georef_provincia',
  'georef_departamento',
  'georef_lat',
  'georef_lon',
]

export const OPERATIONS: BatchOperation[] = [
  {
    key: 'direcciones',
    label: 'Normalizar direcciones',
    description:
      'Cada fila tiene una dirección escrita (calle y altura). Se normaliza y se georreferencia (lat/lon + unidades territoriales).',
    endpoint: 'direcciones',
    fields: [
      {
        name: 'direccion',
        label: 'Dirección',
        required: true,
        allowFixed: false,
        help: 'Columna con la calle y la altura (ej. "Av. Rivadavia 1234").',
      },
      {
        name: 'provincia',
        label: 'Provincia',
        required: false,
        allowFixed: true,
        help: 'Acota la búsqueda. Columna del CSV o un valor fijo (nombre o id).',
      },
      {
        name: 'departamento',
        label: 'Departamento',
        required: false,
        allowFixed: true,
        help: 'Opcional. Columna o valor fijo.',
      },
      {
        name: 'localidad_censal',
        label: 'Localidad censal',
        required: false,
        allowFixed: true,
        help: 'Opcional. Columna o valor fijo.',
      },
    ],
    outputColumns: DIRECCIONES_COLS,
    enrich: (e) =>
      e
        ? {
            georef_match: 'si',
            georef_nomenclatura: (e.nomenclatura as string) ?? '',
            georef_lat: num(coordOf(e)?.lat),
            georef_lon: num(coordOf(e)?.lon),
            georef_provincia: nm(e.provincia),
            georef_departamento: nm(e.departamento),
            georef_localidad_censal: nm(e.localidad_censal),
            georef_calle: nm(e.calle),
            georef_altura: num(e.altura?.valor),
          }
        : empty(DIRECCIONES_COLS),
  },
  {
    key: 'ubicacion',
    label: 'Georreferencia inversa (coordenadas → unidades)',
    description:
      'Cada fila tiene latitud y longitud. Se devuelven las unidades territoriales que contienen ese punto.',
    endpoint: 'ubicacion',
    fields: [
      {
        name: 'lat',
        label: 'Latitud',
        required: true,
        allowFixed: false,
        numeric: true,
        help: 'Columna con la latitud en grados decimales (negativa en Argentina).',
      },
      {
        name: 'lon',
        label: 'Longitud',
        required: true,
        allowFixed: false,
        numeric: true,
        help: 'Columna con la longitud en grados decimales (negativa en Argentina).',
      },
    ],
    outputColumns: UBICACION_COLS,
    enrich: (e) =>
      e
        ? {
            georef_match: 'si',
            georef_provincia: nm(e.provincia),
            georef_departamento: nm(e.departamento),
            georef_municipio: nm(e.municipio),
            georef_gobierno_local: nm(e.gobierno_local),
          }
        : empty(UBICACION_COLS),
  },
  {
    key: 'territorial',
    label: 'Normalizar nombres de unidades territoriales',
    description:
      'Cada fila tiene el nombre de una unidad (provincia, departamento, municipio o localidad). Se devuelve el id y el nombre oficial.',
    endpoints: [
      { value: 'provincias', label: 'Provincias' },
      { value: 'departamentos', label: 'Departamentos' },
      { value: 'municipios', label: 'Municipios' },
      { value: 'localidades', label: 'Localidades' },
    ],
    fields: [
      {
        name: 'nombre',
        label: 'Nombre',
        required: true,
        allowFixed: false,
        help: 'Columna con el nombre a normalizar (ej. "cordoba", "sant fe").',
      },
      {
        name: 'provincia',
        label: 'Provincia',
        required: false,
        allowFixed: true,
        help: 'Acota por provincia (no aplica a Provincias). Columna o valor fijo.',
      },
    ],
    outputColumns: TERRITORIAL_COLS,
    enrich: (e) =>
      e
        ? {
            georef_match: 'si',
            georef_id: (e.id as string) ?? '',
            georef_nombre: (e.nombre as string) ?? '',
            georef_provincia: nm(e.provincia),
            georef_departamento: nm(e.departamento),
            georef_lat: num(coordOf(e)?.lat),
            georef_lon: num(coordOf(e)?.lon),
          }
        : empty(TERRITORIAL_COLS),
  },
]
