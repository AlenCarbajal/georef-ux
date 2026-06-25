import { useEffect, useMemo, useState } from 'react'
import { useBatchGeocode } from '../hooks/useBatchGeocode'
import { downloadCsv } from '../batch/geocode'

const PREVIEW_ROWS = 20

export function BatchGeocoder() {
  const batch = useBatchGeocode()
  const [direccionCol, setDireccionCol] = useState('')
  const [provinciaCol, setProvinciaCol] = useState('')
  const [provinciaFija, setProvinciaFija] = useState('')

  const fields = batch.data?.fields ?? []

  // Al cargar un CSV, intentar autoseleccionar la columna de dirección.
  useEffect(() => {
    if (fields.length === 0) {
      setDireccionCol('')
      return
    }
    const guess =
      fields.find((f) => /direc|domic|calle/i.test(f)) ?? fields[0]
    setDireccionCol(guess)
    setProvinciaCol(fields.find((f) => /prov/i.test(f)) ?? '')
  }, [fields])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) batch.loadFile(file)
  }

  function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!direccionCol) return
    batch.run({
      direccion: direccionCol,
      provincia: provinciaCol || undefined,
      provinciaFija: provinciaCol ? undefined : provinciaFija || undefined,
    })
  }

  const resultColumns = useMemo(() => {
    const rows = batch.result?.rows
    if (!rows || rows.length === 0) return []
    return Object.keys(rows[0])
  }, [batch.result])

  const running = batch.status === 'running'
  const pct =
    batch.progress && batch.progress.total > 0
      ? Math.round((batch.progress.done / batch.progress.total) * 100)
      : 0

  return (
    <div className="batch">
      <p className="text-muted">
        Subí un CSV con una columna de direcciones. La app las normaliza y
        georreferencia con el recurso <code>direcciones</code> de la API (en
        lotes) y te devuelve el mismo CSV con columnas <code>georef_*</code>
        (lat, lon, nomenclatura, provincia, departamento, etc.).
      </p>

      <div className="form-group">
        <label htmlFor="csv">Archivo CSV</label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          className="form-control"
          onChange={handleFile}
        />
      </div>

      {batch.status === 'parsing' && <p>Leyendo CSV…</p>}

      {batch.error && (
        <div className="alert alert-danger" role="alert">
          {batch.error}
        </div>
      )}

      {batch.data && (
        <form onSubmit={handleRun} className="batch-config">
          <p className="text-muted">
            {batch.data.rows.length} fila(s) · {fields.length} columna(s)
          </p>

          <div className="form-group">
            <label htmlFor="dir-col">Columna de dirección</label>
            <select
              id="dir-col"
              className="form-control"
              value={direccionCol}
              onChange={(e) => setDireccionCol(e.target.value)}
            >
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="prov-col">Columna de provincia (opcional)</label>
            <select
              id="prov-col"
              className="form-control"
              value={provinciaCol}
              onChange={(e) => setProvinciaCol(e.target.value)}
            >
              <option value="">— ninguna —</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {!provinciaCol && (
            <div className="form-group">
              <label htmlFor="prov-fija">Provincia fija (opcional)</label>
              <input
                id="prov-fija"
                className="form-control"
                placeholder="Ej. Córdoba — aplica a todas las filas"
                value={provinciaFija}
                onChange={(e) => setProvinciaFija(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={running || !direccionCol}>
            {running ? 'Procesando…' : 'Georreferenciar'}
          </button>
        </form>
      )}

      {running && batch.progress && (
        <div className="batch-progress">
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${pct}%` }}
            >
              {pct}%
            </div>
          </div>
          <small>
            {batch.progress.done} / {batch.progress.total} direcciones enviadas
          </small>
        </div>
      )}

      {batch.status === 'done' && batch.result && (
        <div className="batch-result">
          <div className="batch-result__meta">
            <span>
              {batch.result.matched} de {batch.result.sent} con coincidencia
              {batch.result.sent < batch.result.rows.length &&
                ` · ${batch.result.rows.length - batch.result.sent} fila(s) sin dirección`}
            </span>
            <button
              type="button"
              className="btn btn-success"
              onClick={() =>
                downloadCsv(batch.result!.rows, geocodedName(batch.fileName))
              }
            >
              Descargar CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-condensed">
              <thead>
                <tr>
                  {resultColumns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batch.result.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                  <tr key={i}>
                    {resultColumns.map((c) => (
                      <td key={c}>{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {batch.result.rows.length > PREVIEW_ROWS && (
            <small className="text-muted">
              Mostrando {PREVIEW_ROWS} de {batch.result.rows.length} filas. Descargá
              el CSV para ver todo.
            </small>
          )}
        </div>
      )}
    </div>
  )
}

function geocodedName(fileName: string | null): string {
  if (!fileName) return 'georef.csv'
  return fileName.replace(/\.csv$/i, '') + '_georef.csv'
}
