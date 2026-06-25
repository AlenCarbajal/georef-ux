import { useMemo, useState } from 'react'
import { buildUrl } from '../api/georef'
import { FIELDS_BY_RESOURCE } from '../api/fields'
import type { FieldDef } from '../api/fields'
import { RESOURCES } from '../api/types'
import type { GeorefResource, QueryParams } from '../api/types'

interface Props {
  loading: boolean
  onSubmit: (resource: GeorefResource, params: QueryParams) => void
}

/** Renderiza un campo según su `control`, con su texto de ayuda. */
function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}) {
  const control = field.control ?? 'text'

  if (control === 'checkbox') {
    return (
      <div className="form-group field">
        <label className="field-check">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : '')}
          />
          <span>{field.label}</span>
        </label>
        <p className="field-help">{field.help}</p>
      </div>
    )
  }

  return (
    <div className="form-group field">
      <label htmlFor={field.name}>{field.label}</label>
      {control === 'select' ? (
        <select
          id={field.name}
          className="form-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          className="form-control"
          type={control}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <p className="field-help">{field.help}</p>
    </div>
  )
}

export function RequestBuilder({ loading, onSubmit }: Props) {
  const [resource, setResource] = useState<GeorefResource>('provincias')
  const [values, setValues] = useState<QueryParams>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const form = FIELDS_BY_RESOURCE[resource]
  const url = useMemo(() => buildUrl(resource, values), [resource, values])

  function changeResource(next: GeorefResource) {
    setResource(next)
    setValues({}) // los params dependen del recurso
    setShowAdvanced(false)
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
              {FIELDS_BY_RESOURCE[r].label}
            </option>
          ))}
        </select>
        <p className="field-help">{form.description}</p>
      </div>

      {form.base.map((f) => (
        <Field
          key={f.name}
          field={f}
          value={values[f.name] ?? ''}
          onChange={(v) => setField(f.name, v)}
        />
      ))}

      {form.advanced.length > 0 && (
        <div className="advanced">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced((s) => !s)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? '▾' : '▸'} Opciones avanzadas
          </button>
          {showAdvanced && (
            <div className="advanced-body">
              {form.advanced.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={values[f.name] ?? ''}
                  onChange={(v) => setField(f.name, v)}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
