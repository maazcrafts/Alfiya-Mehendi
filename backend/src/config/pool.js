import pg from 'pg'

const { Pool } = pg
const isProduction = process.env.NODE_ENV === 'production'

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
}

if (isProduction) poolConfig.ssl = { rejectUnauthorized: false }

export const pool = new Pool(poolConfig)

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function checkDatabaseConnection() {
  const result = await pool.query('SELECT NOW() AS now')
  return result.rows[0]
}
