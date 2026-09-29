import { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = { lat: 19.0760, lng: 72.8777 }
const LEAFLET_VERSION = '1.9.4'
const PHOTON_BASE = 'https://photon.komoot.io'

let leafletLoaderPromise = null

function validPoint(latitude, longitude) {
  return Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number(longitude) >= -180 && Number(longitude) <= 180
}

function formatPhotonFeature(feature) {
  const properties = feature?.properties || {}
  return [
    properties.housenumber,
    properties.street,
    properties.name,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ')
}

async function photon(pathname, params, signal) {
  const query = new URLSearchParams(params)
  const response = await fetch(PHOTON_BASE + pathname + '?' + query.toString(), {
    headers: { Accept: 'application/json' },
    signal,
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
  const requestIdRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [editing, setEditing] = useState(false)

  const locationComplete = validPoint(latitude, longitude) && Boolean(value?.trim())

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (locationComplete) {
      setSearch(value.trim())
      setEditing(false)
    }
  }, [locationComplete, value])

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

          const requestId = ++requestIdRef.current
          marker.setLatLng([point.lat, point.lng]).setOpacity(1)
          map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16))

          setBusy(true)
          setError('')

          try {
            const result = await photon('/reverse', {
              lat: String(point.lat),
              lon: String(point.lng),
              zoom: '18',
            })

            if (cancelled || requestId !== requestIdRef.current) return

            onChangeRef.current?.({
              address: formatPhotonFeature(result.features?.[0]) || fallbackAddress || value,
              latitude: point.lat,
              longitude: point.lng,
            })
          } catch (requestError) {
            if (cancelled || requestError?.name === 'AbortError' || requestId !== requestIdRef.current) return

            onChangeRef.current?.({
              address: fallbackAddress || value || 'Selected map location',
              latitude: point.lat,
              longitude: point.lng,
            })
            setError(requestError.message || 'We could not read the selected address.')
          } finally {
            if (!cancelled && requestId === requestIdRef.current) setBusy(false)
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
      requestIdRef.current += 1
      if (mapInstanceRef.current) {
        if (clickHandler) mapInstanceRef.current.off('click', clickHandler)
        if (markerRef.current && dragHandler) markerRef.current.off('dragend', dragHandler)
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

    const requestId = ++requestIdRef.current
    setBusy(true)
    setError('')
    setResults([])

    try {
      const data = await photon('/api', {
        q: query,
        limit: '5',
      })

      if (requestId !== requestIdRef.current) return

      if (!Array.isArray(data?.features) || data.features.length === 0) {
        setError('No matching location found. Try a more specific address.')
        return
      }

      setResults(data.features)
    } catch (requestError) {
      if (requestError?.name !== 'AbortError' && requestId === requestIdRef.current) {
        setError(requestError.message || 'We could not search that location.')
      }
    } finally {
      if (requestId === requestIdRef.current) setBusy(false)
    }
  }

  async function chooseSearchResult(result) {
    const point = {
      lat: Number(result.geometry?.coordinates?.[1]),
      lng: Number(result.geometry?.coordinates?.[0]),
    }
    if (!validPoint(point.lat, point.lng)) {
      setError('That search result did not include a valid map location.')
      return
    }

    const address = formatPhotonFeature(result)
    if (!address) {
      setError('That result does not contain a usable address. Try another result.')
      return
    }

    const map = mapInstanceRef.current
    const marker = markerRef.current

    if (map) map.setView([point.lat, point.lng], 17)
    if (marker) marker.setLatLng([point.lat, point.lng]).setOpacity(1)

    onChangeRef.current?.({
      address,
      latitude: point.lat,
      longitude: point.lng,
    })

    setSearch(address)
    setResults([])
    setError('')
    setEditing(false)
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access. Search for your address instead.')
      return
    }

    const requestId = ++requestIdRef.current
    setError('')
    setResults([])
    setBusy(true)

    navigator.geolocation.getCurrentPosition(
      async position => {
        if (requestId !== requestIdRef.current) return

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
          const result = await photon('/reverse', {
            lat: String(point.lat),
            lon: String(point.lng),
            zoom: '18',
          })

          if (requestId !== requestIdRef.current) return

          const address = formatPhotonFeature(result.features?.[0]) || 'Current device location'
          onChangeRef.current?.({
            address,
            latitude: point.lat,
            longitude: point.lng,
          })
          setSearch(address)
          setResults([])
          setEditing(false)
        } catch (requestError) {
          if (requestId !== requestIdRef.current || requestError?.name === 'AbortError') return

          onChangeRef.current?.({
            address: 'Current device location',
            latitude: point.lat,
            longitude: point.lng,
          })
          setSearch('Current device location')
          setResults([])
          setEditing(false)
          setError('Location found, but the address could not be read. The map pin is still saved.')
        } finally {
          if (requestId === requestIdRef.current) setBusy(false)
        }
      },
      locationError => {
        if (requestId !== requestIdRef.current) return
        setBusy(false)
        const message = locationError.code === 1
          ? 'Location permission was denied. Search for your address instead.'
          : locationError.code === 2
            ? 'Your current location is unavailable. Check device location services or search for your address.'
            : 'Location detection timed out. Try again or search for your address.'
        setError(message)
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
    )
  }

  const displayResults = results.map(result => ({
    ...result,
    address: formatPhotonFeature(result),
  }))

  return (
    <div className="booking-location-picker">
      <div className="booking-location-picker-head">
        <div>
          <span className="booking-field-label">Where should we come?</span>
          <p>Alfiya comes to the location you choose for the appointment.</p>
        </div>
        {locationComplete ? (
          <div className="booking-location-complete-badge" role="status">
            <span aria-hidden="true">✓</span>
            Location added
          </div>
        ) : (
          <button
            type="button"
            className="booking-current-location"
            onClick={useCurrentLocation}
            disabled={!ready || busy}
          >
            {busy ? 'Locating…' : 'Use my current location'}
          </button>
        )}
      </div>

      {locationComplete && !editing ? (
        <div className="booking-location-complete">
          <div className="booking-location-complete-icon" aria-hidden="true">✓</div>
          <div className="booking-location-complete-copy">
            <strong>Appointment location is set</strong>
            <span>{value}</span>
          </div>
          <button
            type="button"
            className="booking-location-change"
            onClick={() => {
              setEditing(true)
              setError('')
              setResults([])
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <form className="booking-location-search" onSubmit={searchLocation}>
            <input
              type="search"
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setError('')
              }}
              placeholder="Search your home or appointment address"
              aria-label="Search appointment location"
              autoComplete="street-address"
            />
            <button type="submit" disabled={!ready || busy}>
              {busy ? 'Searching…' : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="booking-location-results" role="listbox" aria-label="Location search results">
              {displayResults.map((result, index) => (
                <button
                  key={result.properties?.osm_id || result.properties?.osm_type + '-' + index}
                  type="button"
                  className="booking-location-result"
                  onClick={() => chooseSearchResult(result)}
                >
                  <strong>{result.address || 'Location result'}</strong>
                  <span>{result.properties?.country || 'Map result'}</span>
                </button>
              ))}
            </div>
          )}

          {editing && (
            <button
              type="button"
              className="booking-location-cancel-change"
              onClick={() => {
                setEditing(false)
                setSearch(value)
                setResults([])
                setError('')
              }}
            >
              Keep current location
            </button>
          )}
        </>
      )}

      <div className="booking-map-wrap">
        <div className="booking-map" ref={mapRef} aria-label="Select appointment location on OpenStreetMap" />
        <div className="booking-map-hint">
          {locationComplete
            ? 'Location saved. Drag the pin or tap the map only if you want to change it.'
            : 'Search an address, use your current location, or tap/drag the pin to set the exact place.'}
        </div>
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
