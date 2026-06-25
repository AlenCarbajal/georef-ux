import { useCallback, useState } from 'react'
import {
  GeorefApiError,
  extractEntities,
  fetchGeoref,
} from '../api/georef'
import type { GeorefEntity, GeorefResource, GeorefResponse, QueryParams } from '../api/types'

export interface QueryState {
  loading: boolean
  error: string | null
  response: GeorefResponse | null
  entities: GeorefEntity[]
  resource: GeorefResource | null
}

const initialState: QueryState = {
  loading: false,
  error: null,
  response: null,
  entities: [],
  resource: null,
}

/** Hook que envuelve fetchGeoref con estado loading/error/data. */
export function useGeorefQuery() {
  const [state, setState] = useState<QueryState>(initialState)

  const run = useCallback(
    async (resource: GeorefResource, params: QueryParams) => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const response = await fetchGeoref(resource, params)
        setState({
          loading: false,
          error: null,
          response,
          entities: extractEntities(resource, response),
          resource,
        })
      } catch (err) {
        const message =
          err instanceof GeorefApiError
            ? err.message
            : `Error inesperado: ${(err as Error).message}`
        setState({
          loading: false,
          error: message,
          response: null,
          entities: [],
          resource,
        })
      }
    },
    [],
  )

  return { ...state, run }
}
