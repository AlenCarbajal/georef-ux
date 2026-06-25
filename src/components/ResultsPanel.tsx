import { useMemo, useState } from 'react'
import type { GeorefEntity, GeorefResponse } from '../api/types'

interface Props {
  loading: boolean
  error: string | null
  response: GeorefResponse | null
  entities: GeorefEntity[]
}

/** Aplana un valor de celda a texto legible. */
function cell(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('nombre' in obj) return String(obj.nombre)
    if ('lat' in obj && 'lon' in obj) return `${obj.lat}, ${obj.lon}`
    return JSON.stringify(value)
  }
  return String(value)
}

// Columnas preferidas, en orden; el resto se ignora para mantener la tabla legible.
const PREFERRED = [
  'id',
  'nombre',
  'nomenclatura',
  'provincia',
  'departamento',
  'municipio',
  'gobierno_local',
  'localidad_censal',
  'categoria',
  'centroide',
  'ubicacion',
  'lat',
  'lon',
]

export function ResultsPanel({ loading, error, response, entities }: Props) {
  const [showJson, setShowJson] = useState(false)

  const columns = useMemo(() => {
    if (entities.length === 0) return []
    const present = new Set<string>()
    for (const e of entities) for (const k of Object.keys(e)) present.add(k)
    return PREFERRED.filter((c) => present.has(c))
  }, [entities])

  if (loading) return <p className="results-status">Consultando la API…</p>
  if (error)
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  if (!response) return <p className="results-status text-muted">Realizá una consulta para ver resultados.</p>
  if (entities.length === 0)
    return <p className="results-status text-muted">Sin resultados.</p>

  return (
    <div className="results-panel">
      <div className="results-meta">
        <span>
          {response.cantidad ?? entities.length} de {response.total ?? entities.length} resultado(s)
        </span>
        <button
          type="button"
          className="btn btn-sm btn-default"
          onClick={() => setShowJson((v) => !v)}
        >
          {showJson ? 'Ver tabla' : 'Ver JSON'}
        </button>
      </div>

      {showJson ? (
        <pre className="results-json">{JSON.stringify(response, null, 2)}</pre>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-condensed">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e, i) => (
                <tr key={(e.id as string) ?? i}>
                  {columns.map((c) => (
                    <td key={c}>{cell(e[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
