# georef-ux

UX sencilla para explorar la [API Georef V2](https://www.argentina.gob.ar/georef) del Estado argentino:
armar requests y ver resultados, visualizar en mapa, y cargar una base (CSV) para georreferenciarla o
normalizar direcciones en lote.

Sitio estático (sin backend) — la API permite llamadas directas desde el navegador (CORS abierto).

## Stack

- React 19 + Vite + TypeScript
- Estética [Poncho](https://github.com/argob/poncho) (Datos Argentina)
- Leaflet + basemap IGN Argenmap
- PapaParse (CSV)

## Uso

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

## Estructura

- `src/api/` — cliente tipado de Georef (`georef.ts`, `types.ts`) y metadatos de
  parámetros por recurso (`fields.ts`). Única fuente de verdad de red; incluye
  `fetchGeoref` (GET) y `fetchGeorefBatch` (POST batch).
- `src/batch/geocode.ts` — parseo de CSV (PapaParse), troceado en lotes de 1000,
  mapeo fila → consulta, extracción de campos y exportación del CSV enriquecido.
- `src/components/` — `RequestBuilder` (formulario + URL generada), `ResultsPanel`
  (tabla / JSON), `MapView` (Leaflet + Argenmap) y `BatchGeocoder` (carga en lote).
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

## Estado

**Fase 1 (MVP) y Fase 2 — implementadas.** Próximos pasos posibles: descarga en
otros formatos (GeoJSON), columnas `georef_*` configurables, y manejo de
múltiples coincidencias por dirección.
