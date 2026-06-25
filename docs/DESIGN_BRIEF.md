# Brief de diseño — georef-ux

Documento de handoff para el diseño de UI. La **funcionalidad ya está implementada
y andando**; lo que se pide es vestir la interfaz respetando la estética de Datos
Argentina (gob.ar / Poncho) y hacerla **muy amigable para usuarios poco o nada
técnicos**. No hace falta cambiar la lógica: el diseño puede tomar los componentes
y estados existentes y rediseñarlos visualmente.

## 1. Qué es

UX sencilla para **explorar la API Georef v2.1** del Estado argentino (normalización
y georreferenciación de datos geográficos). Sitio estático en React, sin backend:
el navegador llama directo a `https://apis.datos.gob.ar/georef/api/v2.1`.

Tres capacidades:
1. **Explorar la API** — armar una consulta con un formulario guiado y ver el resultado.
2. **Ver en mapa** — los resultados con coordenadas se grafican en un mapa de Argentina.
3. **Georreferenciar / normalizar una base** — subir un CSV y procesarlo en lote (Fase 2).

## 2. Público objetivo

Personas de organismos públicos y ciudadanía **sin conocimientos técnicos**. La
prioridad es claridad: lenguaje cotidiano, ayudas contextuales, nada de jerga de API
expuesta sin explicación. El que sabe programar igual encuentra la URL y los snippets.

## 3. Estructura de pantalla (layout actual)

```
┌─ Header (banda celeste gob.ar): título + bajada con link a la API ──────────────┐
├─ Main (grilla) ────────────────────────────────────────────────────────────────┤
│  ┌─ Panel "Consulta" ───────────────┐   ┌─ Panel "Mapa" ─────────────────────┐  │
│  │ Solapas de categoría             │   │ Mapa Leaflet (basemap IGN          │  │
│  │ Intro de la categoría            │   │ Argenmap) con marcadores + popups  │  │
│  │ [Selector de recurso]            │   └────────────────────────────────────┘  │
│  │ Campos base                      │                                            │
│  │ ▸ Opciones avanzadas             │                                            │
│  │ URL generada + Copiar            │                                            │
│  │ [ Consultar ]                    │                                            │
│  │ ▸ Código para reutilizar         │                                            │
│  └──────────────────────────────────┘                                           │
│  ┌─ Panel "Resultados" (ancho completo) ───────────────────────────────────────┐ │
│  │ Meta (N de M) + toggle Tabla/JSON · Tabla de resultados o JSON crudo         │ │
│  └──────────────────────────────────────────────────────────────────────────────┘│
├─ Footer: crédito de datos ──────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────────────┘
```
En mobile (≤768px) las tres zonas se apilan: consulta → mapa → resultados.

## 4. Componentes y estados a diseñar

| Componente | Archivo | Estados / variantes |
|---|---|---|
| **Solapas de categoría** | `RequestBuilder.tsx` | 4 solapas: *Territorio · Calles y direcciones · Datos censales · Georreferenciación inversa*. Activa / inactiva / hover. |
| **Formulario de consulta** | `RequestBuilder.tsx` + `fields.ts` | Campos base siempre visibles; sección **avanzada colapsable**; controles: texto, número, **checkbox** (flags), **select** (orden). Cada campo con **texto de ayuda**. |
| **URL generada** | `RequestBuilder.tsx` | Una línea con la URL + botón Copiar. |
| **Snippets de código** | `RequestBuilder.tsx` + `snippets.ts` | Bloque colapsable con pestañas **cURL / Python / R / JavaScript** + botón Copiar (estado "¡Copiado!"). |
| **Resultados** | `ResultsPanel.tsx` | Estados: *inicial* (sin consulta), *cargando*, *error* (alert), *sin resultados*, *con datos* (tabla) y *JSON crudo* (toggle). |
| **Mapa** | `MapView.tsx` | Vista inicial de Argentina; marcadores con popup; auto-zoom a los resultados. |
| **Carga de base (CSV)** | `BatchGeocoder.tsx` (Fase 2) | Subida de archivo, mapeo de columnas, progreso por lotes, descarga del resultado. |

## 5. Sistema de diseño (estética Datos Argentina / Poncho)

- **Base CSS:** [Poncho](https://github.com/argob/poncho) (design system gob.ar) ya
  enlazado en `index.html`. Los componentes deberían apoyarse en sus tokens.
- **Color institucional:** celeste gob.ar `#37bbed` (hoy se usa en header, solapa
  activa y acentos). Grises neutros para texto/bordes; fondo blanco en paneles.
- **Tipografía:** la del sistema gob.ar (Poncho). Jerarquía clara: H1 header, H2
  títulos de panel, ayudas en tamaño chico y color tenue.
- **Tono visual:** institucional, sobrio, accesible (contraste AA), mucho aire,
  bordes suaves. Pensar affordances claras para no técnicos (labels grandes,
  ayudas siempre visibles, estados de carga/errores explícitos y amables).

## 6. Flujos clave para mostrar en el diseño

1. **Consulta simple:** solapa *Territorio* → *Provincias* → Consultar → tabla con 24 filas.
2. **Normalizar dirección:** *Calles y direcciones* → *Direcciones* → "Av. Rivadavia 1234"
   → resultado normalizado + punto en el mapa.
3. **Georref. inversa:** *Georreferenciación inversa* → lat `-34.6` / lon `-58.4` →
   provincia/departamento + marcador en el mapa.
4. **Reutilizar:** abrir "Código para reutilizar" y copiar el snippet de Python/R.

## 7. Referencias

- Estética Datos Argentina: design system **Poncho** (`argob/poncho`).
- API: <https://www.argentina.gob.ar/georef> · ref. v2: referencia-completa-de-la-api-georef-v-2
- Librerías cliente (para los snippets): `datosgobar/georefar` (R), `pygeorefar` (Python).

## 8. Qué NO tocar

La lógica de red (`src/api/`), el hook de estado (`src/hooks/`) y la metadata de
campos/categorías (`fields.ts`) ya funcionan. El diseño actúa sobre `components/` y
`styles.css` (o el reemplazo de estilos que se proponga). Mantener los nombres de
categorías y recursos salvo indicación contraria — están en validación.
