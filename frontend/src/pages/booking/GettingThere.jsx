import { useEffect, useMemo, useState } from 'react'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const DESTINATION = 'Room No. 1613, H-Block, Near Bada Shia Imambada, Lotus Colony, Hamid Hamid Marg, Shivaji Nagar, Govandi West, Mumbai, Maharashtra 400043'
const DESTINATION_QUERY = encodeURIComponent(DESTINATION)

const modes = [
  { id: 'transit', label: 'Local / Train', icon: '↔', description: 'Public transport directions' },
  { id: 'driving', label: 'Auto / 2-Wheeler', icon: '⌁', description: 'Road route' },
  { id: 'driving', label: 'Cab / Car', icon: '⌖', description: 'Driving directions' },
  { id: 'walking', label: 'Walk', icon: '⌕', description: 'Walking route' },
]

function mapsUrl(mode, origin) {
  const originPart = origin ? `&origin=${origin.latitude},${origin.longitude}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${DESTINATION_QUERY}&travelmode=${mode}${originPart}`
}

export default function GettingThere() {
  const [mode, setMode] = useState('transit')
  const [position, setPosition] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    document.title = 'Getting There · Alfiya Mehendi'
  }, [])

  const selected = useMemo(
    () => modes.find(item => item.id === mode) || modes[0],
    [mode]
  )

  const openDirections = () => {
    window.open(mapsUrl(mode, position), '_blank', 'noopener,noreferrer')
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not provide location access.')
      return
    }

    setGettingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      value => {
        setPosition(value.coords)
        setGettingLocation(false)
      },
      () => {
        setLocationError('Location access was not available. You can still open Google Maps and choose your starting point there.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className="dashboard-page getting-there-dashboard">
      <DashboardSidebar active="bookings" />

      <main className="getting-there-content">
        <header className="dashboard-topbar getting-there-topbar">
          <div>
            <p className="dashboard-kicker">Your appointment destination</p>
            <h1>Getting there.</h1>
            <p>Choose how you want to travel. Google Maps will calculate the current route and travel time.</p>
          </div>
          <a className="getting-there-back" href="/booking">← My bookings</a>
        </header>

        <section className="getting-there-hero">
          <div className="getting-there-map-placeholder">
            <div className="map-grid" />
            <div className="map-road map-road-one" />
            <div className="map-road map-road-two" />
            <div className="map-pin">⌖</div>
            <div className="map-label">Alfiya Mehendi</div>
            <span className="map-nearby map-nearby-one">Lotus Colony</span>
            <span className="map-nearby map-nearby-two">Shivaji Nagar</span>
            <span className="map-nearby map-nearby-three">Govandi West</span>
            <div className="map-disclaimer">Live navigation opens in Google Maps</div>
          </div>

          <div className="getting-there-destination">
            <p className="dashboard-kicker">Alfiya Mehendi</p>
            <h2>Your appointment is here.</h2>

            <div className="destination-address">
              <span>⌖</span>
              <p>{DESTINATION}</p>
            </div>

            <button
              type="button"
              className="getting-there-location-button"
              onClick={useMyLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? 'Getting your location…' : 'Use my current location'}
            </button>

            {position && (
              <p className="location-ready">
                ✓ Starting point added. Google Maps will use it for directions.
              </p>
            )}

            {locationError && <p className="location-error">{locationError}</p>}
          </div>
        </section>

        <section className="getting-there-routes">
          <div className="getting-there-section-head">
            <div>
              <p className="dashboard-kicker">Route planner</p>
              <h2>How do you want to travel?</h2>
            </div>
            <span>Live times come from Google Maps</span>
          </div>

          <div className="travel-mode-grid">
            {modes.map((item, index) => (
              <button
                type="button"
                key={`${item.label}-${index}`}
                className={`travel-mode-card ${selected === item ? 'active' : ''}`}
                onClick={() => setMode(item.id)}
              >
                <span className="travel-mode-number">0{index + 1}</span>
                <span className="travel-mode-icon">{item.icon}</span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                {selected === item && <span className="travel-mode-selected">Selected</span>}
              </button>
            ))}
          </div>

          <div className="route-action-card">
            <div>
              <p className="dashboard-kicker">Selected route</p>
              <h3>{selected.label}</h3>
              <p>Google Maps will calculate distance, estimated time, transfers and turn-by-turn directions when available.</p>
            </div>

            <div className="route-action-buttons">
              <button type="button" onClick={openDirections} className="maps-primary">
                Open directions in Google Maps →
              </button>
              <button type="button" onClick={useMyLocation} className="maps-secondary">
                Set my starting point
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
