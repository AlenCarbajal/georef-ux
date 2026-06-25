import { useState } from 'react'
import { RequestBuilder } from './components/RequestBuilder'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './components/MapView'
import { BatchGeocoder } from './components/BatchGeocoder'
import { useGeorefQuery } from './hooks/useGeorefQuery'
import { supportsBoundaries } from './api/boundaries'
import './styles.css'

type View = 'explorer' | 'batch'

/** Logo: pin de geolocalización en tile violeta (identidad Datos Abiertos). */
function Logo() {
  return (
    <svg
      className="brand-logo"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="georef-ux"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#e7dbf7" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect
        width="48"
        height="48"
        rx="11"
        fill="rgba(255,255,255,0.14)"
        stroke="rgba(255,255,255,0.5)"
      />
      <path
        d="M24 10.5c-5.2 0-9.4 4.1-9.4 9.2 0 6.7 9.4 17.8 9.4 17.8s9.4-11.1 9.4-17.8c0-5.1-4.2-9.2-9.4-9.2z"
        fill="url(#logoGrad)"
      />
      <circle cx="24" cy="19.6" r="3.7" fill="#5b2ea3" />
    </svg>
  )
}

export default function App() {
  const query = useGeorefQuery()
  const [view, setView] = useState<View>('explorer')
  const [showBoundaries, setShowBoundaries] = useState(false)
  const canDrawBoundaries = supportsBoundaries(query.resource)

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div>
            <div className="header-brand">
              <Logo />
              <div>
                <p className="eyebrow">Dirección de Datos Abiertos</p>
                <h1>georef-ux</h1>
              </div>
            </div>
            <p className="app-subtitle">
              Explorá y normalizá datos geográficos del Estado argentino con la{' '}
              <a
                href="https://www.argentina.gob.ar/georef"
                target="_blank"
                rel="noreferrer"
              >
                API Georef v2
              </a>
              , sin escribir código.
            </p>
            <nav className="app-tabs">
              <button
                type="button"
                className={view === 'explorer' ? 'is-active' : ''}
                onClick={() => setView('explorer')}
              >
                Explorador
              </button>
              <button
                type="button"
                className={view === 'batch' ? 'is-active' : ''}
                onClick={() => setView('batch')}
              >
                Carga en lote (CSV)
              </button>
            </nav>
          </div>
          <div className="header-meta">
            <strong>Datos Argentina</strong>
            Secretaría de Innovación,
            <br />
            Ciencia y Tecnología
            <br />
            <a
              className="pill-link"
              href="https://www.argentina.gob.ar/georef"
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">↗</span> Referencia de la API
            </a>
          </div>
        </div>
      </header>

      {view === 'explorer' ? (
        <main className="container app-main">
          <section className="panel panel-builder">
            <div className="panel-head">
              <span className="dot">1</span>
              <div>
                <h2 className="panel-title">Armá tu consulta</h2>
                <p className="panel-sub">Elegí un tema y completá los campos</p>
              </div>
            </div>
            <RequestBuilder loading={query.loading} onSubmit={query.run} />
          </section>

          <section className="panel panel-map">
            <div className="panel-head">
              <span className="dot">2</span>
              <div>
                <h2 className="panel-title">Mapa</h2>
                <p className="panel-sub">
                  Los resultados con coordenadas aparecen acá
                </p>
              </div>
            </div>
            <label className="map-toggle">
              <input
                type="checkbox"
                checked={showBoundaries}
                disabled={!canDrawBoundaries}
                onChange={(e) => setShowBoundaries(e.target.checked)}
              />
              <span>
                Mostrar límites (polígonos)
                {query.resource && !canDrawBoundaries && (
                  <span className="map-toggle__note">
                    {' '}
                    — no disponibles para este recurso; se muestran los puntos
                  </span>
                )}
              </span>
            </label>
            <MapView
              entities={query.entities}
              resource={query.resource}
              showBoundaries={showBoundaries}
            />
          </section>

          <section className="panel panel-results">
            <div className="panel-head">
              <span className="dot">3</span>
              <div>
                <h2 className="panel-title">Resultados</h2>
                <p className="panel-sub">Lo que devolvió la API</p>
              </div>
            </div>
            <ResultsPanel
              loading={query.loading}
              error={query.error}
              response={query.response}
              entities={query.entities}
            />
          </section>
        </main>
      ) : (
        <main className="container app-main-single">
          <section className="panel">
            <div className="panel-head">
              <span className="dot">★</span>
              <div>
                <h2 className="panel-title">Carga en lote (CSV)</h2>
                <p className="panel-sub">
                  Normalizá o georreferenciá una base entera: direcciones,
                  coordenadas o nombres de unidades
                </p>
              </div>
            </div>
            <BatchGeocoder />
          </section>
        </main>
      )}

      <footer className="app-footer">
        <div className="container footer-inner">
          <span className="footer-credit">
            <span className="glyph-mini" aria-hidden="true">
              <span className="gm" style={{ background: 'var(--ink)' }}></span>
              <span
                className="gm"
                style={{ background: 'var(--violet-300)' }}
              ></span>
              <span
                className="gm"
                style={{ background: 'var(--violet-600)' }}
              ></span>
            </span>
            <span>
              Datos:{' '}
              <a
                href="https://datos.gob.ar/dataset/jgm-servicio-normalizacion-direcciones-unidades-territoriales-argentina"
                target="_blank"
                rel="noreferrer"
              >
                Servicio de normalización de direcciones y unidades
                territoriales de la República Argentina
              </a>
              , publicado en datos.gob.ar (Datos Argentina).
              <br />
              Contacto:{' '}
              <a href="mailto:datosargentina@sicyt.gob.ar">
                datosargentina@sicyt.gob.ar
              </a>
            </span>
          </span>
          <span>Hecho con datos abiertos · CC BY 4.0</span>
        </div>
      </footer>
    </div>
  )
}
