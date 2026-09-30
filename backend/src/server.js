import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { checkDatabaseConnection, query } from './config/pool.js'
import { initializeDatabase } from './config/database.js'
import { upsertGoogleUser } from './models/userModel.js'
import { createPasswordUser, findUserByEmail } from './models/passwordAuthModel.js'
import { hashPassword, verifyPassword } from './services/passwordService.js'
import { createPasswordResetOtp, getPasswordResetOtpConfig, verifyPasswordResetOtp, resetPasswordWithVerifiedToken } from './services/passwordResetService.js'
import { isPasswordResetEmailConfigured, sendPasswordResetOtp } from './services/emailService.js'
import { applySecurityMiddleware, apiRateLimiter, authRateLimiter, recoveryRateLimiter } from './middleware/securityMiddleware.js'
import serviceRoutes from './routes/serviceRoutes.js'
import productRoutes from './routes/productRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import supportRoutes from './routes/supportRoutes.js'
import userRoutes from './routes/userRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
const port = process.env.PORT || 5000

if (process.env.NODE_ENV === 'production') {
  // Render sits behind a reverse proxy. This makes req.ip represent the client
  // IP so rate limiting is effective instead of limiting Render's proxy IP.
  app.set('trust proxy', 1)
}

applySecurityMiddleware(app)

async function applyConfiguredAdminRole(user) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail || user.email?.trim().toLowerCase() !== adminEmail) return user

  const result = await query(
    `UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1 RETURNING id, name, email, avatar_url, role`,
    [user.id],
  )
  return result.rows[0] || user
}

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
}

const nativeOrigins = new Set(['https://localhost', 'capacitor://localhost'])

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, '')
    const isAllowed =
      !normalizedOrigin ||
      allowedOrigins.includes(normalizedOrigin) ||
      nativeOrigins.has(normalizedOrigin)

    if (isAllowed) {
      return callback(null, true)
    }

    console.warn('Blocked CORS origin:', normalizedOrigin)
    return callback(new Error('CORS origin not allowed'))
  },
  credentials: false,
}))

// Keep request bodies deliberately small. The API currently accepts JSON only.
app.use(express.json({ limit: '100kb' }))
app.use('/api', apiRateLimiter)
app.use('/api/products', productRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', async (_req, res) => {
  try {
    const database = await checkDatabaseConnection()
    return res.json({
      ok: true,
      service: 'alfiya-mehendi-api',
      database: 'connected',
      databaseTime: database.now,
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return res.status(503).json({
      ok: false,
      service: 'alfiya-mehendi-api',
      database: 'disconnected',
    })
  }
})

app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' })
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Please enter your full name.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' })
    }

    const passwordHash = await hashPassword(password)
    let user = await createPasswordUser({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
    })
    user = await applyConfiguredAdminRole(user)

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, provider: 'password' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.avatar_url || '',
        role: user.role,
        provider: 'password',
      },
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' })
    }
    console.error('Signup error:', error)
    return res.status(500).json({ message: 'Unable to create your account right now.' })
  }
})

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    let user = await findUserByEmail(email)
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    user = await applyConfiguredAdminRole(user)

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, provider: 'password' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.avatar_url || '',
        role: user.role,
        provider: 'password',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Unable to log in right now.' })
  }
})

app.post('/api/auth/forgot-password', recoveryRateLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email address is required.' })

    if (!isPasswordResetEmailConfigured()) {
      return res.status(503).json({ message: 'Password recovery email is not configured on the server yet.' })
    }

    const reset = await createPasswordResetOtp(email)
    const genericMessage = 'If an account exists for that email, a 6-digit verification code has been sent.'

    if (!reset) return res.json({ message: genericMessage })

    if (reset.throttled) {
      return res.status(429).json({
        message: 'A verification code was sent recently. Please wait before requesting another code.',
        retryAfterSeconds: reset.retryAfterSeconds,
      })
    }

    try {
      await sendPasswordResetOtp({ to: reset.email, otp: reset.otp, expiryMinutes: reset.expiryMinutes })
    } catch (error) {
      console.error('Password reset email delivery error:', error)
      return res.status(503).json({ message: 'We could not send the verification code right now. Please try again shortly.' })
    }

    return res.json({
      message: genericMessage,
      expiresInMinutes: reset.expiryMinutes,
      resendCooldownSeconds: getPasswordResetOtpConfig().resendCooldownSeconds,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({ message: 'Unable to process the password reset request.' })
  }
})

app.post('/api/auth/verify-reset-otp', recoveryRateLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const otp = String(req.body?.otp || '').trim()
    if (!email || !otp) return res.status(400).json({ message: 'Email and verification code are required.' })

    const result = await verifyPasswordResetOtp(email, otp)

    if (result.kind === 'locked') {
      return res.status(429).json({ message: 'Too many incorrect verification attempts. Please request a new code.' })
    }

    if (result.kind !== 'verified') {
      return res.status(400).json({
        message: result.attemptsRemaining
          ? `Incorrect verification code. ${result.attemptsRemaining} attempt(s) remaining.`
          : 'The verification code is invalid or expired.',
      })
    }

    return res.json({
      message: 'Verification code accepted.',
      resetToken: result.resetToken,
      expiresInMinutes: result.expiresInMinutes,
    })
  } catch (error) {
    console.error('Verify reset OTP error:', error)
    return res.status(500).json({ message: 'Unable to verify the code right now.' })
  }
})

app.post('/api/auth/reset-password', recoveryRateLimiter, async (req, res) => {
  try {
    const resetToken = String(req.body?.resetToken || '').trim()
    const password = String(req.body?.password || '')

    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Verification and a new password are required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const passwordHash = await hashPassword(password)
    const updated = await resetPasswordWithVerifiedToken(resetToken, passwordHash)
    if (!updated) {
      return res.status(400).json({ message: 'Your password reset session is invalid or expired. Please start again.' })
    }

    return res.json({ message: 'Password updated successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ message: 'Unable to reset the password right now.' })
  }
})
app.post('/api/auth/google', authRateLimiter, async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required.' })
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Google authentication is not configured on the server.' })
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const client = new OAuth2Client(googleClientId)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })

    const payload = ticket.getPayload()

    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ message: 'Invalid Google account information.' })
    }

    const dbUser = await upsertGoogleUser({
      googleId: payload.sub,
      name: payload.name || '',
      email: payload.email,
      avatarUrl: payload.picture || '',
    })

    const adminUser = await applyConfiguredAdminRole(dbUser)
    const user = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      picture: adminUser.avatar_url || '',
      role: adminUser.role,
      provider: 'google',
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, provider: user.provider },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({ token, user })
  } catch (error) {
    console.error('Google authentication error:', error)
    return res.status(401).json({ message: 'Google authentication failed.' })
  }
})

app.use('/api', (_req, res) => {
  return res.status(404).json({ message: 'API route not found.' })
})

async function startServer() {
  try {
    const requiredProductionEnv = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL']
    if (process.env.NODE_ENV === 'production') {
      const missing = requiredProductionEnv.filter((name) => !process.env[name]?.trim())
      if (missing.length) {
        throw new Error('Missing required production environment variables: ' + missing.join(', '))
      }
      if (process.env.JWT_SECRET.trim().length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production.')
      }
    } else if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.')
    }

    await checkDatabaseConnection()
    await initializeDatabase()
    console.log('PostgreSQL connected and schema initialized.')

    app.listen(port, () => console.log('Alfiya Mehendi API listening on port ' + port))
  } catch (error) {
    console.error('Unable to start Alfiya Mehendi API:', error)
    process.exit(1)
  }
}

startServer()
