import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const statusMeta = {
  pending: ['Order received', 'pending'],
  confirmed: ['Confirmed', 'confirmed'],
  processing: ['Preparing', 'confirmed'],
  shipped: ['Shipped', 'confirmed'],
  delivered: ['Delivered', 'delivered'],
  cancelled: ['Cancelled', 'cancelled'],
  refunded: ['Refunded', 'cancelled'],
}

const filters = [
  ['all', 'All orders'],
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
  ['refunded', 'Refunded'],
]

function token() { return localStorage.getItem('alfiya_auth_token') || '' }
function user() { try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} } }
function money(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100)
}
function dateLabel(value) {
  return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : ''
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const admin = useMemo(user, [])
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (admin?.role !== 'admin') {
      navigate('/services', { replace: true })
      return
    }
    loadOrders()
  }, [filter])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/api/orders/admin?status=${filter}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const type = response.headers.get('content-type') || ''
      if (!type.includes('application/json')) throw new Error('The orders service returned an unexpected response.')
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to load customer orders.')
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || 'Unable to load customer orders.')
    } finally {
      setLoading(false)
    }
  }

  const visible = orders.filter((order) => {
    if (!query.trim()) return true
    const haystack = [
      order.id,
      order.customer_name,
      order.customer_email,
      ...(order.items || []).map((item) => item.productName),
    ].join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <main className="shop-dashboard admin-dashboard">
      <DashboardSidebar active="admin-orders" adminOnly />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Admin</p>
            <h1>Customer orders.</h1>
          </div>
          <Link to="/admin/bookings" className="services-shop-link">Appointment requests →</Link>
        </header>

        <div className="dashboard-content admin-content">
          <section className="admin-intro-card">
            <div>
              <p className="dashboard-kicker">All commerce activity</p>
              <h2>Every order placed through the website, visible only to admins.</h2>
            </div>
            <span>{pendingCount} pending</span>
          </section>

          <div className="admin-control-row">
            <input
              className="admin-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, email, order or product…"
              aria-label="Search customer orders"
            />
          </div>

          <div className="admin-filter-row">
            {filters.map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
            <button type="button" className="admin-refresh" onClick={loadOrders}>Refresh</button>
          </div>

          {error && <div className="booking-alert booking-alert-error">{error}</div>}

          {loading ? (
            <div className="services-state">Loading customer orders…</div>
          ) : visible.length === 0 ? (
            <div className="booking-empty-state">
              <h2>No orders in this view.</h2>
              <p>Orders placed by customers will appear here automatically.</p>
            </div>
          ) : (
            <div className="admin-order-list">
              {visible.map((order) => {
                const meta = statusMeta[order.status] || statusMeta.pending
                const isOpen = open === order.id
                return (
                  <article className="admin-order-card" key={order.id}>
                    <button type="button" className="admin-order-head" onClick={() => setOpen(isOpen ? null : order.id)}>
                      <div>
                        <span className="admin-order-number">ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                        <h3>{order.customer_name}</h3>
                        <p>{order.customer_email} · {dateLabel(order.created_at)}</p>
                      </div>
                      <div className="admin-order-head-right">
                        <span className={`booking-status booking-status-${meta[1]}`}>{meta[0]}</span>
                        <strong>{money(order.total_paise)}</strong>
                        <span className="admin-order-expand">{isOpen ? '−' : '+'}</span>
                      </div>
                    </button>

                    <div className="admin-order-summary">
                      <span><b>Items</b>{order.items?.length || 0}</span>
                      <span><b>Subtotal</b>{money(order.subtotal_paise)}</span>
                      <span><b>Shipping</b>{money(order.shipping_paise)}</span>
                      <span><b>Total</b>{money(order.total_paise)}</span>
                    </div>

                    {isOpen && (
                      <div className="admin-order-details">
                        <div className="admin-order-customer">
                          <small>Customer</small>
                          <strong>{order.customer_name}</strong>
                          <span>{order.customer_email}</span>
                        </div>
                        <div className="admin-order-items">
                          {(order.items || []).map((item) => (
                            <div key={item.id}>
                              <span><strong>{item.productName}</strong> × {item.quantity}</span>
                              <b>{money(item.lineTotalPaise)}</b>
                            </div>
                          ))}
                        </div>
                        <div className="admin-order-total"><span>Order total</span><strong>{money(order.total_paise)}</strong></div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
