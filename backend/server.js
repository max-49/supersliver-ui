// server.js
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import crypto from 'crypto'
import * as sliver from './sliverService.js'

const app = express()

// Basic JSON response formatting
app.use(express.json())

// Simple CORS to allow Flask frontend (different port)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

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

// In-memory shell sessions for HTTP polling (no WebSockets)
// sessionId -> { sid, tunnel, buffer: Buffer, cursor: number, closed: boolean, sub }
const httpShellSessions = new Map()

// Start a new shell session (HTTP-based)
app.post('/api/sessions/:sid/shell/start', async (req, res) => {
  try {
    const sid = req.params.sid
    const { tunnel } = await sliver.openShell(sid)

    const sessionId = (crypto.randomUUID ? crypto.randomUUID() : [...Array(16)].map(() => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(''))
    const state = {
      sid,
      tunnel,
      buffer: Buffer.alloc(0),
      cursor: 0,
      closed: false,
      sub: null,
    }

    state.sub = tunnel.stdout.subscribe({
      next: (buf) => {
        try {
          state.buffer = Buffer.concat([state.buffer, Buffer.from(buf)])
        } catch (_) {}
      },
      error: (_) => {
        state.closed = true
      },
      complete: () => {
        state.closed = true
      }
    })

    httpShellSessions.set(sessionId, state)
    res.json({ sessionId })
  } catch (err) {
    console.error('POST /api/sessions/:sid/shell/start failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Send input to shell
app.post('/api/sessions/:sid/shell/input', async (req, res) => {
  try {
    const sid = req.params.sid
    const { sessionId, data } = req.body || {}
    if (!sessionId || typeof data !== 'string') {
      return res.status(400).json({ error: 'Expected { sessionId, data }' })
    }
    const state = httpShellSessions.get(sessionId)
    if (!state || state.sid !== sid) return res.status(404).json({ error: 'Shell session not found' })
    if (state.closed) return res.status(410).json({ error: 'Shell session closed' })
    state.tunnel.stdin.next(Buffer.from(data, 'utf8'))
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/sessions/:sid/shell/input failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Read output since cursor
app.get('/api/sessions/:sid/shell/output', async (req, res) => {
  try {
    const sid = req.params.sid
    const sessionId = req.query.sessionId
    const cursor = Number(req.query.cursor || 0)
    const state = httpShellSessions.get(sessionId)
    if (!state || state.sid !== sid) return res.status(404).json({ error: 'Shell session not found' })

    const total = state.buffer.length
    const start = Math.min(Math.max(0, cursor), total)
    const chunk = state.buffer.subarray(start)
    const nextCursor = total

    res.json({
      data: chunk.toString('base64'),
      encoding: 'base64',
      nextCursor,
      closed: state.closed,
    })
  } catch (err) {
    console.error('GET /api/sessions/:sid/shell/output failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Close shell session
app.post('/api/sessions/:sid/shell/close', async (req, res) => {
  try {
    const sid = req.params.sid
    const { sessionId } = req.body || {}
    const state = httpShellSessions.get(sessionId)
    if (!state || state.sid !== sid) return res.status(404).json({ error: 'Shell session not found' })
    try { state.sub?.unsubscribe() } catch (_) {}
    try { state.tunnel.stdin.complete() } catch (_) {}
    state.closed = true
    httpShellSessions.delete(sessionId)
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /api/sessions/:sid/shell/close failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Create HTTP server to attach WebSocket (kept for backwards compatibility)
const server = http.createServer(app)

// WebSocket remains available but frontend will use HTTP polling instead
const wss = new WebSocketServer({ server, path: '/ws/shell' })

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, 'http://localhost:3000')
    const sid = url.searchParams.get('sid')
    if (!sid) {
      ws.close(1008, 'Missing sid')
      return
    }

    const { tunnel } = await sliver.openShell(sid)

    const sub = tunnel.stdout.subscribe({
      next: (buf) => { try { ws.send(buf) } catch (_) {} },
      error: (err) => { try { ws.close(1011, String(err)) } catch (_) {} },
      complete: () => { try { ws.close(1000, 'Shell closed') } catch (_) {} }
    })

    ws.on('message', (data) => {
      try { tunnel.stdin.next(Buffer.isBuffer(data) ? data : Buffer.from(data)) } catch (_) {}
    })
    ws.on('close', () => { try { sub.unsubscribe() } catch (_) {}; try { tunnel.stdin.complete() } catch (_) {} })
  } catch (err) {
    try { ws.close(1011, String(err)) } catch (_) {}
  }
})

// Bulk exec: run single command across multiple sessions
app.post('/api/sessions/exec-bulk', async (req, res) => {
  try {
    const { cmd, sessionIds } = req.body || {}
    if (!cmd || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ error: 'Expected body { cmd: string, sessionIds: string[] }' })
    }
    const tasks = sessionIds.map(async (sid) => {
      try {
        const result = await sliver.execCmd(sid, cmd)
        return { sid, success: true, exitCode: result.exitCode }
      } catch (e) {
        return { sid, success: false, error: String(e) }
      }
    })
    const results = await Promise.all(tasks)
    res.json({ results })
  } catch (err) {
    console.error('POST /api/sessions/exec-bulk failed', err)
    res.status(500).json({ error: String(err) })
  }
})

// Start server
server.listen(3000, () => {
  console.log(`✅ Server running at http://localhost:3000`)
})