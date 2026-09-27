import jwt from 'jsonwebtoken'

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

export function requireAdmin(req, res, next) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const authenticatedEmail = req.auth?.email?.trim().toLowerCase()

  if (!configuredEmail || req.auth?.role !== 'admin' || authenticatedEmail !== configuredEmail) {
    return res.status(403).json({ message: 'Administrator access required.' })
  }

  return next()
}
