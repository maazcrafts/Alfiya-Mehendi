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
import { createPasswordResetToken, resetPasswordWithToken } from './services/passwordResetService.js'
import serviceRoutes from './routes/serviceRoutes.js'
import productRoutes from './routes/productRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import supportRoutes from './routes/supportRoutes.js'
import userRoutes from './routes/userRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

const app = express()
const port = process.env.PORT || 5000

async function applyConfiguredAdminRole(user) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail || user.email?.trim().toLowerCase() !== adminEmail) return user

  const result = await query(
    `UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1 RETURNING id, name, email, avatar_url, role`,
    [user.id],
  )
  return result.rows[0] || user
}

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}))
app.use(express.json())
app.use('/api/products', productRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/payments', paymentRoutes)

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

app.post('/api/auth/signup', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email address is required.' })
    }

    const reset = await createPasswordResetToken(email.trim())
    const genericMessage = 'If an account exists for that email, a password reset link has been generated.'

    if (!reset) {
      return res.json({ message: genericMessage })
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${reset.token}`
    console.log('Password reset link generated:', resetUrl)

    const response = { message: genericMessage }
    if (process.env.NODE_ENV !== 'production') {
      response.resetUrl = resetUrl
    }
    return res.json(response)
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({ message: 'Unable to process the password reset request.' })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const passwordHash = await hashPassword(password)
    const updated = await resetPasswordWithToken(token, passwordHash)
    if (!updated) {
      return res.status(400).json({ message: 'This reset link is invalid or expired.' })
    }

    return res.json({ message: 'Password updated successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ message: 'Unable to reset the password right now.' })
  }
})

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required.' })
    }

    if (!(process.env.GOOGLE_CLIENT_ID || "37574893420-so4mu6u3uuunkil58nek24nardjm46q4.apps.googleusercontent.com") || !process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Google authentication is not configured on the server.' })
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || "37574893420-so4mu6u3uuunkil58nek24nardjm46q4.apps.googleusercontent.com"
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
    if (!process.env.DATABASE_URL) {
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
