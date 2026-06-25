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
  parámetros por recurso (`fields.ts`). Única fuente de verdad de red.
- `src/components/` — `RequestBuilder` (formulario + URL generada), `ResultsPanel`
  (tabla / JSON) y `MapView` (Leaflet + Argenmap).
- `src/hooks/useGeorefQuery.ts` — estado loading/error/data de las consultas.

## Estado

**Fase 1 (MVP) — implementada:** explorador de requests con resultados (tabla / JSON)
y visualización en mapa para los recursos de la API (provincias, departamentos,
municipios, localidades, calles, direcciones, ubicación, etc.).

**Fase 2 — pendiente:** carga de CSV para georreferenciar en lote y normalización
de direcciones en lote (vía POST batch de Georef), reutilizando el cliente de `src/api/`.
