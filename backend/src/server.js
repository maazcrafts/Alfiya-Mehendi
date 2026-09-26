import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { checkDatabaseConnection } from './config/pool.js'
import { initializeDatabase } from './config/database.js'
import { upsertGoogleUser } from './models/userModel.js'

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
