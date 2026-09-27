import jwt from 'jsonwebtoken'
import { query } from '../config/pool.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' })
  }
}

export async function requireAdmin(req, res, next) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const authenticatedEmail = req.auth?.email?.trim().toLowerCase()
  const userId = req.auth?.userId || req.auth?.sub

  if (!configuredEmail || !authenticatedEmail || authenticatedEmail !== configuredEmail || !userId) {
    return res.status(403).json({ message: 'Administrator access required.' })
  }

  try {
    // Do not trust the role embedded in an old JWT. The database is authoritative.
    // This also lets an already-issued token work after ADMIN_EMAIL/role changes.
    const result = await query(
      'SELECT id, email, role FROM users WHERE id = $1 LIMIT 1',
      [userId],
    )
    const user = result.rows[0]

    if (!user || user.email.trim().toLowerCase() !== configuredEmail) {
      return res.status(403).json({ message: 'Administrator access required.' })
    }

    // Keep the single configured admin account in sync with ADMIN_EMAIL.
    if (user.role !== 'admin') {
      const promoted = await query(
        `UPDATE users
         SET role = 'admin', updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, role`,
        [userId],
      )
      if (!promoted.rows[0]) {
        return res.status(403).json({ message: 'Administrator access required.' })
      }
    }

    req.auth.role = 'admin'
    return next()
  } catch (error) {
    console.error('Admin authorization check failed:', error)
    return res.status(500).json({ message: 'Unable to verify administrator access.' })
  }
}
