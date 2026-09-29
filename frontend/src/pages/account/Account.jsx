import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A'
}

function formatMemberSince(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function Account() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [formName, setFormName] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [activity, setActivity] = useState({ orders: 0, bookings: 0, cart: 0 })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const token = sessionStorage.getItem('alfiya_auth_token') || ''
  const localUser = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('alfiya_user') || 'null') } catch { return null }
  }, [])

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    async function loadProfile() {
      try {
        const response = await fetch(apiBase + '/api/users/me', {
          headers: { Authorization: 'Bearer ' + token },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load your profile.')
        setUser(data.user)
        setFormName(data.user.name || '')
        sessionStorage.setItem('alfiya_user', JSON.stringify({
          ...localUser,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          picture: data.user.picture,
          role: data.user.role,
          provider: data.user.provider,
        }))
      } catch (error) {
        setFeedback({ type: 'error', message: error.message || 'Unable to load your profile.' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    async function loadActivity() {
      const headers = { Authorization: 'Bearer ' + token }
      const results = await Promise.allSettled([
        fetch(apiBase + '/api/orders/mine', { headers }),
        fetch(apiBase + '/api/bookings/mine', { headers }),
        fetch(apiBase + '/api/cart', { headers }),
      ])
      const read = async (result, key) => {
        if (result.status !== 'fulfilled' || !result.value.ok) return 0
        try {
          const data = await result.value.json()
          if (key === 'cart') return Array.isArray(data.items) ? data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0
          if (key === 'orders') return Array.isArray(data.orders) ? data.orders.length : 0
          return Array.isArray(data.bookings) ? data.bookings.length : 0
        } catch { return 0 }
      }
      const [orders, bookings, cart] = await Promise.all([
        read(results[0], 'orders'),
        read(results[1], 'bookings'),
        read(results[2], 'cart'),
      ])
      setActivity({ orders, bookings, cart })
    }
    loadActivity()
  }, [navigate, token])

  async function saveProfile(event) {
    event.preventDefault()
    const name = formName.trim()

    if (name.length < 2) {
      setFeedback({ type: 'error', message: 'Please enter your full name.' })
      return
    }

    setSaving(true)
    setFeedback({ type: '', message: '' })

    try {
      const response = await fetch(apiBase + '/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ name }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to update your profile.')

      setUser(data.user)
      setFormName(data.user.name)
      sessionStorage.setItem('alfiya_user', JSON.stringify({
        ...localUser,
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture,
        role: data.user.role,
        provider: data.user.provider,
      }))
      setEditing(false)
      setFeedback({ type: 'success', message: 'Your profile has been updated.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to update your profile.' })
    } finally {
      setSaving(false)
    }
  }

  function confirmLogout() {
    setShowLogoutConfirm(false)
    sessionStorage.removeItem('alfiya_auth_token')
    sessionStorage.removeItem('alfiya_user')
    sessionStorage.removeItem('alfiya_remember_me')
    window.dispatchEvent(new Event('alfiya-auth-changed'))
    navigate('/login', { replace: true })
  }

  function logout() {
    setShowLogoutConfirm(true)
  }

  if (loading) {
    return (
      <main className="shop-dashboard account-dashboard">
        <DashboardSidebar active="account" />
        <section className="dashboard-main">
          <header className="dashboard-topbar"><div><p className="dashboard-kicker">Your account</p><h1>Profile</h1></div></header>
          <div className="dashboard-content"><div className="profile-loading">Loading your profile…</div></div>
        </section>
      </main>
    )
  }

  const profile = user || localUser || {}
  const avatar = profile.picture || ''

  return (
    <main className="shop-dashboard account-dashboard">
      <DashboardSidebar active="account" />

      <section className="dashboard-main">
        <header className="dashboard-topbar profile-topbar">
          <div>
            <p className="dashboard-kicker">Your account</p>
            <h1>Profile</h1>
          </div>
          <Link to="/products" className="profile-back-shop">Back to dashboard <span>→</span></Link>
        </header>

        <div className="dashboard-content profile-content">
          <section className="profile-hero">
            <div className="profile-hero-main">
              <div className="profile-avatar-large">
                {avatar ? <img src={avatar} alt="" /> : <span>{initials(profile.name)}</span>}
              </div>
              <div>
                <p className="dashboard-kicker">Alfiya customer</p>
                <h2>{profile.name || 'Alfiya Customer'}</h2>
                <p>{profile.email || 'No email available'}</p>
                <span className="profile-member-badge">Member since {formatMemberSince(profile.createdAt)}</span>
              </div>
            </div>
            <div className="profile-hero-side">
              <span className="profile-status-dot"></span>
              <div><strong>Account active</strong><small>{profile.provider === 'google' ? 'Signed in with Google' : 'Email account'}</small></div>
            </div>
          </section>

          {feedback.message && <div className={`profile-feedback ${feedback.type}`}>{feedback.message}</div>}

          <section className="profile-stats-strip" aria-label="Account activity">
            <div className="profile-stat-card">
              <span className="profile-stat-index">01</span>
              <div><strong>{activity.orders}</strong><small>Orders placed</small></div>
              <Link to="/orders">View orders →</Link>
            </div>
            <div className="profile-stat-card profile-stat-accent">
              <span className="profile-stat-index">02</span>
              <div><strong>{activity.bookings}</strong><small>Appointments</small></div>
              <Link to="/booking">View bookings →</Link>
            </div>
            
          </section>

          <section className="profile-grid">
            <article className="profile-card profile-personal-card">
              <div className="profile-card-heading">
                <div><p className="dashboard-kicker">Personal details</p><h3>Your information</h3></div>
                {!editing && <button type="button" className="profile-edit-button" onClick={() => { setFeedback({ type: '', message: '' }); setEditing(true) }}>Edit profile</button>}
              </div>

              {editing ? (
                <form className="profile-edit-form" onSubmit={saveProfile}>
                  <label><span>Full name</span><input value={formName} onChange={(e) => setFormName(e.target.value)} maxLength="120" autoFocus /></label>
                  <label><span>Email address</span><input value={profile.email || ''} readOnly /></label>
                  <div className="profile-form-actions">
                    <button type="button" className="profile-cancel-button" onClick={() => { setFormName(profile.name || ''); setEditing(false) }}>Cancel</button>
                    <button type="submit" className="profile-save-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <span>→</span></button>
                  </div>
                </form>
              ) : (
                <div className="profile-detail-list">
                  <div><span>Full name</span><strong>{profile.name || '—'}</strong></div>
                  <div><span>Email address</span><strong>{profile.email || '—'}</strong></div>
                  <div><span>Account type</span><strong>{profile.role === 'admin' ? 'Administrator' : 'Customer'}</strong></div>
                </div>
              )}
            </article>

            <article className="profile-card profile-security-card">
              <div className="profile-card-heading">
                <div><p className="dashboard-kicker">Security</p><h3>Account access</h3></div>
              </div>
              <div className="profile-security-row">
                <div className="profile-security-icon">✓</div>
                <div><strong>{profile.provider === 'google' ? 'Google sign-in' : 'Password protected'}</strong></div>
              </div>
              {profile.provider !== 'google' && (
                <Link className="profile-security-link" to="/forgot-password">Reset your password <span>→</span></Link>
              )}
            </article>
          </section>

          

          <section className="profile-danger-zone">
            <div><p className="dashboard-kicker">Session</p><h3>Sign out of this device</h3></div>
            <button type="button" onClick={logout}>Log out <span>→</span></button>
          </section>
        </div>
      </section>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="logout-confirm-card">
            <button type="button" className="logout-confirm-close" onClick={() => setShowLogoutConfirm(false)} aria-label="Stay signed in">×</button>
            <div className="logout-girl-scene" aria-hidden="true">
              <div className="logout-girl-spark spark-one">✦</div>
              <div className="logout-girl-spark spark-two">✦</div>
              <div className="logout-girl">
                <div className="logout-girl-hair" />
                <div className="logout-girl-face">
                  <i className="logout-eye logout-eye-left" />
                  <i className="logout-eye logout-eye-right" />
                  <span className="logout-tear logout-tear-left" />
                  <span className="logout-tear logout-tear-right" />
                  <b className="logout-mouth" />
                </div>
                <div className="logout-girl-neck" />
                <div className="logout-girl-dress"><span /></div>
                <div className="logout-girl-arm logout-girl-arm-left" />
                <div className="logout-girl-arm logout-girl-arm-right" />
                <div className="logout-girl-hand logout-girl-hand-left" />
                <div className="logout-girl-hand logout-girl-hand-right" />
                <div className="logout-goodbye-hand"><span /><span /><span /><span /></div>
                <div className="logout-girl-leg logout-girl-leg-left"><span /></div>
                <div className="logout-girl-leg logout-girl-leg-right"><span /></div>
              </div>
            </div>
            <div className="logout-confirm-copy">
              <p className="dashboard-kicker">Before you go…</p>
              <h2 id="logout-confirm-title">You really want to go?</h2>
              <p>I'll miss you here. Stay with Alfiya or sign out of your account.</p>
              <div className="logout-confirm-actions">
                <button type="button" className="logout-stay-button" onClick={() => setShowLogoutConfirm(false)}>Stay in</button>
                <button type="button" className="logout-go-button" onClick={confirmLogout}>Log out <span>→</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
