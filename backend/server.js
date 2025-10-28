// server.js
import express from 'express'
import * as sliver from './sliverService.js'

const app = express()

// Basic JSON response formatting
app.use(express.json())

// Health check
app.get('/health', async (req, res) => {
  try {
    const version = await sliver.getVersion(10)
    res.json({ ok: true, version })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
})

// Sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await sliver.listSessions()
    res.json(sessions ?? [])
  } catch (err) {
    console.error('GET /api/sessions failed', err)
    res.status(500).json({ error: String(err) })
  }
})

app.post('/api/sessions/:sid/exec', async (req, res) => {
  try {
    const sid = req.params.sid
    // Accept command from body or query (body is preferred for complex commands)
    const cmd = req.body.cmd || req.query.cmd
    
    if (!cmd) {
      return res.status(400).json({ error: 'Missing "cmd" in request body or query' })
    }
    
    const result = await sliver.execCmd(sid, cmd)
    res.json(result ?? { ok: true })
  } catch (err) {
    console.error('POST /api/sessions/:sid/exec failed', err)
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/sessions/:sid/info', async (req, res) => {
  try {
    const sid = req.params.sid
    const result = await sliver.getSessionInfo(sid)
    res.json(result ?? { ok: true })
  } catch (err) {
    console.error('GET /api/sessions/:sid/info failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await sliver.listJobs()
    res.json(jobs ?? [])
  } catch (err) {
    console.error('GET /api/jobs failed', err)
    res.status(500).json({ error: String(err) })
  }
})

app.post('/api/jobs/:id/kill', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid job id' })
    const result = await sliver.killJob(id)
    res.json(result ?? { ok: true })
  } catch (err) {
    console.error('POST /api/jobs/:id/kill failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Root route
app.get('/', (req, res) => {
  res.send('Sliver Node.js server is running.')
})

// Start server
app.listen(3000, () => {
  console.log(`✅ Server running at http://localhost:3000`)
})