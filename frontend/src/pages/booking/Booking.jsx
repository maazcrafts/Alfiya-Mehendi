import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const timeSlots = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 10 * 60 + index * 30
  const hour24 = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const hour12 = hour24 % 12 || 12
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const value = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return { value, label: `${hour12}:${String(minute).padStart(2, '0')} ${suffix}` }
})

function getUser() {
  try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}

function getToken() {
  return localStorage.getItem('alfiya_auth_token') || ''
}

function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100)
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatTime(value) {
  if (!value) return ''
  const [hour, minute] = value.slice(0, 5).split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function todayString() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

const statusMeta = {
  requested: { label: 'Pending admin approval', tone: 'pending' },
  confirmed: { label: 'Booked successfully', tone: 'confirmed' },
  rejected: { label: 'Request rejected', tone: 'rejected' },
  completed: { label: 'Completed', tone: 'confirmed' },
  cancelled: { label: 'Cancelled', tone: 'rejected' },
}

export default function Booking() {
  const [searchParams] = useSearchParams()
  const serviceSlug = searchParams.get('service') || ''
  const [service, setService] = useState(null)
  const [bookings, setBookings] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [loadingService, setLoadingService] = useState(Boolean(serviceSlug))
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const user = useMemo(getUser, [])
  const firstName = user?.name?.split(' ')?.[0] || 'there'
  const isLoggedIn = Boolean(getToken())

  useEffect(() => {
    if (!serviceSlug) {
      setLoadingService(false)
      return
    }

    let cancelled = false
    fetch(`${apiBase}/api/services/${encodeURIComponent(serviceSlug)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load the selected service.')
        if (!cancelled) setService(data.service)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingService(false))

    return () => { cancelled = true }
  }, [serviceSlug])

  const loadBookings = async () => {
    if (!isLoggedIn) {
      setLoadingBookings(false)
      return
    }

    try {
      const response = await fetch(`${apiBase}/api/bookings/mine`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to load your bookings.')
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.message || 'Unable to load your bookings.')
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!isLoggedIn) {
      setError('Please log in before requesting a mehendi appointment.')
      return
    }

    if (!serviceSlug || !date || !time) {
      setError('Please choose a date and time slot.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          serviceSlug,
          bookingDate: date,
          bookingTime: time,
          customerNote: note,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to send your booking request.')

      setMessage('Your request has been sent to Alfiya Mehendi. It will remain pending until the admin confirms the date and time.')
      setDate('')
      setTime('')
      setNote('')
      await loadBookings()
    } catch (err) {
      setError(err.message || 'Unable to send your booking request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="shop-dashboard booking-dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/products" className="dashboard-brand">
          <img className="dashboard-brand-logo" src="/alfiya-logo.svg" alt="Alfiya Mehendi" />
          <span><strong>Alfiya</strong><small>MEHENDI</small></span>
        </Link>

        <div className="dashboard-section-label">Workspace</div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link to="/products" className="dashboard-nav-item"><span aria-hidden="true"></span>Shop</Link>
          <Link to="/services" className="dashboard-nav-item"><span aria-hidden="true"></span>Mehendi Services</Link>
          <Link to="/orders" className="dashboard-nav-item"><span aria-hidden="true"></span>My Orders</Link>
          <Link to="/booking" className="dashboard-nav-item active"><span aria-hidden="true"></span>My Bookings</Link>
          {user?.role === 'admin' && <Link to="/admin/bookings" className="dashboard-nav-item"><span aria-hidden="true"></span>Admin Bookings</Link>}
        </nav>

        <div className="dashboard-section-label">Account</div>
        <nav className="dashboard-nav">
          <Link to="/account" className="dashboard-nav-item"><span aria-hidden="true"></span>Profile</Link>
          <Link to="/contact" className="dashboard-nav-item"><span aria-hidden="true"></span>Help & Contact</Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-mini">
            <div className="dashboard-avatar">
              {user?.picture ? <img src={user.picture} alt="" /> : firstName.charAt(0).toUpperCase()}
            </div>
            <div><strong>{user?.name || 'Guest'}</strong><small>{user?.email || 'Explore Alfiya Mehendi'}</small></div>
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Mehendi booking</p>
            <h1>{service ? 'Request your appointment.' : 'My bookings.'}</h1>
          </div>
          <div className="dashboard-top-actions">
            <Link to="/services" className="services-shop-link">Back to services</Link>
          </div>
        </header>

        <div className="dashboard-content booking-content">
          {!isLoggedIn && (
            <div className="booking-login-card">
              <p className="dashboard-kicker">Account required</p>
              <h2>Log in to request a booking.</h2>
              <p>Your appointment request needs to be connected to your Alfiya account so you can track the admin's decision.</p>
              <Link to="/login" className="service-book-button">Log in</Link>
            </div>
          )}

          {serviceSlug && loadingService && <div className="services-state">Loading your selected service…</div>}
          {error && <div className="booking-alert booking-alert-error">{error}</div>}
          {message && <div className="booking-alert booking-alert-success">{message}</div>}

          {isLoggedIn && serviceSlug && !loadingService && service && (
            <section className="booking-request-grid">
              <div className="booking-service-summary">
                <p className="dashboard-kicker">Selected service</p>
                <h2>{service.name}</h2>
                <p>{service.description}</p>
                <strong>{formatPrice(service.price_paise)}</strong>
                <div className="booking-process">
                  <span><b>01</b> You choose a date & slot</span>
                  <span><b>02</b> Admin reviews the request</span>
                  <span><b>03</b> You see confirmed or rejected status</span>
                </div>
              </div>

              <form className="booking-form-card" onSubmit={handleSubmit}>
                <p className="dashboard-kicker">Request a slot</p>
                <h2>When should we book you?</h2>

                <label className="booking-field">
                  <span>Preferred date</span>
                  <input type="date" min={todayString()} value={date} onChange={(event) => setDate(event.target.value)} required />
                </label>

                <div className="booking-field">
                  <span>Preferred time slot</span>
                  <div className="booking-time-grid">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot.value}
                        className={`booking-time-slot ${time === slot.value ? 'selected' : ''}`}
                        onClick={() => setTime(slot.value)}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="booking-field">
                  <span>Message to admin <small>(optional)</small></span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tell us anything important about your appointment." maxLength={500} />
                </label>

                <button type="submit" className="booking-submit" disabled={submitting}>
                  {submitting ? 'Sending request…' : 'Send booking request'}
                </button>
                <p className="booking-disclaimer">Your selected time is not reserved until the admin confirms it.</p>
              </form>
            </section>
          )}

          {isLoggedIn && !serviceSlug && (
            <div className="booking-empty-state">
              <p className="dashboard-kicker">No service selected</p>
              <h2>Choose a mehendi service first.</h2>
              <Link to="/services" className="service-book-button">Browse services</Link>
            </div>
          )}

          {isLoggedIn && (
            <section className="booking-history-section">
              <div className="booking-section-heading">
                <div>
                  <p className="dashboard-kicker">Appointment history</p>
                  <h2>Your booking requests</h2>
                </div>
                <span>{bookings.length} total</span>
              </div>

              {loadingBookings ? (
                <div className="services-state">Loading bookings…</div>
              ) : bookings.length === 0 ? (
                <div className="booking-empty-state compact">
                  <h3>No booking requests yet.</h3>
                  <p>Your pending, confirmed and rejected appointment requests will appear here.</p>
                </div>
              ) : (
                <div className="booking-list">
                  {bookings.map((booking) => {
                    const meta = statusMeta[booking.status] || statusMeta.requested
                    return (
                      <article className="booking-history-card" key={booking.id}>
                        <div className="booking-history-main">
                          <div>
                            <p className="dashboard-kicker">{booking.level}</p>
                            <h3>{booking.service_name}</h3>
                          </div>
                          <span className={`booking-status booking-status-${meta.tone}`}>{meta.label}</span>
                        </div>
                        <div className="booking-history-details">
                          <span><b>Date</b>{formatDate(booking.booking_date)}</span>
                          <span><b>Time</b>{formatTime(booking.booking_time)}</span>
                          <span><b>Price</b>{formatPrice(booking.price_paise)}</span>
                        </div>
                        {booking.status === 'requested' && <p className="booking-status-note">Waiting for admin approval. Your slot is only confirmed after acceptance.</p>}
                        {booking.status === 'confirmed' && <p className="booking-status-note success">Your appointment is booked successfully for the selected date and time.</p>}
                        {booking.status === 'rejected' && (
                          <p className="booking-status-note rejected">
                            This request was rejected{booking.admin_note ? `: ${booking.admin_note}` : '.'} Please choose another slot and submit a new request.
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
