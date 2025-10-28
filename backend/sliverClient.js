// backend/sliverClient.js
// Singleton/lazy-initialized SliverClient shared across the server
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SliverClient, ParseConfigFile } from 'sliver-script'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CFG_PATH = path.resolve(__dirname, 'webui_10.1.1.55.cfg')

let client = null
let initializing = null

async function initClient() {
  const config = await ParseConfigFile(CFG_PATH)
  const c = new SliverClient(config)
  await c.connect()
  return c
}

export async function getClient() {
  // Already connected
  if (client && client.isConnected) return client

  // If initialization is in-flight, await it
  if (initializing) {
    client = await initializing
    return client
  }

  // Start initialization (ensures only one connect runs concurrently)
  initializing = (async () => {
    try {
      const c = await initClient()
      client = c
      return c
    } catch (err) {
      // Reset state on failure so future calls can retry
      initializing = null
      client = null
      throw err
    } finally {
      // Allow GC of the promise once resolved/rejected
      // Keep `client` as the live reference
      setImmediate(() => { initializing = null })
    }
  })()

  return initializing
}

export async function disconnectClient() {
  try {
    if (client && client.isConnected) {
      await client.disconnect()
    }
  } catch (_) {
    // ignore
  } finally {
    client = null
  }
}

// Graceful shutdown
// for (const evt of ['SIGINT', 'SIGTERM', 'beforeExit', 'exit']) {
//   process.on(evt, async () => {
//     await disconnectClient()
//   })
// }
