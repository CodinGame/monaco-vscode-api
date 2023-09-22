import './server-assets'
import type { IServerAPI } from 'vs/server/node/remoteExtensionHostAgentServer'
import { createServer } from 'vs/server/node/server.main.js'
import { buildHelpMessage, buildVersionMessage, parseArgs } from 'vs/platform/environment/node/argv'
import { ServerParsedArgs, serverOptions } from 'vs/server/node/serverEnvironmentService'
import product from 'vs/platform/product/common/product'
import { AddressInfo, ListenOptions, Socket } from 'net'
import http from 'http'

export async function start (options: ListenOptions): Promise<void> {
  let _remoteExtensionHostAgentServer: IServerAPI | null = null
  let _remoteExtensionHostAgentServerPromise: Promise<IServerAPI> | null = null
  const getRemoteExtensionHostAgentServer = (): Promise<IServerAPI> => {
    if (_remoteExtensionHostAgentServerPromise == null) {
      _remoteExtensionHostAgentServerPromise = createServer(address).then(server => {
        _remoteExtensionHostAgentServer = server
        return server
      })
    }
    return _remoteExtensionHostAgentServerPromise
  }

  let address: AddressInfo | string | null = null
  const server = http.createServer(async (req, res) => {
    const remoteExtensionHostAgentServer = await getRemoteExtensionHostAgentServer()
    return remoteExtensionHostAgentServer.handleRequest(req, res)
  })
  server.on('upgrade', async (req, socket) => {
    const remoteExtensionHostAgentServer = await getRemoteExtensionHostAgentServer()
    return remoteExtensionHostAgentServer.handleUpgrade(req, <Socket>socket)
  })
  server.on('error', async (err) => {
    const remoteExtensionHostAgentServer = await getRemoteExtensionHostAgentServer()
    return remoteExtensionHostAgentServer.handleServerError(err)
  })

  server.listen(options, async () => {
    address = server.address()
    if (address === null) {
      throw new Error('Unexpected server address')
    }

    // eslint-disable-next-line no-console
    console.log(`Server bound to ${typeof address === 'string' ? address : `${address.address}:${address.port} (${address.family})`}`)

    await getRemoteExtensionHostAgentServer()
  })

  process.on('exit', () => {
    server.close()
    if (_remoteExtensionHostAgentServer != null) {
      _remoteExtensionHostAgentServer.dispose()
    }
  })
}

function parseRange (strRange: string) {
  const match = strRange.match(/^(\d+)-(\d+)$/)
  if (match != null) {
    const start = parseInt(match[1]!, 10); const end = parseInt(match[2]!, 10)
    if (start > 0 && start <= end && end <= 65535) {
      return { start, end }
    }
  }
  return undefined
}

async function findFreePort (host: string, start: number, end: number) {
  const testPort = (port: number) => {
    return new Promise<boolean>((resolve) => {
      const server = http.createServer()
      server.listen(port, host, () => {
        server.close()
        resolve(true)
      }).on('error', () => {
        resolve(false)
      })
    })
  }
  for (let port = start; port <= end; port++) {
    if (await testPort(port)) {
      return port
    }
  }
  return undefined
}

async function parsePort (host: string, strPort: string | undefined) {
  if (strPort != null) {
    let range
    if (strPort.match(/^\d+$/) != null) {
      return parseInt(strPort, 10)
    } else if ((range = parseRange(strPort)) != null) {
      const port = await findFreePort(host, range.start, range.end)
      if (port !== undefined) {
        return port
      }
      // Remote-SSH extension relies on this exact port error message, treat as an API
      console.warn(`--port: Could not find free port in range: ${range.start} - ${range.end} (inclusive).`)
      process.exit(1)
    } else {
      console.warn(`--port "${strPort}" is not a valid number or range. Ranges must be in the form 'from-to' with 'from' an integer larger than 0 and not larger than 'end'.`)
      process.exit(1)
    }
  }
  return 8000
}

const parsedArgs = parseArgs<ServerParsedArgs>(process.argv.slice(2), serverOptions)
if (parsedArgs.help) {
  const serverOptionsWithoutExtensionManagement = Object.fromEntries(Object.entries(serverOptions).filter(([, def]) => def.cat !== 'e'))
  // eslint-disable-next-line no-console
  console.log(buildHelpMessage(product.nameLong, 'vscode-ext-host-server', product.version, serverOptionsWithoutExtensionManagement, { noInputFiles: true, noPipe: true }))
} else if (parsedArgs.version) {
  // eslint-disable-next-line no-console
  console.log(buildVersionMessage(product.version, product.commit))
} else {
  const host = parsedArgs.host ?? 'localhost'

  const nodeListenOptions = (
    parsedArgs['socket-path'] != null
      ? { path: parsedArgs['socket-path'] }
      : { host, port: await parsePort(host, parsedArgs.port) }
  )

  void start(nodeListenOptions)
}
