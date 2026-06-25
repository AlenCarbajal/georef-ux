# georef-ux

Aplicación web para usar la **API Georef** (Servicio de Normalización de Datos
Geográficos del Estado argentino) desde el navegador, sin escribir código. Combina
un explorador de la API, una vista de mapa y un procesador de archivos CSV en lote.

🔗 **https://alencarbajal.github.io/georef-ux/**

## Funcionalidades

### Explorador de la API

- Constructor de consultas por recurso (provincias, departamentos, municipios,
  gobiernos locales, localidades, asentamientos, calles, direcciones y unidades
  censales), con los parámetros válidos de cada uno y ayuda por campo.
- Parámetros separados en básicos y avanzados. La selección de campos (`campos`)
  es un multiselect cuyas opciones se descubren desde la propia API.
- Resultados en tabla o JSON, con la URL de la consulta generada en vivo.
- Snippets equivalentes en cURL, Python (`pygeorefar`), R (`georefar`) y
  JavaScript, listos para copiar.
- Descarga de las bases completas publicadas, en CSV, JSON, GeoJSON o NDJSON.

### Mapa

- Los resultados con coordenadas se renderizan como marcadores, con popup de
  detalle (unidades territoriales, id, coordenadas).
- Georreferenciación inversa al hacer click sobre el mapa.
- Dibujo de los límites (polígonos) de provincias, departamentos y municipios,
  obtenidos del geoservicio WFS del IGN.

### Carga en lote (CSV)

- Tres operaciones: normalizar direcciones, georreferenciación inversa
  (lat/lon → unidades) y normalizar nombres de unidades territoriales.
- Mapeo columna → campo configurable: cada campo de la consulta se asigna a una
  columna del CSV o a un valor fijo.
- Procesamiento por lotes contra el endpoint POST de la API. La salida es el CSV
  original más columnas `georef_*`, descargable.

## Cómo funciona

Sitio estático, sin backend: el navegador consulta directamente la API pública de
Georef (CORS habilitado). Como esa API devuelve el centroide de cada entidad pero
no su geometría, los límites del mapa se traen del WFS del IGN. Hecho con React y
Vite.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # genera dist/
```

## Despliegue

Automatizado en GitHub Pages: cada push a `main` dispara el workflow
`.github/workflows/deploy.yml`, que compila y publica `dist/`.

## Documentación

- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — fuentes de datos, geoservicio de
  límites del IGN y por qué radios/fracciones censales no tienen polígono.
- [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) — guía de diseño de la interfaz.
