# Fuentes de datos y límites en el mapa

Verificado el 2026-06-25 contra los servicios en vivo. Este documento explica de
dónde sale cada dato del explorador y, en particular, por qué los **límites
(polígonos)** se grafican para unos recursos y para otros no.

## Resumen

- **API Georef** (`apis.datos.gob.ar/georef/api/v2.1`): normaliza y devuelve
  atributos + **centroide**. **No devuelve geometría de límites.**
- **Límites (polígonos)**: se traen del **geoservicio WFS del IGN**, que cubre
  **provincias, departamentos y municipios**.
- **Radios y fracciones censales**: **no hay polígonos en ninguna fuente pública
  accesible desde el navegador.**

## 1. La API Georef no trae geometría

- `formato=geojson` devuelve la geometría como **`Point` (el centroide)**, no el
  límite. Verificado para `provincias` y `radios-censales`.
- Los `campos` válidos son: `categoria`, `centroide.lat`, `centroide.lon`,
  `fuente`, `id`, `iso_id`, `iso_nombre`, `nombre`, `nombre_completo`.
  **No existe un campo `geometria`.**

Por eso el centroide alcanza para poner un marcador, pero no para dibujar el contorno.

## 2. Fuente de límites usada — IGN WFS

- Endpoint: `https://wms.ign.gob.ar/geoserver/ows`
- **CORS abierto** (`access-control-allow-origin: *`) → se llama directo desde el browser.
- Capas (geometría `MultiPolygon`), con el campo **`in1` = el `id` de Georef**
  (ambos son el código INDEC):

  | Recurso Georef | Capa IGN | Campo código |
  |---|---|---|
  | `provincias` | `ign:provincia` | `in1` (2 dígitos) |
  | `departamentos` | `ign:departamento` | `in1` (5 dígitos) |
  | `municipios` | `ign:municipio` | `in1` (6 dígitos) |

- Una sola consulta trae todos los límites del resultado:
  `GetFeature` + `CQL_FILTER=in1 IN ('02','06',…)` + `outputFormat=application/json`.
- Implementación: [`src/api/boundaries.ts`](../src/api/boundaries.ts). El toggle
  **"Mostrar límites"** del panel del mapa la activa; si el recurso no está en la
  tabla, el toggle se deshabilita y se muestran los centroides.
- Otras capas IGN existentes, **no integradas** (a evaluar): `ign:gobiernoslocales_2022`,
  `ign:localidad_bahra`. Antes de sumarlas hay que confirmar que su campo de código
  coincida con el `id` de Georef del recurso correspondiente.

## 3. Dumps GeoJSON de Georef (alternativa, no usada)

Georef publica descargas completas por entidad en `infra.datos.gob.ar` (con CORS),
vía el patrón `apis.datos.gob.ar/georef/api/<entidad>.<formato>` (redirige 302):

| Entidad | Geometría | Features | Tamaño |
|---|---|---|---|
| `provincias.geojson` | Polygon | 24 | 0.72 MB |
| `departamentos.geojson` | Polygon | 529 | 1.44 MB |
| `municipios.geojson` | Polygon | 2082 | 1.91 MB |
| `localidades_censales.geojson` | **Point** (centroide) | 4027 | 1.79 MB |

**Por qué no se usan:** para los tres niveles con polígono, el IGN WFS trae sólo lo
pedido (por `id`), mientras que el dump baja todo el país. El dump sería útil para
uso offline o filtrado masivo del lado cliente, pero es más pesado para el caso
interactivo. `localidades_censales` sólo trae centroide, no sirve para límites.

## 4. Radios y fracciones censales — limitación

- `radios-censales.geojson` / `.ndjson` / `.csv` → **HTTP 404**.
- `fracciones-censales.geojson` / `.ndjson` / `.csv` → **HTTP 404**.
- Tampoco están en el IGN.
- La geometría real de radios y fracciones es la **cartografía censal del INDEC**
  (shapefiles por provincia), que **no tiene API con CORS** y requeriría descargar,
  convertir a GeoJSON y empaquetar archivos grandes. Queda **fuera de alcance** del
  sitio estático actual.
- Consecuencia en la UI: para estos recursos el toggle de límites está
  deshabilitado y el mapa muestra los **centroides** (con popup de detalle).

## 5. Cómo extender los límites

1. **Sumar un nivel administrativo (vía IGN):** agregar una entrada en
   `BOUNDARY_LAYER` de [`src/api/boundaries.ts`](../src/api/boundaries.ts)
   (`recurso → { layer, codeField }`), tras verificar contra el WFS que el campo de
   código de la capa coincide con el `id` de Georef.
2. **Sumar censales (vía archivo estático):** convertir la cartografía INDEC a
   GeoJSON, servirla como asset, cargarla una vez y filtrar por `id` en el cliente.
   Sopesar el tamaño (los radios del país son decenas de miles de polígonos).
