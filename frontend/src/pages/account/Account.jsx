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

  const token = localStorage.getItem('alfiya_auth_token') || ''
  const localUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('alfiya_user') || 'null') } catch { return null }
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
        localStorage.setItem('alfiya_user', JSON.stringify({
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
      localStorage.setItem('alfiya_user', JSON.stringify({
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

  function logout() {
    localStorage.removeItem('alfiya_auth_token')
    localStorage.removeItem('alfiya_user')
    localStorage.removeItem('alfiya_remember_me')
    navigate('/login', { replace: true })
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
                <div><strong>{profile.provider === 'google' ? 'Google sign-in' : 'Password protected'}</strong><p>Your account is authenticated securely.</p></div>
              </div>
              {profile.provider !== 'google' && (
                <Link className="profile-security-link" to="/forgot-password">Reset your password <span>→</span></Link>
              )}
            </article>
          </section>

          <section className="profile-quick-section">
            <div className="profile-section-heading">
              <div><p className="dashboard-kicker">Your activity</p><h2>Keep everything in one place.</h2></div>
              <p>Jump back into the parts of Alfiya you use most.</p>
            </div>
            <div className="profile-quick-grid">
              <Link to="/orders" className="profile-quick-card"><span>01</span><div><strong>My Orders</strong><p>Track your product purchases and order status.</p></div><b>→</b></Link>
              <Link to="/booking" className="profile-quick-card"><span>02</span><div><strong>My Bookings</strong><p>Review appointments and booking requests.</p></div><b>→</b></Link>
              <Link to="/cart" className="profile-quick-card"><span>03</span><div><strong>My Cart</strong><p>Continue with the products you selected.</p></div><b>→</b></Link>
              <Link to="/contact" className="profile-quick-card"><span>04</span><div><strong>Help & Contact</strong><p>Find answers or email the Alfiya team.</p></div><b>→</b></Link>
            </div>
          </section>

          <section className="profile-danger-zone">
            <div><p className="dashboard-kicker">Session</p><h3>Sign out of this device</h3><p>You can sign back in anytime with your account credentials.</p></div>
            <button type="button" onClick={logout}>Log out <span>→</span></button>
          </section>
        </div>
      </section>
    </main>
  )
}
