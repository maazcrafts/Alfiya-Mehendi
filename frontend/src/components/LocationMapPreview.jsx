import { useEffect, useRef, useState } from 'react'

const LEAFLET_VERSION = '1.9.4'
let leafletLoaderPromise = null

function validPoint(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Number(latitude) >= -90 && Number(latitude) <= 90 && Number(longitude) >= -180 && Number(longitude) <= 180
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletLoaderPromise) return leafletLoaderPromise
  leafletLoaderPromise = new Promise((resolve, reject) => {
    const existingCss = document.querySelector('link[data-alfiya-leaflet]')
    if (!existingCss) {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`
      css.dataset.alfiyaLeaflet = 'true'
      document.head.appendChild(css)
    }
    const existingScript = document.querySelector('script[data-alfiya-leaflet]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Map library could not be loaded.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`
    script.async = true
    script.dataset.alfiyaLeaflet = 'true'
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Map library could not be loaded.'))
    document.head.appendChild(script)
  })
  return leafletLoaderPromise
}

export default function LocationMapPreview({ latitude, longitude, address = '' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!validPoint(latitude, longitude) || !mapRef.current) return
      try {
        const L = await loadLeaflet()
        if (cancelled || !mapRef.current) return
        const point = [Number(latitude), Number(longitude)]
        const map = L.map(mapRef.current, {
          center: point,
          zoom: 15,
          zoomControl: false,
          attributionControl: true,
          dragging: true,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: true,
        })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map)
        const marker = L.marker(point).addTo(map)
        if (address) marker.bindPopup(address)
        mapInstanceRef.current = map
        setTimeout(() => map.invalidateSize(), 0)
      } catch (initError) {
        if (!cancelled) setError(initError?.message || 'The map could not be loaded.')
      }
    }
    init()
    return () => {
      cancelled = true
      if (mapInstanceRef.current) mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
  }, [latitude, longitude, address])

  if (!validPoint(latitude, longitude)) {
    return <div className="admin-location-unavailable"><span>Location map unavailable</span><strong>{address || 'No location selected'}</strong></div>
  }

  return (
    <div className="admin-location-map-card">
      <div className="admin-location-map" ref={mapRef} aria-label={`Appointment location map for ${address || 'customer location'}`} />
      <div className="admin-location-map-footer">
        <div><small>Appointment location</small><strong>{address || 'Customer location'}</strong></div>
        <a href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=17/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`} target="_blank" rel="noreferrer">Open map ↗</a>
      </div>
      {error && <span className="admin-location-map-error">{error}</span>}
    </div>
  )
}
