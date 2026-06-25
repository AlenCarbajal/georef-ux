# georef-ux

UX sencilla para explorar la [API Georef V2](https://www.argentina.gob.ar/georef) del Estado argentino:
armar requests y ver resultados, visualizar en mapa, y cargar una base (CSV) para georreferenciarla o
normalizar direcciones en lote.

Sitio estático (sin backend) — la API permite llamadas directas desde el navegador (CORS abierto).

## Stack

- React 19 + Vite + TypeScript
- Estética **Datos Abiertos** (paleta violeta/lila), CSS propio; tipografías
  Encode Sans + Roboto Mono
- Leaflet + basemap IGN Argenmap; límites (polígonos) vía geoservicio WFS del IGN
- PapaParse (CSV)

## Uso

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

## Estructura

- `src/api/` — cliente tipado de Georef (`georef.ts`, `types.ts`), metadatos de
  recursos/campos por categoría (`fields.ts`), generación de snippets de código
  (`snippets.ts`) y límites del IGN (`boundaries.ts`). Única fuente de verdad de
  red; incluye `fetchGeoref` (GET) y `fetchGeorefBatch` (POST batch).
- `src/batch/geocode.ts` — parseo de CSV (PapaParse), troceado en lotes de 1000,
  mapeo fila → consulta, extracción de campos y exportación del CSV enriquecido.
- `src/components/` — `RequestBuilder` (solapas por categoría + formulario guiado +
  URL + snippets), `ResultsPanel` (tabla / JSON), `MapView` (Leaflet + Argenmap +
  límites) y `BatchGeocoder` (carga en lote).
- `src/hooks/` — `useGeorefQuery` (consultas del explorador) y `useBatchGeocode`
  (estado y progreso de la carga en lote).

## Funciones

La app tiene dos pestañas:

- **Explorador:** armar requests a cualquier recurso de la API, ver resultados en
  tabla / JSON y visualizarlos en el mapa.
- **Carga en lote (CSV):** subir un CSV con una columna de direcciones para
  georreferenciarlas y normalizarlas en lote (recurso `direcciones`, vía POST
  batch). Devuelve el mismo CSV con columnas `georef_*` (lat, lon, nomenclatura,
  provincia, departamento, localidad censal, calle, altura) y permite descargarlo.

El explorador agrupa los recursos en solapas (**Territorio**, **Calles y
direcciones**, **Datos censales**, **Georreferenciación inversa**), cada campo
tiene ayuda contextual y la consulta se puede copiar como código (cURL, Python con
`pygeorefar`, R con `georefar`, JavaScript).

## Mapa y límites

El mapa grafica los resultados con coordenadas (marcadores con popup de detalle) y,
con el toggle **"Mostrar límites"**, dibuja los **polígonos** de la entidad para los
recursos soportados. La API Georef sólo devuelve el centroide, así que la geometría
de los límites se trae del **geoservicio WFS del IGN**: hoy se cubren **provincias,
departamentos y municipios**. Radios y fracciones censales no tienen polígono en
fuentes públicas accesibles desde el navegador (ver detalle abajo).

## Documentación

- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — fuentes de datos, geoservicio de
  límites del IGN, dumps GeoJSON de Georef y la limitación de los censales.
- [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) — brief de diseño de la UI.

## Estado

**Fase 1 (MVP) y Fase 2 — implementadas**, con rediseño Datos Abiertos y límites en
el mapa. Próximos pasos posibles: descarga en otros formatos (GeoJSON), columnas
`georef_*` configurables, manejo de múltiples coincidencias por dirección, y
límites de radios/fracciones censales a partir de la cartografía INDEC.
