import { promisify } from 'node:util'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, KEY_LENGTH)
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash?.startsWith('scrypt$')) return false

  const [, salt, storedKey] = storedHash.split('$')
  if (!salt || !storedKey) return false

  const derivedKey = await scrypt(password, salt, KEY_LENGTH)
  const expected = Buffer.from(storedKey, 'hex')
  const actual = Buffer.from(derivedKey)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
