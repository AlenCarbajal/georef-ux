import { useCallback, useRef, useState } from 'react'
import { GeorefApiError } from '../api/georef'
import {
  parseFile,
  runBatch,
  type CsvData,
  type GeocodeProgress,
  type GeocodeResult,
  type RunConfig,
} from '../batch/geocode'
import type { PyStatus } from '../batch/pygeorefar'

export type BatchStatus = 'idle' | 'parsing' | 'ready' | 'running' | 'done' | 'error'

export interface BatchState {
  status: BatchStatus
  fileName: string | null
  data: CsvData | null
  progress: GeocodeProgress | null
  result: GeocodeResult | null
  error: string | null
  /** Estado de inicialización del motor Python (Pyodide). */
  pyStatus: PyStatus | null
}

const initial: BatchState = {
  status: 'idle',
  fileName: null,
  data: null,
  progress: null,
  result: null,
  error: null,
  pyStatus: null,
}

export function useBatchGeocode() {
  const [state, setState] = useState<BatchState>(initial)
  // Acceso síncrono a los datos parseados desde run().
  const dataRef = useRef<CsvData | null>(null)

  const loadFile = useCallback(async (file: File) => {
    dataRef.current = null
    setState({ ...initial, status: 'parsing', fileName: file.name })
    try {
      const data = await parseFile(file)
      dataRef.current = data
      setState({ ...initial, status: 'ready', fileName: file.name, data })
    } catch (err) {
      setState({
        ...initial,
        status: 'error',
        fileName: file.name,
        error: `No se pudo leer el archivo: ${(err as Error).message}`,
      })
    }
  }, [])

  const run = useCallback(async (config: RunConfig) => {
    const data = dataRef.current
    if (!data) return
    setState((s) => ({
      ...s,
      status: 'running',
      error: null,
      result: null,
      progress: { done: 0, total: data.rows.length },
    }))
    try {
      const result = await runBatch(
        data,
        config,
        (progress) => setState((s) => ({ ...s, progress })),
        (pyStatus) => setState((s) => ({ ...s, pyStatus })),
      )
      setState((s) => ({ ...s, status: 'done', result, pyStatus: null }))
    } catch (err) {
      const message =
        err instanceof GeorefApiError
          ? err.message
          : `Error al georreferenciar: ${(err as Error).message}`
      setState((s) => ({ ...s, status: 'error', error: message }))
    }
  }, [])

  const reset = useCallback(() => {
    dataRef.current = null
    setState(initial)
  }, [])

  return { ...state, loadFile, run, reset }
}
