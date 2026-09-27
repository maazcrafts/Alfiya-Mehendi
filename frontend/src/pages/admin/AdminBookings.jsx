import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('alfiya_auth_token') || ''
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(value) {
  if (!value) return '—'
  const parts = String(value).slice(0, 5).split(':').map(Number)
  const hour = parts[0]
  const minute = parts[1]
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(value)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

const filters = [
  ['all', 'All'],
  ['requested', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['completed', 'Completed'],
  ['rejected', 'Rejected'],
  ['cancelled', 'Cancelled'],
]

export default function AdminBookings() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('requested')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${apiBase}/api/bookings/admin?status=${encodeURIComponent(filter)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        navigate('/services', { replace: true })
        return
      }

      if (!response.ok) {
        throw new Error(data.message || `Unable to load appointments (HTTP ${response.status}).`)
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load appointments.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [filter, navigate])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  async function updateStatus(id, status) {
    setActionId(id)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${apiBase}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update appointment.')
      }

      setNotice(
        status === 'confirmed'
          ? 'Appointment confirmed and the time slot is now locked.'
          : status === 'completed'
            ? 'Appointment marked completed.'
            : status === 'cancelled'
              ? 'Appointment cancelled.'
              : 'Booking request rejected.',
      )

      await loadBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update appointment.')
    } finally {
      setActionId('')
    }
  }

  const visibleBookings = bookings.filter((booking) => {
    if (!query.trim()) return true
    const text = [
      booking.customer_name,
      booking.customer_email,
      booking.service_name,
      booking.level,
      booking.booking_date,
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  return (
    <main className="shop-dashboard admin-dashboard">
      <DashboardSidebar active="admin" adminOnly />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Admin</p>
            <h1>Appointments.</h1>
          </div>
          <Link to="/services" className="services-shop-link">Open customer view →</Link>
        </header>

        <div className="dashboard-content admin-content">
          <section className="admin-intro-card">
            <div>
              <p className="dashboard-kicker">Appointment management</p>
              <h2>Review, confirm and manage customer appointment requests.</h2>
            </div>
            <span>{bookings.filter((booking) => booking.status === 'requested').length} pending</span>
          </section>

          <div className="admin-control-row">
            <input
              className="admin-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, email or service…"
              aria-label="Search appointments"
            />
          </div>

          <div className="admin-filter-row">
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
            <button type="button" className="admin-refresh" onClick={loadBookings}>
              Refresh
            </button>
          </div>

          {error && <div className="booking-alert booking-alert-error" role="alert">{error}</div>}
          {notice && <div className="booking-alert booking-alert-success" role="status">{notice}</div>}

          {loading ? (
            <div className="services-state">Loading appointments…</div>
          ) : visibleBookings.length === 0 ? (
            <div className="booking-empty-state">
              <h2>No appointments in this view.</h2>
              <p>Customer appointment requests will appear here automatically.</p>
            </div>
          ) : (
            <div className="admin-booking-list">
              {visibleBookings.map((booking) => (
                <article className="admin-booking-card" key={booking.id}>
                  <div className="admin-booking-header">
                    <div>
                      <p className="dashboard-kicker">{booking.level || 'Service'}</p>
                      <h3>{booking.service_name || 'Mehendi appointment'}</h3>
                    </div>
                    <span className="booking-status booking-status-confirmed">
                      {booking.status === 'requested' ? 'Pending' : booking.status}
                    </span>
                  </div>

                  <div className="admin-booking-grid">
                    <div>
                      <small>Customer</small>
                      <strong>{booking.customer_name || 'Customer'}</strong>
                      <span>{booking.customer_email || '—'}</span>
                    </div>
                    <div>
                      <small>Phone</small>
                      <strong>{booking.customer_phone || 'Not provided'}</strong>
                      {booking.customer_phone && <a href={`tel:${booking.customer_phone}`}>Call customer</a>}
                    </div>
                    <div>
                      <small>Location</small>
                      <strong>{booking.customer_location || 'Not provided'}</strong>
                    </div>
                    <div>
                      <small>Appointment</small>
                      <strong>{formatDate(booking.booking_date)}</strong>
                      <span>{formatTime(booking.booking_time)}</span>
                    </div>
                  </div>

                  <div className="admin-contact-card">
                    <div className="admin-contact-card-heading">
                      <div>
                        <span>Customer contact</span>
                        <strong>Stay in touch with {booking.customer_name || 'this customer'}</strong>
                      </div>
                      <span className="admin-contact-badge">Account verified</span>
                    </div>
                    <div className="admin-contact-actions">
                      <a href={booking.customer_email ? `mailto:${booking.customer_email}` : '#'} aria-disabled={!booking.customer_email}>
                        <small>Email</small>
                        <strong>{booking.customer_email || 'No email'}</strong>
                      </a>
                      <a href={booking.customer_phone ? `tel:${booking.customer_phone}` : '#'} aria-disabled={!booking.customer_phone}>
                        <small>Phone</small>
                        <strong>{booking.customer_phone || 'No phone'}</strong>
                      </a>
                      <div>
                        <small>Area / locality</small>
                        <strong>{booking.customer_location || 'Not provided'}</strong>
                      </div>
                    </div>
                  </div>

                  {booking.customer_note && (
                    <div className="admin-message">
                      <small>Customer message</small>
                      <p>{booking.customer_note}</p>
                    </div>
                  )}

                  {booking.admin_note && (
                    <div className="admin-message">
                      <small>Admin note</small>
                      <p>{booking.admin_note}</p>
                    </div>
                  )}

                  {booking.status === 'requested' && (
                    <div className="admin-decision">
                      <div>
                        <button
                          type="button"
                          className="admin-reject"
                          disabled={actionId === booking.id}
                          onClick={() => updateStatus(booking.id, 'rejected')}
                        >
                          Reject request
                        </button>
                        <button
                          type="button"
                          className="admin-confirm"
                          disabled={actionId === booking.id}
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                        >
                          {actionId === booking.id ? 'Saving…' : 'Accept & book'}
                        </button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="admin-decision admin-lifecycle-actions">
                      <div>
                        <button
                          type="button"
                          className="admin-reject"
                          disabled={actionId === booking.id}
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                        >
                          Cancel appointment
                        </button>
                        <button
                          type="button"
                          className="admin-confirm"
                          disabled={actionId === booking.id}
                          onClick={() => updateStatus(booking.id, 'completed')}
                        >
                          {actionId === booking.id ? 'Saving…' : 'Mark completed'}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
