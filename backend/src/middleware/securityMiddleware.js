import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

const fifteenMinutes = 15 * 60 * 1000

export const apiRateLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
})

export const authRateLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})

export const recoveryRateLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many password recovery attempts. Please try again later.' },
})

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(expressJsonLimit())
}

function expressJsonLimit() {
  return (req, res, next) => {
    // This is intentionally applied through Express' built-in parser by server.js.
    // Kept as a named hook so security middleware stays centralized.
    next()
  }
}
