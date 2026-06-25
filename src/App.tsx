import { RequestBuilder } from './components/RequestBuilder'
import { ResultsPanel } from './components/ResultsPanel'
import { MapView } from './components/MapView'
import { useGeorefQuery } from './hooks/useGeorefQuery'
import './styles.css'

export default function App() {
  const query = useGeorefQuery()

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>georef-ux</h1>
          <p className="app-subtitle">
            Explorador de la{' '}
            <a
              href="https://www.argentina.gob.ar/georef"
              target="_blank"
              rel="noreferrer"
            >
              API Georef v2
            </a>{' '}
            del Estado argentino
          </p>
        </div>
      </header>

      <main className="container app-main">
        <section className="panel panel-builder">
          <h2 className="panel-title">Consulta</h2>
          <RequestBuilder loading={query.loading} onSubmit={query.run} />
        </section>

        <section className="panel panel-map">
          <h2 className="panel-title">Mapa</h2>
          <MapView entities={query.entities} />
        </section>

        <section className="panel panel-results">
          <h2 className="panel-title">Resultados</h2>
          <ResultsPanel
            loading={query.loading}
            error={query.error}
            response={query.response}
            entities={query.entities}
          />
        </section>
      </main>

      <footer className="app-footer">
        <div className="container">
          <small>
            Datos: API Georef (Datos Argentina). Sitio estático sin backend.
          </small>
        </div>
      </footer>
    </div>
  )
}
