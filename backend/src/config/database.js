import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from './pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const schemaPath = path.resolve(__dirname, '../../database/schema.sql')

export async function initializeDatabase() {
  const schema = await readFile(schemaPath, 'utf8')
  await pool.query(schema)
}
