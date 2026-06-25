// Metadatos de parámetros por recurso, usados por el RequestBuilder para
// renderizar el formulario adecuado a cada endpoint.

import type { GeorefResource } from './types'

export interface FieldDef {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'number'
}

// Parámetros comunes a la mayoría de los recursos de listado.
const COMMON: FieldDef[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Córdoba' },
  { name: 'max', label: 'Máx. resultados', placeholder: '10', type: 'number' },
  { name: 'inicio', label: 'Inicio (offset)', placeholder: '0', type: 'number' },
]

const PROVINCIA: FieldDef = {
  name: 'provincia',
  label: 'Provincia',
  placeholder: 'Nombre o ID',
}
const DEPARTAMENTO: FieldDef = {
  name: 'departamento',
  label: 'Departamento',
  placeholder: 'Nombre o ID',
}

export const FIELDS_BY_RESOURCE: Record<GeorefResource, FieldDef[]> = {
  provincias: [...COMMON],
  departamentos: [PROVINCIA, ...COMMON],
  municipios: [PROVINCIA, ...COMMON],
  'gobiernos-locales': [PROVINCIA, ...COMMON],
  localidades: [PROVINCIA, DEPARTAMENTO, ...COMMON],
  'localidades-censales': [PROVINCIA, DEPARTAMENTO, ...COMMON],
  asentamientos: [PROVINCIA, DEPARTAMENTO, ...COMMON],
  calles: [
    PROVINCIA,
    DEPARTAMENTO,
    { name: 'nombre', label: 'Nombre de calle', placeholder: 'Ej. San Martín' },
    { name: 'max', label: 'Máx. resultados', placeholder: '10', type: 'number' },
  ],
  cuadras: [
    PROVINCIA,
    DEPARTAMENTO,
    { name: 'max', label: 'Máx. resultados', placeholder: '10', type: 'number' },
  ],
  direcciones: [
    {
      name: 'direccion',
      label: 'Dirección',
      placeholder: 'Ej. Av. Rivadavia 1234',
    },
    PROVINCIA,
    DEPARTAMENTO,
    {
      name: 'localidad_censal',
      label: 'Localidad censal',
      placeholder: 'Nombre o ID',
    },
    { name: 'max', label: 'Máx. resultados', placeholder: '10', type: 'number' },
  ],
  ubicacion: [
    { name: 'lat', label: 'Latitud', placeholder: '-34.6', type: 'number' },
    { name: 'lon', label: 'Longitud', placeholder: '-58.4', type: 'number' },
  ],
}
