import { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = { lat: 19.0760, lng: 72.8777 }
const LEAFLET_VERSION = '1.9.4'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

let leafletLoaderPromise = null
let lastGeocodeRequestAt = 0

function validPoint(latitude, longitude) {
  return Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number(longitude) >= -180 && Number(longitude) <= 180
}

function waitForNominatimRateLimit() {
  const wait = Math.max(0, 1050 - (Date.now() - lastGeocodeRequestAt))
  return new Promise(resolve => setTimeout(resolve, wait))
}

async function nominatim(path, params) {
  await waitForNominatimRateLimit()
  lastGeocodeRequestAt = Date.now()

  const query = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    ...params,
  })

  const response = await fetch(NOMINATIM_BASE + path + '?' + query.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw new Error('Location service is temporarily unavailable.')
  return response.json()
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

export default function LocationPicker({
  value = '',
  latitude = null,
  longitude = null,
  onChange,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    let clickHandler = null
    let dragHandler = null

    async function init() {
      try {
        const L = await loadLeaflet()
        if (cancelled || !mapRef.current) return

        const initial = validPoint(latitude, longitude)
          ? { lat: Number(latitude), lng: Number(longitude) }
          : DEFAULT_CENTER

        const map = L.map(mapRef.current, {
          center: [initial.lat, initial.lng],
          zoom: validPoint(latitude, longitude) ? 16 : 11,
          zoomControl: true,
          attributionControl: true,
        })

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map)

        const marker = L.marker([initial.lat, initial.lng], {
          draggable: true,
          autoPan: true,
        }).addTo(map)

        if (!validPoint(latitude, longitude)) {
          marker.setOpacity(0)
        }

        mapInstanceRef.current = map
        markerRef.current = marker

        async function selectPoint(point, fallbackAddress = '') {
          if (!validPoint(point.lat, point.lng)) return

          marker.setLatLng([point.lat, point.lng]).setOpacity(1)
          map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16))

          setBusy(true)
          setError('')

          try {
            const result = await nominatim('/reverse', {
              lat: String(point.lat),
              lon: String(point.lng),
              zoom: '18',
            })
            onChangeRef.current?.({
              address: result.display_name || fallbackAddress || value,
              latitude: point.lat,
              longitude: point.lng,
            })
          } catch (requestError) {
            onChangeRef.current?.({
              address: fallbackAddress || value || 'Selected map location',
              latitude: point.lat,
              longitude: point.lng,
            })
            setError(requestError.message || 'We could not read the selected address.')
          } finally {
            setBusy(false)
          }
        }

        clickHandler = event => {
          selectPoint({ lat: event.latlng.lat, lng: event.latlng.lng })
        }

        dragHandler = event => {
          const point = event.target.getLatLng()
          selectPoint({ lat: point.lat, lng: point.lng })
        }

        map.on('click', clickHandler)
        marker.on('dragend', dragHandler)
        setReady(true)
        setTimeout(() => map.invalidateSize(), 0)
      } catch (initError) {
        if (!cancelled) setError(initError?.message || 'The map could not be loaded.')
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        if (clickHandler) mapInstanceRef.current.off('click', clickHandler)
        mapInstanceRef.current.remove()
      }
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !validPoint(latitude, longitude) || !mapInstanceRef.current || !markerRef.current) return
    const point = [Number(latitude), Number(longitude)]
    markerRef.current.setLatLng(point).setOpacity(1)
    mapInstanceRef.current.panTo(point)
  }, [ready, latitude, longitude])

  async function searchLocation(event) {
    event.preventDefault()
    const query = search.trim()

    if (!query) {
      setResults([])
      setError('Enter an address or area to search.')
      return
    }

    setBusy(true)
    setError('')
    setResults([])

    try {
      const data = await nominatim('/search', {
        q: query,
        countrycodes: 'in',
        limit: '5',
      })

      if (!Array.isArray(data) || data.length === 0) {
        setError('No matching location found. Try a more specific address.')
        return
      }

      setResults(data)
    } catch (requestError) {
      setError(requestError.message || 'We could not search that location.')
    } finally {
      setBusy(false)
    }
  }

  async function chooseSearchResult(result) {
    const point = { lat: Number(result.lat), lng: Number(result.lon) }
    if (!validPoint(point.lat, point.lng)) return

    const map = mapInstanceRef.current
    const marker = markerRef.current

    if (map) {
      map.setView([point.lat, point.lng], 17)
    }
    if (marker) {
      marker.setLatLng([point.lat, point.lng]).setOpacity(1)
    }

    onChangeRef.current?.({
      address: result.display_name || '',
      latitude: point.lat,
      longitude: point.lng,
    })

    setSearch(result.display_name || search)
    setResults([])
    setError('')
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access. Search for your address instead.')
      return
    }

    setError('')
    setBusy(true)

    navigator.geolocation.getCurrentPosition(
      async position => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        if (!validPoint(point.lat, point.lng)) {
          setBusy(false)
          setError('Your device returned an invalid location.')
          return
        }

        const map = mapInstanceRef.current
        const marker = markerRef.current

        if (map) map.setView([point.lat, point.lng], 17)
        if (marker) marker.setLatLng([point.lat, point.lng]).setOpacity(1)

        try {
          const result = await nominatim('/reverse', {
            lat: String(point.lat),
            lon: String(point.lng),
            zoom: '18',
          })

          onChangeRef.current?.({
            address: result.display_name || 'Current device location',
            latitude: point.lat,
            longitude: point.lng,
          })
          setSearch(result.display_name || '')
        } catch {
          onChangeRef.current?.({
            address: 'Current device location',
            latitude: point.lat,
            longitude: point.lng,
          })
          setSearch('Current device location')
        } finally {
          setBusy(false)
        }
      },
      locationError => {
        setBusy(false)
        const message = locationError.code === 1
          ? 'Location permission was denied. Search for your address instead.'
          : 'We could not get your current location. Search for your address instead.'
        setError(message)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  return (
    <div className="booking-location-picker">
      <div className="booking-location-picker-head">
        <div>
          <span className="booking-field-label">Where should we come?</span>
          <p>Alfiya comes to the location you choose for the appointment.</p>
        </div>
        <button type="button" className="booking-current-location" onClick={useCurrentLocation} disabled={!ready || busy}>
          {busy ? 'Locating…' : 'Use my current location'}
        </button>
      </div>

      <form className="booking-location-search" onSubmit={searchLocation}>
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search your home or appointment address"
          aria-label="Search appointment location"
        />
        <button type="submit" disabled={!ready || busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="booking-location-results" role="listbox" aria-label="Location search results">
          {results.map(result => (
            <button
              key={result.place_id || `${result.lat}-${result.lon}`}
              type="button"
              className="booking-location-result"
              onClick={() => chooseSearchResult(result)}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="booking-map-wrap">
        <div className="booking-map" ref={mapRef} aria-label="Select appointment location on OpenStreetMap" />
        <div className="booking-map-hint">Search an address, use your current location, or tap/drag the pin to set the exact place.</div>
      </div>

      <div className="booking-location-value">
        <small>Appointment address</small>
        <strong>{value || 'Choose a location on the map'}</strong>
        {validPoint(latitude, longitude) && (
          <span>Location pin saved · {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</span>
        )}
      </div>

      {error && <p className="booking-location-error" role="alert">{error}</p>}

      <p className="booking-location-attribution">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.
      </p>
    </div>
  )
}
