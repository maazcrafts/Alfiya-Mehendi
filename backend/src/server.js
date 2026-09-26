import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { checkDatabaseConnection } from './config/pool.js'
import { initializeDatabase } from './config/database.js'
import { upsertGoogleUser } from './models/userModel.js'
import { createPasswordUser, findUserByEmail } from './models/passwordAuthModel.js'
import { hashPassword, verifyPassword } from './services/passwordService.js'

const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}))
app.use(express.json())

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
    const user = await createPasswordUser({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
    })

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

    const user = await findUserByEmail(email)
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

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

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      picture: dbUser.avatar_url || '',
      role: dbUser.role,
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
