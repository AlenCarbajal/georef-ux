// Motor de la carga en lote basado en la librería propia pygeorefar (Python),
// ejecutada en el navegador con Pyodide (CPython → WebAssembly). Corre los POST
// bulk troceados (chunking ≤1000 / Σmax≤5000) que implementa pygeorefar.
//
// Se carga de forma perezosa (solo al usar la carga en lote) para no pagar el
// cold-start de Pyodide en el explorador.

const PYODIDE_VERSION = 'v0.28.0'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`
const WHEEL = 'pygeorefar-0.1.0-py3-none-any.whl'

/** Estados de inicialización, para mostrar feedback en la UI. */
export type PyStatus = 'loading-runtime' | 'installing-packages' | 'ready'

export interface PyBatchRow {
  georef_match: string
  [col: string]: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pyodide = any

let pyodidePromise: Promise<Pyodide> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.head.appendChild(s)
  })
}

/** Glue de Python: define run_batch() una sola vez sobre el cliente pygeorefar. */
const GLUE = `
import json
from src.georef_client import GeorefClient

_client = GeorefClient()

def _walk(obj, path):
    cur = obj
    for part in path.split('.'):
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            cur = getattr(cur, part, None)
        if cur is None:
            return ''
    return '' if cur is None else cur

def run_batch(endpoint, queries_json, fields_json, progress):
    queries = json.loads(queries_json)
    fields = json.loads(fields_json)

    def cb(done, total):
        if progress is not None:
            progress(done, total)

    if endpoint == 'ubicacion':
        flat = _client.post_ubicacion(queries, on_progress=cb)
        results = [[r] for r in flat]
    else:
        model = _client.ENDPOINT_MODELS[endpoint]
        results = _client._post_bulk(endpoint, queries, model, on_progress=cb)

    rows = []
    for matches in results:
        if matches:
            data = matches[0].model_dump()
            row = {'georef_match': 'si'}
            for f in fields:
                v = _walk(data, f)
                row['georef_' + f.replace('.', '_')] = '' if v == '' else str(v)
        else:
            row = {'georef_match': 'no'}
            for f in fields:
                row['georef_' + f.replace('.', '_')] = ''
        rows.append(row)
    return json.dumps(rows)
`

async function init(onStatus?: (s: PyStatus) => void): Promise<Pyodide> {
  onStatus?.('loading-runtime')
  await loadScript(PYODIDE_CDN + 'pyodide.js')
  // loadPyodide queda global tras cargar el script del CDN.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodide = await (globalThis as any).loadPyodide({ indexURL: PYODIDE_CDN })

  onStatus?.('installing-packages')
  await pyodide.loadPackage('micropip')
  const micropip = pyodide.pyimport('micropip')
  // Deps desde el índice de Pyodide (pydantic 2.10.x, requests). pyodide-http
  // parchea requests para que use el fetch del navegador.
  await micropip.install(['pydantic', 'requests', 'pyodide-http'])
  // pygeorefar desde el wheel servido por la app; deps=False evita el conflicto
  // con el pin pydantic>=2.11.5 (Pyodide trae 2.10.x, compatible para los modelos).
  const wheelUrl = new URL(
    import.meta.env.BASE_URL + 'wheels/' + WHEEL,
    document.baseURI,
  ).href
  // callKwargs: pasa { deps:false } como keyword arg de Python (no posicional).
  await micropip.install.callKwargs(wheelUrl, { deps: false })

  await pyodide.runPythonAsync(`import pyodide_http; pyodide_http.patch_all()`)
  await pyodide.runPythonAsync(GLUE)

  onStatus?.('ready')
  return pyodide
}

/** Inicializa (o reutiliza) Pyodide + pygeorefar. */
export function ensurePygeorefar(onStatus?: (s: PyStatus) => void): Promise<Pyodide> {
  if (!pyodidePromise) pyodidePromise = init(onStatus)
  return pyodidePromise
}

/**
 * Corre el lote contra pygeorefar. `queries` es la lista de consultas (una por
 * fila enviable); `fields` son las rutas de campos a incluir en la salida
 * (p. ej. `provincia.nombre`, `ubicacion.lat`). Devuelve una fila por consulta,
 * en el mismo orden, con `georef_match` y las columnas `georef_<campo>`.
 */
export async function runBatchPy(
  endpoint: string,
  queries: Record<string, unknown>[],
  fields: string[],
  onProgress?: (done: number, total: number) => void,
  onStatus?: (s: PyStatus) => void,
): Promise<PyBatchRow[]> {
  const pyodide = await ensurePygeorefar(onStatus)
  const runBatch = pyodide.globals.get('run_batch')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cb = onProgress ? (d: number, t: number) => onProgress(d, t) : null
  try {
    const json: string = await runBatch(
      endpoint,
      JSON.stringify(queries),
      JSON.stringify(fields),
      cb,
    )
    return JSON.parse(json) as PyBatchRow[]
  } finally {
    runBatch.destroy?.()
  }
}
