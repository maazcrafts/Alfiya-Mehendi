import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../../styles/auth-recovery.css'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(apiBase + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Unable to send a verification code.')
      navigate('/reset-password?email=' + encodeURIComponent(normalizedEmail))
    } catch (err) {
      setError(err.message || 'Unable to send a verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="signup-page auth-split-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />
          <div className="story-content">
            <p className="story-eyebrow">Account recovery</p>
            <h1>Return to your<br />Alfiya account.</h1>
            <p className="story-description">We’ll send a six-digit verification code to your registered email address.</p>
          </div>
        </div>
        <div className="signup-form-panel login-form-panel">
          <div className="signup-form-inner login-form-inner">
            <p className="form-eyebrow">Forgot password</p>
            <h2>Reset access.</h2>
            <p className="form-intro">Enter the email linked to your Alfiya Mehendi account.</p>
            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="input-group">
                <span>Email Address</span>
                <div className="input-shell">
                  <input type="email" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                </div>
              </label>
              <button type="submit" className="signup-submit" disabled={loading}>
                <span>{loading ? 'Sending code…' : 'Send verification code'}</span>
              </button>
            </form>
            {error && <p className="auth-form-error" role="alert">{error}</p>}
            <p className="login-prompt"><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </section>
    </main>
  )
}
