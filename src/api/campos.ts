// Descubre los campos válidos de un recurso para ofrecerlos como multiselect.
// Truco: al pedir un `campos` inválido, la API responde 400 con la lista de
// campos posibles en `errores[0].ayuda`. Se cachea por recurso.

import { BASE_URL } from './georef'
import type { GeorefResource } from './types'

const cache = new Map<GeorefResource, string[]>()

export async function fetchCampos(resource: GeorefResource): Promise<string[]> {
  const cached = cache.get(resource)
  if (cached) return cached

  const res = await fetch(`${BASE_URL}/${resource}?campos=_descubrir&max=1`)
  const body = await res.json()
  const ayuda: unknown = body?.errores?.[0]?.ayuda
  const fields = Array.isArray(ayuda) ? (ayuda as string[]) : []
  cache.set(resource, fields)
  return fields
}
