import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const getToken = () => sessionStorage.getItem('alfiya_auth_token') || ''

function money(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100)
}

const emptyAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
}

export default function Checkout() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const [successOrder, setSuccessOrder] = useState(null)

  const token = getToken()

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    loadCheckout()
  }, [])

  async function request(url, options = {}) {
    const response = await fetch(apiBase + url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Something went wrong.')
    return data
  }

  async function loadCheckout() {
    setLoading(true)
    setError('')

    // Load the cart independently from address data. A missing/failed address
    // request must never make an existing cart appear empty.
    try {
      const cartData = await request('/api/cart')
      setItems(Array.isArray(cartData.items) ? cartData.items : [])
    } catch (err) {
      setError(err.message || 'Unable to load your cart for checkout.')
      setItems([])
      setLoading(false)
      return
    }

    try {
      const addressData = await request('/api/addresses')
      const saved = Array.isArray(addressData.addresses) ? addressData.addresses : []
      setAddresses(saved)
      const preferred = saved.find(address => address.isDefault) || saved[0]
      if (preferred) {
        setSelectedAddressId(preferred.id)
        setShowAddressForm(false)
      } else {
        setSelectedAddressId('')
        setShowAddressForm(true)
      }
    } catch (err) {
      // The cart is still valid. Let the user add/select an address instead
      // of replacing the checkout with an empty-cart state.
      setAddresses([])
      setSelectedAddressId('')
      setShowAddressForm(true)
      setError(err.message || 'Unable to load saved addresses. Please add a delivery address.')
    } finally {
      setLoading(false)
    }
  }

  function changeAddressField(event) {
    const { name, value, type, checked } = event.target
    setAddressForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function saveAddress(event) {
    event.preventDefault()
    setSavingAddress(true)
    setError('')
    try {
      const data = await request('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addressForm),
      })
      const saved = data.address
      setAddresses(current => [saved, ...current])
      setSelectedAddressId(saved.id)
      setShowAddressForm(false)
      setAddressForm(emptyAddress)
    } catch (err) {
      setError(err.message || 'Unable to save your address.')
    } finally {
      setSavingAddress(false)
    }
  }

  async function placeOrder() {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address.')
      return
    }

    setPlacingOrder(true)
    setError('')
    try {
      const data = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ addressId: selectedAddressId }),
      })
      setSuccessOrder(data.order)
      setItems([])
      window.dispatchEvent(new Event('alfiya-cart-updated'))
    } catch (err) {
      setError(err.message || 'Unable to place your order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotalPaise, 0), [items])
  const shipping = 0
  const total = subtotal + shipping

  if (loading) {
    return (
      <main className="shop-dashboard checkout-dashboard">
        <DashboardSidebar active="shop" />
        <section className="dashboard-main">
          <header className="dashboard-topbar"><div><p className="dashboard-kicker">Secure checkout</p><h1>Checkout.</h1></div></header>
          <div className="dashboard-content"><div className="checkout-loading">Preparing your checkout…</div></div>
        </section>
      </main>
    )
  }

  if (successOrder) {
    return (
      <main className="shop-dashboard checkout-dashboard">
        <DashboardSidebar active="shop" />
        <section className="dashboard-main">
          <header className="dashboard-topbar">
            <div><p className="dashboard-kicker">Order complete</p><h1>Thank you.</h1></div>
          </header>
          <div className="dashboard-content checkout-content">
            <section className="checkout-success">
              <div className="checkout-success-mark">✓</div>
              <p className="dashboard-kicker">Order placed successfully</p>
              <h2>Your Alfiya order is on its way into the workflow.</h2>
              <p>We've created your order and reserved the products from your cart. You can follow its status from My Orders.</p>
              <div className="checkout-success-number">
                <span>Order ID</span>
                <strong>{successOrder.id}</strong>
              </div>
              <div className="checkout-success-total">
                <span>Total</span>
                <strong>{money(successOrder.totalPaise)}</strong>
              </div>
              <div className="checkout-success-actions">
                <Link to="/orders" className="booking-primary-button">View my orders →</Link>
                <Link to="/products" className="checkout-secondary-button">Continue shopping</Link>
              </div>
            </section>
          </div>
        </section>
      </main>
    )
  }

  if (!items.length) {
    return (
      <main className="shop-dashboard checkout-dashboard">
        <DashboardSidebar active="shop" />
        <section className="dashboard-main">
          <header className="dashboard-topbar"><div><p className="dashboard-kicker">Secure checkout</p><h1>Checkout.</h1></div></header>
          <div className="dashboard-content checkout-content">
            <section className="checkout-empty">
              <p className="dashboard-kicker">Nothing to check out</p>
              <h2>Your cart is empty.</h2>
              <p>Add something from the Alfiya shop before coming back here.</p>
              <Link to="/products" className="booking-primary-button">Browse the shop →</Link>
            </section>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="shop-dashboard checkout-dashboard">
      <DashboardSidebar active="shop" />
      <section className="dashboard-main">
        <header className="dashboard-topbar checkout-topbar">
          <div><p className="dashboard-kicker">Secure checkout</p><h1>Complete your order.</h1></div>
          <Link to="/cart" className="services-shop-link">← Back to cart</Link>
        </header>

        <div className="dashboard-content checkout-content">
          {error && <div className="booking-alert booking-alert-error">{error}</div>}

          <div className="checkout-layout">
            <section className="checkout-main">
              <div className="checkout-step">
                <div className="checkout-step-heading">
                  <span>01</span>
                  <div><p className="dashboard-kicker">Delivery</p><h2>Where should we send it?</h2></div>
                </div>

                {addresses.length > 0 && (
                  <div className="saved-addresses">
                    {addresses.map(address => (
                      <button
                        type="button"
                        key={address.id}
                        className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <span className="address-radio">{selectedAddressId === address.id ? '✓' : ''}</span>
                        <span className="address-card-copy">
                          <strong>{address.label || 'Address'}</strong>
                          <b>{address.fullName} · {address.phone}</b>
                          <small>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state} — {address.postalCode}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!showAddressForm ? (
                  <button type="button" className="add-address-button" onClick={() => setShowAddressForm(true)}>+ Add a new delivery address</button>
                ) : (
                  <form className="address-form" onSubmit={saveAddress}>
                    <div className="address-form-title"><strong>New delivery address</strong><button type="button" onClick={() => setShowAddressForm(false)} disabled={!addresses.length}>Close</button></div>
                    <div className="address-form-grid">
                      <label><span>Label</span><input name="label" value={addressForm.label} onChange={changeAddressField} placeholder="Home" /></label>
                      <label><span>Full name *</span><input name="fullName" value={addressForm.fullName} onChange={changeAddressField} required placeholder="Recipient name" /></label>
                      <label><span>Phone *</span><input name="phone" value={addressForm.phone} onChange={changeAddressField} required placeholder="+91" /></label>
                      <label className="address-wide"><span>Address line 1 *</span><input name="addressLine1" value={addressForm.addressLine1} onChange={changeAddressField} required placeholder="House / flat / building and street" /></label>
                      <label className="address-wide"><span>Address line 2</span><input name="addressLine2" value={addressForm.addressLine2} onChange={changeAddressField} placeholder="Area, landmark (optional)" /></label>
                      <label><span>City *</span><input name="city" value={addressForm.city} onChange={changeAddressField} required placeholder="Mumbai" /></label>
                      <label><span>State *</span><input name="state" value={addressForm.state} onChange={changeAddressField} required placeholder="Maharashtra" /></label>
                      <label><span>Postal code *</span><input name="postalCode" value={addressForm.postalCode} onChange={changeAddressField} required placeholder="400000" /></label>
                    </div>
                    <label className="address-default-check"><input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={changeAddressField} /><span>Make this my default delivery address</span></label>
                    <button type="submit" className="save-address-button" disabled={savingAddress}>{savingAddress ? 'Saving address…' : 'Save address'}</button>
                  </form>
                )}
              </div>

              <div className="checkout-step">
                <div className="checkout-step-heading">
                  <span>02</span>
                  <div><p className="dashboard-kicker">Your products</p><h2>Review your order.</h2></div>
                </div>
                <div className="checkout-items">
                  {items.map(item => (
                    <article className="checkout-item" key={item.productId}>
                      <div className="checkout-item-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt} /> : <span>Alfiya</span>}</div>
                      <div><strong>{item.name}</strong><p>{money(item.pricePaise)} × {item.quantity}</p></div>
                      <b>{money(item.lineTotalPaise)}</b>
                    </article>
                  ))}
                </div>
              </div>

              <div className="checkout-step checkout-payment-note">
                <div className="checkout-step-heading">
                  <span>03</span>
                  <div><p className="dashboard-kicker">Payment</p><h2>Payment comes next.</h2></div>
                </div>
                <p>This first checkout release creates the order securely and records it as pending. Payment integration can be connected without changing the cart or order architecture.</p>
              </div>
            </section>

            <aside className="checkout-summary">
              <p className="dashboard-kicker">Final review</p>
              <h2>Ready to place it?</h2>
              <div className="checkout-summary-row"><span>Items</span><b>{count}</b></div>
              <div className="checkout-summary-row"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div className="checkout-summary-row"><span>Delivery</span><b>Free</b></div>
              <div className="checkout-summary-total"><span>Total</span><strong>{money(total)}</strong></div>
              <button type="button" className="checkout-place-button" onClick={placeOrder} disabled={placingOrder || !selectedAddressId}>
                {placingOrder ? 'Placing your order…' : 'Place order →'}
              </button>
              {!selectedAddressId && <small>Add a delivery address to continue.</small>}
              <Link to="/cart" className="checkout-edit-cart">Edit cart</Link>
              <p className="checkout-trust-note">Your cart is rechecked on the server before the order is created.</p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
