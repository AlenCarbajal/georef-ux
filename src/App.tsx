import { useState } from 'react'
import { RequestBuilder } from './components/RequestBuilder'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './components/MapView'
import { BatchGeocoder } from './components/BatchGeocoder'
import { useGeorefQuery } from './hooks/useGeorefQuery'
import './styles.css'

type View = 'explorer' | 'batch'

export default function App() {
  const query = useGeorefQuery()
  const [view, setView] = useState<View>('explorer')

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div>
            <div className="glyphs" aria-hidden="true">
              <span className="glyph glyph--white">/</span>
              <span className="glyph glyph--lilac">ũ</span>
              <span className="glyph glyph--ink">+</span>
              <span className="glyph glyph--ghost">∞</span>
              <span className="glyph glyph--lilac">÷</span>
            </div>
            <p className="eyebrow">Dirección de Datos Abiertos</p>
            <h1>georef-ux</h1>
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
            <MapView entities={query.entities} />
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
                  Georreferenciá o normalizá una base entera de direcciones
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
