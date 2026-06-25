/// <reference lib="webworker" />
// Worker que corre pygeorefar dentro de Pyodide. Se ejecuta fuera del hilo
// principal: así el XHR síncrono de pyodide-http funciona para los POST
// cross-origin (en el hilo principal el navegador los bloquea) y la UI no se
// congela mientras procesa el lote.

const PYODIDE_VERSION = 'v0.28.0'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

// loadPyodide queda global tras importScripts del CDN.
declare function loadPyodide(opts: { indexURL: string }): Promise<Pyodide>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pyodide = any

interface RunMessage {
  id: number
  wheelUrl: string
  endpoint: string
  queriesJson: string
  fieldsJson: string
}

const ctx = self as unknown as Worker

/** Glue de Python: define run_batch() sobre el cliente pygeorefar. */
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

let pyodidePromise: Promise<Pyodide> | null = null

async function initPyodide(id: number, wheelUrl: string): Promise<Pyodide> {
  ctx.postMessage({ id, type: 'status', status: 'loading-runtime' })
  // importScripts permite cargar el loader del CDN (cross-origin) en el worker.
  ;(self as unknown as { importScripts: (u: string) => void }).importScripts(
    PYODIDE_CDN + 'pyodide.js',
  )
  const pyodide = await loadPyodide({ indexURL: PYODIDE_CDN })

  ctx.postMessage({ id, type: 'status', status: 'installing-packages' })
  await pyodide.loadPackage('micropip')
  const micropip = pyodide.pyimport('micropip')
  await micropip.install(['pydantic', 'requests', 'pyodide-http'])
  await micropip.install.callKwargs(wheelUrl, { deps: false })
  await pyodide.runPythonAsync('import pyodide_http; pyodide_http.patch_all()')
  await pyodide.runPythonAsync(GLUE)
  return pyodide
}

function ensurePyodide(id: number, wheelUrl: string): Promise<Pyodide> {
  if (!pyodidePromise) pyodidePromise = initPyodide(id, wheelUrl)
  return pyodidePromise
}

ctx.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { id, wheelUrl, endpoint, queriesJson, fieldsJson } = e.data
  try {
    const pyodide = await ensurePyodide(id, wheelUrl)
    ctx.postMessage({ id, type: 'status', status: 'ready' })
    const runBatch = pyodide.globals.get('run_batch')
    const progress = (done: number, total: number) =>
      ctx.postMessage({ id, type: 'progress', done, total })
    try {
      const rowsJson: string = runBatch(endpoint, queriesJson, fieldsJson, progress)
      ctx.postMessage({ id, type: 'result', rowsJson })
    } finally {
      runBatch.destroy?.()
    }
  } catch (err) {
    pyodidePromise = null // permitir reintento si falló la init
    ctx.postMessage({ id, type: 'error', message: (err as Error).message })
  }
}
