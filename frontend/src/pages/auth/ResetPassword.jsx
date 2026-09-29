import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import '../../styles/auth-recovery.css'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const OTP_LENGTH = 6
const DEFAULT_RESEND_COOLDOWN = 60

function maskEmail(email) {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return email
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2)
  return visible + '•••@' + domain
}

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = useMemo(() => params.get('email')?.trim().toLowerCase() || '', [params])
  const [step, setStep] = useState('otp')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  async function verifyOtp(event) {
    event.preventDefault()
    const cleanOtp = otp.replace(/\D/g, '')
    if (cleanOtp.length !== OTP_LENGTH) {
      setError('Enter the complete 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(apiBase + '/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: cleanOtp }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Unable to verify the code.')

      setResetToken(data.resetToken || '')
      setStep('password')
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    if (resendCooldown > 0 || loading) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(apiBase + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (data.retryAfterSeconds) setResendCooldown(Number(data.retryAfterSeconds))
        throw new Error(data.message || 'Unable to resend the code.')
      }

      setOtp('')
      setResendCooldown(Number(data.resendCooldownSeconds || DEFAULT_RESEND_COOLDOWN))
      setMessage(data.message || 'A new verification code has been sent.')
    } catch (err) {
      setError(err.message || 'Unable to resend the code.')
    } finally {
      setLoading(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!resetToken) {
      setError('Your verification session is missing. Please start again.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(apiBase + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Unable to reset your password.')

      setMessage(data.message || 'Password updated successfully.')
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.message || 'Unable to reset your password.')
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <main className="signup-page auth-split-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />
          <div className="story-content">
            <p className="story-eyebrow">{step === 'otp' ? 'Verify your email' : 'Secure recovery'}</p>
            <h1>{step === 'otp' ? <>Check your<br />Gmail inbox.</> : <>Create a<br />new password.</>}</h1>
            <p className="story-description">
              {step === 'otp'
                ? 'Enter the six-digit code we sent to your registered email address.'
                : 'Your email has been verified. Choose a new password for your Alfiya account.'}
            </p>
          </div>
        </div>

        <div className="signup-form-panel login-form-panel">
          <div className="signup-form-inner login-form-inner">
            {step === 'otp' ? (
              <>
                <p className="form-eyebrow">Step 1 of 2</p>
                <h2>Verify code.</h2>
                <p className="form-intro">We sent a 6-digit code to <strong>{maskEmail(email)}</strong>.</p>

                <form className="signup-form" onSubmit={verifyOtp}>
                  <label className="input-group">
                    <span>Verification code</span>
                    <div className="input-shell otp-input-shell">
                      <input
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={OTP_LENGTH}
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                        autoComplete="one-time-code"
                        autoFocus
                        aria-label="6-digit verification code"
                      />
                    </div>
                  </label>

                  <button type="submit" className="signup-submit" disabled={loading || otp.length !== OTP_LENGTH}>
                    <span>{loading ? 'Verifying…' : 'Verify code'}</span>
                  </button>
                </form>

                {message && <p className="auth-form-success" role="status">{message}</p>}
                {error && <p className="auth-form-error" role="alert">{error}</p>}

                <div className="recovery-meta">
                  <button type="button" className="recovery-link-button" onClick={resendOtp} disabled={loading || resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                  </button>
                  <Link to="/forgot-password" className="recovery-secondary-link">Use a different email</Link>
                </div>
              </>
            ) : (
              <>
                <p className="form-eyebrow">Step 2 of 2</p>
                <h2>New password.</h2>
                <p className="form-intro">Create a new password for <strong>{maskEmail(email)}</strong>.</p>

                <form className="signup-form" onSubmit={savePassword}>
                  <label className="input-group">
                    <span>New Password</span>
                    <div className="input-shell">
                      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
                    </div>
                  </label>
                  <label className="input-group">
                    <span>Confirm Password</span>
                    <div className="input-shell">
                      <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
                    </div>
                  </label>
                  <button type="submit" className="signup-submit" disabled={loading}>
                    <span>{loading ? 'Saving…' : 'Save new password'}</span>
                  </button>
                </form>

                {message && <p className="auth-form-success" role="status">{message}</p>}
                {error && <p className="auth-form-error" role="alert">{error}</p>}

                <div className="recovery-meta">
                  <button type="button" className="recovery-link-button" onClick={() => { setStep('otp'); setResetToken(''); setMessage(''); setError('') }} disabled={loading}>
                    ← Back to verification
                  </button>
                  <Link to="/login" className="recovery-secondary-link">Back to Login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
