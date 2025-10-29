// backend/sliverService.js
// Reusable functions that operate on the shared SliverClient
import { getClient } from './sliverClient.js'

export async function listSessions(timeout) {
  const client = await getClient()
  return client.sessions(timeout)
}

export async function getVersion(timeout) {
  const client = await getClient()
  return client.getVersion(timeout)
}

export async function listJobs(timeout) {
  const client = await getClient()
  return client.jobs(timeout)
}

export async function killJob(jobId, timeout) {
  const client = await getClient()
  return client.killJob(jobId, timeout)
}

export async function execCmd(sid, cmd, timeout) {
  const client = await getClient()
  
  // Get session info to determine OS
  const sessions = await client.sessions()
  const session = sessions?.find(s => s.ID === sid)
  
  if (!session) {
    throw new Error(`Session ${sid} not found`)
  }
  
  const interactive = await client.interactSession(sid)
  
  // Determine shell based on OS
  let shell, shellArgs
  const os = session.OS?.toLowerCase() || ''
  
  if (os.includes('windows')) {
    // Windows target: use cmd.exe
    shell = 'cmd.exe'
    shellArgs = ['/c', cmd]
  } else {
    // Linux/macOS/BSD target: use /bin/sh
    shell = '/bin/sh'
    shellArgs = ['-c', cmd]
  }
  
  const result = await interactive.execute(shell, shellArgs, true, timeout)
  
  // Extract and decode the output from the protobuf response
  return {
    stdout: result?.Stdout ? Buffer.from(result.Stdout).toString('utf8') : '',
    stderr: result?.Stderr ? Buffer.from(result.Stderr).toString('utf8') : '',
    exitCode: result?.Status ?? null,
    pid: result?.Pid ?? null,
  }
}

export async function getSessionInfo(sid, timeout) {
    const client = await getClient()
  
    // Get session info to determine OS
    const sessions = await client.sessions()
    const session = sessions?.find(s => s.ID === sid)
    
    if (!session) {
        throw new Error(`Session ${sid} not found`)
    }

    const hostname_info = await execCmd(sid, "hostname -f")
    const client_hostname = hostname_info["stdout"]

    return {
        name: session.Name,
        sid: session.ID,
        hostname: client_hostname,
        os: session.OS,
        arch: session.Arch
    }
}
