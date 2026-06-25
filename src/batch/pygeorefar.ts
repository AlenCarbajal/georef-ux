// Motor de la carga en lote basado en la librería propia pygeorefar (Python),
// ejecutada con Pyodide (CPython → WebAssembly) dentro de un Web Worker. Correr
// en el worker es necesario: el XHR síncrono de pyodide-http no funciona para
// POST cross-origin en el hilo principal, y además evita congelar la UI.

const WHEEL = 'pygeorefar-0.1.0-py3-none-any.whl'

/** Estados de inicialización, para mostrar feedback en la UI. */
export type PyStatus = 'loading-runtime' | 'installing-packages' | 'ready'

export interface PyBatchRow {
  georef_match: string
  [col: string]: string
}

let worker: Worker | null = null
let msgId = 0

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./pygeorefar.worker.ts', import.meta.url), {
      type: 'classic',
    })
  }
  return worker
}

/**
 * Corre el lote contra pygeorefar (en el worker). `queries` es la lista de
 * consultas (una por fila enviable); `fields` son las rutas de campos a incluir
 * en la salida (p. ej. `provincia.nombre`, `ubicacion.lat`). Devuelve una fila
 * por consulta, en orden, con `georef_match` y las columnas `georef_<campo>`.
 */
export function runBatchPy(
  endpoint: string,
  queries: Record<string, unknown>[],
  fields: string[],
  onProgress?: (done: number, total: number) => void,
  onStatus?: (s: PyStatus) => void,
): Promise<PyBatchRow[]> {
  const w = getWorker()
  const id = ++msgId
  const wheelUrl = new URL(
    import.meta.env.BASE_URL + 'wheels/' + WHEEL,
    document.baseURI,
  ).href

  return new Promise((resolve, reject) => {
    function cleanup() {
      w.removeEventListener('message', onMessage)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onMessage(e: MessageEvent<any>) {
      const m = e.data
      if (!m || m.id !== id) return
      switch (m.type) {
        case 'status':
          onStatus?.(m.status as PyStatus)
          break
        case 'progress':
          onProgress?.(m.done, m.total)
          break
        case 'result':
          cleanup()
          resolve(JSON.parse(m.rowsJson) as PyBatchRow[])
          break
        case 'error':
          cleanup()
          reject(new Error(m.message))
          break
      }
    }
    w.addEventListener('message', onMessage)
    w.postMessage({
      id,
      wheelUrl,
      endpoint,
      queriesJson: JSON.stringify(queries),
      fieldsJson: JSON.stringify(fields),
    })
  })
}
