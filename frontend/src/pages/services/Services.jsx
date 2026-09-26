import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import './services-premium.css'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const serviceImages = {
  // Basic — clean palm/application reference.
  basic: '/palm-mehendi.jpg',

  // Intermediate — both palms with clearly visible, detailed mehndi.
  intermediate: 'https://images.pexels.com/photos/11925938/pexels-photo-11925938.jpeg?auto=compress&cs=tinysrgb&w=1400',

  // Five Finger Hand — dedicated finger-focused reference.
  fiveFinger: 'https://i.pinimg.com/736x/7b/74/90/7b7490e13b18da7287b0a9c28dda612e.jpg',

  // Advanced — full hands and arms, matching the full-length service.
  advanced: 'https://images.pexels.com/photos/4711086/pexels-photo-4711086.jpeg?auto=compress&cs=tinysrgb&w=1400',

  // Bridal — Pakistani/South Asian bridal portrait with red traditional attire,
  // jewelry and visible henna rather than another generic hand close-up.
  bridal: 'https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=1600',
}

const levelMeta = {
  basic: { label: 'Basic', intro: 'Simple, elegant designs for everyday occasions.' },
  intermediate: { label: 'Intermediate', intro: 'More detail and coverage for special occasions.' },
  advanced: { label: 'Advanced', intro: 'Statement designs with fuller coverage and detail.' },
  bridal: { label: 'Bridal', intro: 'Dedicated bridal work with richer detail and coverage.' },
}

function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = useMemo(getUser, [])
  const firstName = user?.name?.split(' ')?.[0] || 'there'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`${apiBase}/api/services`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load services.')
        if (!cancelled) setServices(data.services || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load services.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => {
    return ['basic', 'intermediate', 'advanced', 'bridal'].map((level) => ({
      level,
      services: services.filter((service) => service.level === level),
    })).filter((group) => group.services.length)
  }, [services])

  return (
    <main className="shop-dashboard services-dashboard">
      <DashboardSidebar active="services" />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Mehendi services</p>
            <h1>Choose your design.</h1>
          </div>
          <div className="dashboard-top-actions">
            <Link to="/products" className="services-shop-link">Shop supplies</Link>
          </div>
        </header>

        <div className="dashboard-content services-content">
          <section className="services-hero">
            <img className="services-hero-image" src={serviceImages.bridal} alt="Bridal mehendi" />
            <div className="services-hero-copy">
              <p className="dashboard-kicker">Made for your occasion</p>
              <h2>From a little detail to full bridal coverage.</h2>
              <p>Choose a service based on the coverage and detail you want. You can select your preferred date and time when booking.</p>
            </div>
            <div className="services-hero-mark" aria-hidden="true">
              <span></span><i></i><b></b>
            </div>
          </section>

          {loading && <div className="services-state">Loading services…</div>}
          {!loading && error && <div className="services-state services-error">{error}</div>}

          {!loading && !error && grouped.map((group) => (
            <section className="service-level-section" key={group.level}>
              <div className="service-level-heading">
                <div>
                  <p className="dashboard-kicker">{levelMeta[group.level].label}</p>
                  <h2>{levelMeta[group.level].intro}</h2>
                </div>
                <span>{group.services.length} {group.services.length === 1 ? 'service' : 'services'}</span>
              </div>

              <div className="service-card-grid">
                {group.services.map((service) => (
                  <article className={`service-card service-card-${group.level}`} key={service.id}>
                    <div className="service-card-image">
                      <img src={serviceImages[service.slug === 'intermediate-five-finger-hand' ? 'fiveFinger' : group.level]} alt={service.name} loading="lazy" />
                      <span>{levelMeta[group.level].label}</span>
                    </div>
                    <div className="service-card-top">
                      <span className="service-number">{String(group.services.indexOf(service) + 1).padStart(2, '0')}</span>
                      <span className="service-level-label">{levelMeta[group.level].label}</span>
                    </div>
                    <h3>{service.name}</h3>
                    <p>{service.description || levelMeta[group.level].intro}</p>
                    <div className="service-card-bottom">
                      <strong>{formatPrice(service.price_paise)}</strong>
                      {service.duration_minutes && <span>{service.duration_minutes} min</span>}
                    </div>
                    <Link to={`/booking?service=${service.slug}`} className="service-book-button">Book this service</Link>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {!loading && !error && services.length === 0 && (
            <div className="services-state">
              <h3>Services are being prepared.</h3>
              <p>The service catalogue is connected. Services will appear here once they are available.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
