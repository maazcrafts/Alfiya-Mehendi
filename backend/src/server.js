import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'alfiya-mehendi-api' }))

app.listen(port, () => console.log("Alfiya Mehendi API listening on port " + port))
