import { useMemo, useState } from 'react'
import { buildUrl } from '../api/georef'
import { FIELDS_BY_RESOURCE, RESOURCE_GROUPS } from '../api/fields'
import type { FieldDef } from '../api/fields'
import { buildSnippets } from '../api/snippets'
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

/** Bloque colapsable con el código equivalente en varios lenguajes. */
function CodeSnippets({
  resource,
  params,
}: {
  resource: GeorefResource
  params: QueryParams
}) {
  const snippets = useMemo(
    () => buildSnippets(resource, params),
    [resource, params],
  )
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  const current = snippets[active]

  function selectTab(i: number) {
    setActive(i)
    setCopied(false)
  }

  function copy() {
    navigator.clipboard?.writeText(current.code)
    setCopied(true)
  }

  return (
    <div className="snippets">
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? '▾' : '▸'} Código para reutilizar esta consulta
      </button>

      {open && (
        <div className="snippets-body">
          <div className="snippets-tabs" role="tablist">
            {snippets.map((s, i) => (
              <button
                key={s.label}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`snippet-tab${i === active ? ' is-active' : ''}`}
                onClick={() => selectTab(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <pre className="snippet-code">{current.code}</pre>
          <button
            type="button"
            className="btn btn-sm btn-default"
            onClick={copy}
          >
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
        </div>
      )}
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
      <p className="builder-intro">
        Elegí qué querés consultar y completá los datos. No necesitás saber
        programar: armamos la consulta por vos.
      </p>

      <div className="form-group">
        <label htmlFor="resource">¿Qué querés consultar?</label>
        <select
          id="resource"
          className="form-control"
          value={resource}
          onChange={(e) => changeResource(e.target.value as GeorefResource)}
        >
          {RESOURCE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.resources.map((r) => (
                <option key={r} value={r}>
                  {FIELDS_BY_RESOURCE[r].label}
                </option>
              ))}
            </optgroup>
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

      <CodeSnippets resource={resource} params={values} />
    </form>
  )
}
