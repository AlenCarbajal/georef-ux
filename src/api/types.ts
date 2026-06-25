// Tipos para la API Georef v2 (https://apis.datos.gob.ar/georef/api/).

/** Recursos GET soportados por el explorador. */
export const RESOURCES = [
  'provincias',
  'departamentos',
  'municipios',
  'gobiernos-locales',
  'localidades',
  'localidades-censales',
  'asentamientos',
  'calles',
  'cuadras',
  'direcciones',
  'ubicacion',
] as const

export type GeorefResource = (typeof RESOURCES)[number]

/** Par lat/lon que devuelve la API en `centroide` y en `ubicacion`. */
export interface Coord {
  lat: number
  lon: number
}

/** Referencia anidada (provincia, departamento, etc.). */
export interface NamedRef {
  id?: string
  nombre?: string
}

/**
 * Entidad genérica. La API tiene esquemas distintos por recurso, pero
 * todas comparten `id`/`nombre` y casi todas traen `centroide`.
 * Indexable para poder construir la tabla dinámicamente.
 */
export interface GeorefEntity {
  id?: string
  nombre?: string
  nomenclatura?: string
  centroide?: Coord
  provincia?: NamedRef
  departamento?: NamedRef
  municipio?: NamedRef
  localidad_censal?: NamedRef
  // resultado de `direcciones`
  ubicacion?: Coord
  altura?: { valor?: number; unidad?: string }
  calle?: NamedRef & { categoria?: string }
  [key: string]: unknown
}

/** Forma del cuerpo de error de Georef. */
export interface GeorefError {
  mensaje?: string
  codigo_interno?: number | null
  parametro?: string
}

/**
 * Respuesta de un recurso. El array de resultados viene bajo una clave
 * con el nombre del recurso (p. ej. `provincias`), salvo `ubicacion`
 * que devuelve un único objeto bajo `ubicacion`.
 */
export interface GeorefResponse {
  inicio?: number
  cantidad?: number
  total?: number
  parametros?: Record<string, unknown>
  errores?: GeorefError[]
  // clave dinámica con el array (o, para ubicacion, un objeto)
  [resource: string]: unknown
}

/** Valores de parámetros del formulario (todos string para los inputs). */
export type QueryParams = Record<string, string>
