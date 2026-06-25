import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Coord, GeorefEntity } from '../api/types'

// Vite no resuelve las imágenes por defecto de Leaflet; las seteamos a mano.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Centro aproximado de Argentina (vista inicial).
const ARGENTINA_CENTER: L.LatLngExpression = [-38.4, -63.6]

function coordOf(e: GeorefEntity): Coord | null {
  // `ubicacion` (georref inversa) trae lat/lon en el nivel superior;
  // direcciones bajo `ubicacion`; el resto bajo `centroide`.
  const c =
    e.ubicacion ??
    e.centroide ??
    (typeof e.lat === 'number' && typeof e.lon === 'number'
      ? { lat: e.lat, lon: e.lon }
      : undefined)
  if (c && typeof c.lat === 'number' && typeof c.lon === 'number') return c
  return null
}

interface Props {
  entities: GeorefEntity[]
}

export function MapView({ entities }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  // Inicialización del mapa (una vez).
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current).setView(ARGENTINA_CENTER, 4)

    // Basemap IGN Argenmap (capa base oficial de Argentina).
    L.tileLayer(
      'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG:3857@png/{z}/{x}/{-y}.png',
      {
        attribution:
          'Instituto Geográfico Nacional (IGN) · capa Argenmap',
        maxZoom: 18,
        tms: true,
      },
    ).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Actualización de marcadores cuando cambian los resultados.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const points: L.LatLngExpression[] = []

    for (const e of entities) {
      const c = coordOf(e)
      if (!c) continue
      const latlng: L.LatLngExpression = [c.lat, c.lon]
      points.push(latlng)
      const label = (e.nombre as string) ?? (e.nomenclatura as string) ?? 'Resultado'
      L.marker(latlng, { icon: defaultIcon }).bindPopup(label).addTo(layer)
    }

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 13 })
    }
  }, [entities])

  return <div ref={containerRef} className="map-view" />
}
