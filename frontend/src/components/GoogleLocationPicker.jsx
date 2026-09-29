import { useEffect, useRef, useState } from 'react'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const DEFAULT_CENTER = { lat: 19.0760, lng: 72.8777 }

let mapsLoaderPromise = null

function loadGoogleMaps() {
  if (!apiKey) return Promise.reject(new Error('Google Maps is not configured.'))

  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)

  if (mapsLoaderPromise) return mapsLoaderPromise

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-alfiya-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Maps could not be loaded.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.alfiyaGoogleMaps = 'true'
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps could not be loaded.'))
    document.head.appendChild(script)
  })

  return mapsLoaderPromise
}

function validPoint(latitude, longitude) {
  return Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number(longitude) >= -180 && Number(longitude) <= 180
}

export default function GoogleLocationPicker({
  value = '',
  latitude = null,
  longitude = null,
  placeId = '',
  onChange,
}) {
  const mapRef = useRef(null)
  const autocompleteRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)
  const autocompleteInstanceRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    let mapClickListener = null
    let markerDragListener = null
    let autocompleteListener = null

    async function init() {
      try {
        setError('')
        await loadGoogleMaps()
        if (cancelled) return

        const [{ Map }, { AdvancedMarkerElement }, { PlaceAutocompleteElement }] = await Promise.all([
          window.google.maps.importLibrary('maps'),
          window.google.maps.importLibrary('marker'),
          window.google.maps.importLibrary('places'),
        ])

        if (cancelled || !mapRef.current || !autocompleteRef.current) return

        const initial = validPoint(latitude, longitude)
          ? { lat: Number(latitude), lng: Number(longitude) }
          : DEFAULT_CENTER

        const map = new Map(mapRef.current, {
          center: initial,
          zoom: validPoint(latitude, longitude) ? 16 : 11,
          mapId: 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
        })

        const marker = new AdvancedMarkerElement({
          map,
          position: validPoint(latitude, longitude) ? initial : undefined,
          gmpDraggable: true,
          title: 'Appointment location',
        })

        const geocoder = new window.google.maps.Geocoder()
        mapInstanceRef.current = map
        markerRef.current = marker
        geocoderRef.current = geocoder

        const reverseGeocode = async (position, fallbackAddress = '') => {
          const point = {
            lat: Number(typeof position.lat === 'function' ? position.lat() : position.lat),
            lng: Number(typeof position.lng === 'function' ? position.lng() : position.lng),
          }

          if (!validPoint(point.lat, point.lng)) return

          setBusy(true)
          try {
            const result = await geocoder.geocode({ location: point })
            const formattedAddress = result.results?.[0]?.formatted_address || fallbackAddress
            const selectedPlaceId = result.results?.[0]?.place_id || placeId || ''
            onChangeRef.current?.({
              address: formattedAddress,
              latitude: point.lat,
              longitude: point.lng,
              placeId: selectedPlaceId,
            })
          } catch {
            onChangeRef.current?.({
              address: fallbackAddress || value,
              latitude: point.lat,
              longitude: point.lng,
              placeId,
            })
          } finally {
            setBusy(false)
          }
        }

        mapClickListener = map.addListener('click', event => {
          if (!event.latLng) return
          marker.position = event.latLng
          map.panTo(event.latLng)
          reverseGeocode(event.latLng)
        })

        markerDragListener = marker.addEventListener('gmp-dragend', () => {
          const position = marker.position
          reverseGeocode(position)
        })

        const autocomplete = new PlaceAutocompleteElement()
        autocomplete.placeholder = 'Search for your home or appointment address'
        autocomplete.includedRegionCodes = ['in']
        autocomplete.className = 'booking-google-autocomplete'
        autocompleteRef.current.appendChild(autocomplete)
        autocompleteInstanceRef.current = autocomplete

        autocompleteListener = async event => {
          const place = event.placePrediction?.toPlace?.()
          if (!place) return

          try {
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'id'],
            })

            if (!place.location) return

            const point = {
              lat: Number(place.location.lat()),
              lng: Number(place.location.lng()),
            }

            if (place.viewport) {
              map.fitBounds(place.viewport)
            } else {
              map.setCenter(point)
              map.setZoom(17)
            }

            marker.position = point
            onChangeRef.current?.({
              address: place.formattedAddress || place.displayName || '',
              latitude: point.lat,
              longitude: point.lng,
              placeId: place.id || '',
            })
          } catch {
            setError('We could not read that place. Please choose another result.')
          }
        }

        autocomplete.addEventListener('gmp-select', autocompleteListener)

        if (value && autocomplete.inputElement) {
          autocomplete.inputElement.value = value
        }

        setReady(true)
      } catch (initError) {
        if (!cancelled) setError(initError?.message || 'Google Maps could not be loaded.')
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapClickListener) mapClickListener.remove?.()
      if (markerDragListener) markerRef.current?.removeEventListener?.('gmp-dragend', markerDragListener)
      if (autocompleteListener && autocompleteInstanceRef.current) {
        autocompleteInstanceRef.current.removeEventListener('gmp-select', autocompleteListener)
      }
      autocompleteInstanceRef.current?.remove()
      autocompleteInstanceRef.current = null
      mapInstanceRef.current = null
      markerRef.current = null
      geocoderRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !validPoint(latitude, longitude) || !mapInstanceRef.current || !markerRef.current) return
    const point = { lat: Number(latitude), lng: Number(longitude) }
    markerRef.current.position = point
    mapInstanceRef.current.panTo(point)
  }, [ready, latitude, longitude])

  useEffect(() => {
    if (!ready || !autocompleteInstanceRef.current || !value) return
    const input = autocompleteInstanceRef.current.inputElement
    if (input && input.value !== value) input.value = value
  }, [ready, value])

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
        if (map) {
          map.setCenter(point)
          map.setZoom(17)
        }
        if (marker) marker.position = point

        try {
          const result = await geocoderRef.current?.geocode({ location: point })
          const formattedAddress = result?.results?.[0]?.formatted_address || 'Current device location'
          const selectedPlaceId = result?.results?.[0]?.place_id || ''
          onChangeRef.current?.({
            address: formattedAddress,
            latitude: point.lat,
            longitude: point.lng,
            placeId: selectedPlaceId,
          })
        } catch {
          onChangeRef.current?.({
            address: 'Current device location',
            latitude: point.lat,
            longitude: point.lng,
            placeId: '',
          })
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

      <div className="booking-google-search" ref={autocompleteRef} aria-label="Search appointment location" />

      <div className="booking-map-wrap">
        <div className="booking-map" ref={mapRef} aria-label="Select appointment location on Google Maps" />
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
    </div>
  )
}
