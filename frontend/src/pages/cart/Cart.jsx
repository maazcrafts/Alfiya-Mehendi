import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const token = () => sessionStorage.getItem('alfiya_auth_token') || ''

function money(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100)
}

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token()) { navigate('/login', { replace: true }); return }
    load()
  }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const response = await fetch(`${apiBase}/api/cart`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to load your cart.')
      setItems(data.items || [])
    } catch (err) { setError(err.message || 'Unable to load your cart.') }
    finally { setLoading(false) }
  }

  async function update(productId, quantity) {
    setBusy(productId); setError('')
    try {
      const response = await fetch(`${apiBase}/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ quantity }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to update this item.')
      setItems(data.items || [])
      window.dispatchEvent(new Event('alfiya-cart-updated'))
    } catch (err) { setError(err.message || 'Unable to update this item.') }
    finally { setBusy('') }
  }

  async function remove(productId) {
    setBusy(productId); setError('')
    try {
      const response = await fetch(`${apiBase}/api/cart/items/${productId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to remove this item.')
      setItems(data.items || [])
      window.dispatchEvent(new Event('alfiya-cart-updated'))
    } catch (err) { setError(err.message || 'Unable to remove this item.') }
    finally { setBusy('') }
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.lineTotalPaise, 0)

  return (
    <main className="shop-dashboard cart-dashboard">
      <DashboardSidebar active="shop" />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="dashboard-kicker">Your shopping bag</p><h1>Cart.</h1></div>
          <Link to="/products" className="services-shop-link">Continue shopping →</Link>
        </header>
        <div className="dashboard-content cart-content">
          <div className="cart-heading">
            <div><p className="dashboard-kicker">{count} {count === 1 ? 'item' : 'items'}</p><h2>Review what you're taking home.</h2></div>
          </div>
          {error && <div className="booking-alert booking-alert-error">{error}</div>}
          {loading ? <div className="services-state">Loading your cart…</div> : items.length === 0 ? (
            <section className="cart-empty">
              <span className="dashboard-empty-rule"></span>
              <h2>Your cart is empty.</h2>
              <p>Start with mehendi powders, oils, tools or cone supplies.</p>
              <Link to="/products" className="booking-primary-button">Browse the shop →</Link>
            </section>
          ) : (
            <div className="cart-layout">
              <section className="cart-items">
                {items.map(item => (
                  <article className="cart-item" key={item.productId}>
                    <div className="cart-item-image">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt} /> : <span>Alfiya</span>}
                    </div>
                    <div className="cart-item-info">
                      <small>IN STOCK · {item.stockQuantity} available</small>
                      <h3>{item.name}</h3>
                      <strong>{money(item.pricePaise)}</strong>
                      <button type="button" onClick={() => remove(item.productId)} disabled={busy === item.productId}>Remove</button>
                    </div>
                    <div className="cart-item-controls">
                      <button type="button" disabled={busy === item.productId || item.quantity <= 1} onClick={() => update(item.productId, item.quantity - 1)}>−</button>
                      <b>{item.quantity}</b>
                      <button type="button" disabled={busy === item.productId || item.quantity >= item.stockQuantity} onClick={() => update(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <strong className="cart-item-total">{money(item.lineTotalPaise)}</strong>
                  </article>
                ))}
              </section>
              <aside className="cart-summary">
                <p className="dashboard-kicker">Order summary</p>
                <h2>Ready when you are.</h2>
                <div><span>Items</span><b>{count}</b></div>
                <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
                <div className="cart-summary-total"><span>Total</span><b>{money(subtotal)}</b></div>
                <Link to="/checkout" className="booking-primary-button">Continue to checkout →</Link>
                <small>Delivery charges will be calculated at checkout.</small>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
