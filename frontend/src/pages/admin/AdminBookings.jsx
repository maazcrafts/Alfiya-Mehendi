import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getUser() {
  try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}

function getToken() {
  return localStorage.getItem('alfiya_auth_token') || ''
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : ''
}

function formatTime(value) {
  if (!value) return ''
  const [hour, minute] = value.slice(0, 5).split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

const filters = [
  ['all', 'All'],
  ['requested', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['rejected', 'Rejected'],
]

export default function AdminBookings() {
  const user = useMemo(getUser, [])
  const navigate = useNavigate()
  const [filter, setFilter] = useState('requested')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')
  const [notes, setNotes] = useState({})
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/services', { replace: true })
      return
    }
    loadBookings()
  }, [filter])

  async function loadBookings() {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${apiBase}/api/bookings/admin?status=${filter}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to load booking requests.')
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.message || 'Unable to load booking requests.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    setActionId(id)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status, adminNote: notes[id] || '' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to update this booking.')
      setNotice(status === 'confirmed' ? 'Appointment confirmed and the time slot is now locked.' : 'Booking request rejected.')
      await loadBookings()
    } catch (err) {
      setError(err.message || 'Unable to update this booking.')
    } finally {
      setActionId('')
    }
  }

  return (
    <main className="shop-dashboard admin-dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/products" className="dashboard-brand">
          <img className="dashboard-brand-logo" src="/alfiya-logo.svg" alt="Alfiya Mehendi" />
          <span><strong>Alfiya</strong><small>MEHENDI</small></span>
        </Link>

        <div className="dashboard-section-label">Admin workspace</div>
        <nav className="dashboard-nav">
          <Link to="/services" className="dashboard-nav-item"><span aria-hidden="true"></span>Customer view</Link>
          <Link to="/admin/bookings" className="dashboard-nav-item active"><span aria-hidden="true"></span>Booking requests</Link>
        </nav>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Admin</p>
            <h1>Appointment requests.</h1>
          </div>
          <Link to="/services" className="services-shop-link">Open customer view</Link>
        </header>

        <div className="dashboard-content admin-content">
          <section className="admin-intro-card">
            <div>
              <p className="dashboard-kicker">Manual confirmation</p>
              <h2>Review every requested date and time before it becomes booked.</h2>
            </div>
            <span>{bookings.filter((booking) => booking.status === 'requested').length} pending</span>
          </section>

          <div className="admin-control-row"><input className="admin-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer or service…" aria-label="Search bookings" /></div>\n          <div className="admin-filter-row">
            {filters.map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
            ))}
            <button type="button" className="admin-refresh" onClick={loadBookings}>Refresh</button>
          </div>

          {error && <div className="booking-alert booking-alert-error">{error}</div>}{notice && <div className="booking-alert booking-alert-success">{notice}</div>}
          {loading ? (
            <div className="services-state">Loading booking requests…</div>
          ) : bookings.length === 0 ? (
            <div className="booking-empty-state"><h2>No requests in this view.</h2><p>New customer booking requests will appear here.</p></div>
          ) : (
            <div className="admin-booking-list">
              {bookings.filter(b=>!query || `${b.customer_name} ${b.customer_email} ${b.service_name}`.toLowerCase().includes(query.toLowerCase())).map((booking) => (
                <article className="admin-booking-card" key={booking.id}>
                  <div className="admin-booking-header">
                    <div>
                      <p className="dashboard-kicker">{booking.level}</p>
                      <h3>{booking.service_name}</h3>
                    </div>
                    <span className={`booking-status booking-status-${booking.status === 'requested' ? 'pending' : booking.status === 'confirmed' ? 'confirmed' : 'rejected'}`}>
                      {booking.status === 'requested' ? 'Pending' : booking.status}
                    </span>
                  </div>

                  <div className="admin-booking-grid">
                    <div><small>Customer</small><strong>{booking.customer_name}</strong><span>{booking.customer_email}</span></div>
                    <div><small>Requested date</small><strong>{formatDate(booking.booking_date)}</strong></div>
                    <div><small>Requested time</small><strong>{formatTime(booking.booking_time)}</strong></div>
                  </div>

                  {booking.customer_note && (
                    <div className="admin-message">
                      <small>Customer message</small>
                      <p>{booking.customer_note}</p>
                    </div>
                  )}

                  {booking.status === 'requested' ? (
                    <div className="admin-decision">
                      <label>
                        <span>Reply / internal note <small>(optional)</small></span>
                        <textarea
                          value={notes[booking.id] || ''}
                          onChange={(event) => setNotes((current) => ({ ...current, [booking.id]: event.target.value }))}
                          placeholder="e.g. Confirmed. Please arrive 10 minutes early."
                          maxLength={500}
                        />
                      </label>
                      <div>
                        <button type="button" className="admin-reject" disabled={actionId === booking.id} onClick={() => updateStatus(booking.id, 'rejected')}>Reject request</button>
                        <button type="button" className="admin-confirm" disabled={actionId === booking.id} onClick={() => updateStatus(booking.id, 'confirmed')}>{actionId === booking.id ? 'Saving…' : 'Accept & book'}</button>
                      </div>
                    </div>
                  ) : (
                    booking.admin_note && <div className="admin-message"><small>Admin note</small><p>{booking.admin_note}</p></div>
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
