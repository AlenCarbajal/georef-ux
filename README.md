# georef-ux

Una página para usar **Georef** —el servicio del Estado argentino que ordena y
ubica datos geográficos— sin tener que escribir código ni leer documentación de API.

La idea es simple: si querés averiguar en qué provincia cae una coordenada,
normalizar un listado de direcciones escritas a mano, o ver los departamentos de
una provincia en un mapa, entrás, lo armás con un formulario y lo ves al instante.

## Qué se puede hacer

**Explorar.** Elegís qué querés consultar (provincias, departamentos, municipios,
localidades, calles, direcciones…), completás un formulario con ayuda en cada
campo, y ves el resultado en una tabla o como JSON. Abajo te mostramos la consulta
ya escrita en cURL, Python, R o JavaScript, lista para copiar y pegar en tu propio
código.

**Verlo en el mapa.** Todo lo que tiene coordenadas aparece en un mapa de
Argentina. Si tocás un punto, te muestra qué es y a qué provincia, departamento o
municipio pertenece. Para provincias, departamentos y municipios podés además
dibujar el **contorno** (los límites), no solo el punto.

**Procesar una base entera.** Subís un CSV y elegís qué hacer con él: normalizar
una columna de direcciones, georreferenciar coordenadas, o emprolijar nombres de
unidades territoriales. Le decís qué columna es cada cosa y la página procesa todas
las filas y te devuelve el mismo archivo con columnas nuevas (`georef_*`) que podés
descargar.

También podés bajarte las **bases completas** publicadas (todo el país) en CSV,
JSON, GeoJSON o NDJSON, directo desde el botón de descarga.

Todo pasa en el navegador: no hay servidor propio, la página le habla directo a la
API pública de Georef.

## Sobre los límites en el mapa

La API de Georef devuelve el centro de cada lugar, pero no su contorno. Para dibujar
los límites usamos el geoservicio de mapas del **IGN** (Instituto Geográfico
Nacional). Hoy andan **provincias, departamentos y municipios**. Los radios y
fracciones censales no tienen contorno disponible en ningún servicio abierto, así
que para esos se muestra el punto. El detalle completo de qué dato sale de dónde
está en [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Correrlo

```bash
npm install
npm run dev       # arranca en http://localhost:5173
npm run build     # deja el sitio listo en dist/
```

Es una app de React que se publica como sitio estático (no necesita base de datos
ni backend). El despliegue a GitHub Pages está automatizado: cada cambio en `main`
republica el sitio.

## Más documentación

- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — de dónde sale cada dato y por qué
  algunos límites no están disponibles.
- [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) — la guía de diseño visual.
