import { useMemo, useState } from 'react'
import { buildUrl } from '../api/georef'
import { FIELDS_BY_RESOURCE } from '../api/fields'
import { RESOURCES } from '../api/types'
import type { GeorefResource, QueryParams } from '../api/types'

interface Props {
  loading: boolean
  onSubmit: (resource: GeorefResource, params: QueryParams) => void
}

export function RequestBuilder({ loading, onSubmit }: Props) {
  const [resource, setResource] = useState<GeorefResource>('provincias')
  const [values, setValues] = useState<QueryParams>({})

  const fields = FIELDS_BY_RESOURCE[resource]
  const url = useMemo(() => buildUrl(resource, values), [resource, values])

  function changeResource(next: GeorefResource) {
    setResource(next)
    setValues({}) // los params dependen del recurso
  }

  function setField(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(resource, values)
  }

  return (
    <form className="request-builder" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="resource">Recurso</label>
        <select
          id="resource"
          className="form-control"
          value={resource}
          onChange={(e) => changeResource(e.target.value as GeorefResource)}
        >
          {RESOURCES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {fields.map((f) => (
        <div className="form-group" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            className="form-control"
            type={f.type ?? 'text'}
            placeholder={f.placeholder}
            value={values[f.name] ?? ''}
            onChange={(e) => setField(f.name, e.target.value)}
          />
        </div>
      ))}

      <div className="generated-url">
        <span className="generated-url__label">URL</span>
        <code title={url}>{url}</code>
        <button
          type="button"
          className="btn btn-sm btn-default"
          onClick={() => navigator.clipboard?.writeText(url)}
        >
          Copiar
        </button>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Consultando…' : 'Consultar'}
      </button>
    </form>
  )
}
