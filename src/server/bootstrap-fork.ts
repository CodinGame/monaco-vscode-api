import { createRequire } from 'node:module'

const entrypoints: Record<string, () => Promise<void>> = {
  'vs/workbench/api/node/extensionHostProcess': async () => { await import('vs/workbench/api/node/extensionHostProcess') },
  'vs/platform/files/node/watcher/watcherMain': async () => { await import('vs/platform/files/node/watcher/watcherMain') },
  'vs/platform/terminal/node/ptyHostMain': async () => { await import('vs/platform/terminal/node/ptyHostMain') },
  'vs/workbench/contrib/debug/node/telemetryApp': async () => { await import('vs/workbench/contrib/debug/node/telemetryApp') }
}

const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any)._VSCODE_NODE_MODULES = new Proxy(Object.create(null), { get: (_target, mod) => require(String(mod)) })

// Configure: pipe logging to parent process
if (!(process.send == null) && process.env.VSCODE_PIPE_LOGGING === 'true') {
  pipeLoggingToParent()
}

// Handle Exceptions
if (process.env.VSCODE_HANDLES_UNCAUGHT_ERRORS == null) {
  handleExceptions()
}

// Terminate when parent terminates
if (process.env.VSCODE_PARENT_PID != null) {
  terminateWhenParentTerminates()
}

void entrypoints[process.env.VSCODE_AMD_ENTRYPOINT as string]!()

function pipeLoggingToParent () {
  const MAX_STREAM_BUFFER_LENGTH = 1024 * 1024
  const MAX_LENGTH = 100000

  /**
   * Prevent circular stringify and convert arguments to real array
   */
  function safeToArray (args: ArrayLike<unknown>) {
    const seen: unknown[] = []
    const argsArray = []

    // Massage some arguments with special treatment
    if (args.length > 0) {
      for (let i = 0; i < args.length; i++) {
        let arg = args[i]

        // Any argument of type 'undefined' needs to be specially treated because
        // JSON.stringify will simply ignore those. We replace them with the string
        // 'undefined' which is not 100% right, but good enough to be logged to console
        if (typeof arg === 'undefined') {
          arg = 'undefined'
        } else if (arg instanceof Error) {
          // Any argument that is an Error will be changed to be just the error stack/message
          // itself because currently cannot serialize the error over entirely.
          const errorObj = arg
          if (errorObj.stack != null) {
            arg = errorObj.stack
          } else {
            arg = errorObj.toString()
          }
        }

        argsArray.push(arg)
      }
    }

    try {
      const res = JSON.stringify(argsArray, function (key, value) {
        // Objects get special treatment to prevent circles
        if (isObject(value) || Array.isArray(value)) {
          if (seen.indexOf(value) !== -1) {
            return '[Circular]'
          }

          seen.push(value)
        }

        return value
      })

      if (res.length > MAX_LENGTH) {
        return 'Output omitted for a large object that exceeds the limits'
      }

      return res
    } catch (error) {
      return `Output omitted for an object that cannot be inspected ('${(error as Error).toString()}')`
    }
  }

  function safeSend (arg: { type: string, severity: string, arguments: string }) {
    try {
      if (process.send != null) {
        process.send(arg)
      }
    } catch (error) {
      // Can happen if the parent channel is closed meanwhile
    }
  }

  function isObject (obj: unknown) {
    return typeof obj === 'object' &&
      obj !== null &&
      !Array.isArray(obj) &&
      !(obj instanceof RegExp) &&
      !(obj instanceof Date)
  }

  function safeSendConsoleMessage (severity: 'log' | 'warn' | 'error', args: string) {
    safeSend({ type: '__$console', severity, arguments: args })
  }

  /**
   * Wraps a console message so that it is transmitted to the renderer.
   *
   * The wrapped property is not defined with `writable: false` to avoid
   * throwing errors, but rather a no-op setting. See https://github.com/microsoft/vscode-extension-telemetry/issues/88
   */
  function wrapConsoleMethod (method: 'log' | 'info' | 'warn' | 'error', severity: 'log' | 'warn' | 'error') {
    Object.defineProperty(console, method, {
      set: () => { },
      get: () => function () { safeSendConsoleMessage(severity, safeToArray(arguments)) }
    })
  }

  /**
   * Wraps process.stderr/stdout.write() so that it is transmitted to the
   * renderer or CLI. It both calls through to the original method as well
   * as to console.log with complete lines so that they're made available
   * to the debugger/CLI.
   */
  function wrapStream (streamName: 'stdout' | 'stderr', severity: 'log' | 'warn' | 'error') {
    const stream = process[streamName]
    const original = stream.write

    /** @type string */
    let buf = ''

    Object.defineProperty(stream, 'write', {
      set: () => { },
      // eslint-disable-next-line no-undef
      get: () => (chunk: Uint8Array | string, encoding: BufferEncoding, callback: (err?: Error) => void) => {
        buf += chunk.toString()
        const eol = buf.length > MAX_STREAM_BUFFER_LENGTH ? buf.length : buf.lastIndexOf('\n')
        if (eol !== -1) {
          // eslint-disable-next-line no-console
          console[severity](buf.slice(0, eol))
          buf = buf.slice(eol + 1)
        }

        original.call(stream, chunk, encoding, callback)
      }
    })
  }

  // Pass console logging to the outside so that we have it in the main side if told so
  if (process.env.VSCODE_VERBOSE_LOGGING === 'true') {
    wrapConsoleMethod('info', 'log')
    wrapConsoleMethod('log', 'log')
    wrapConsoleMethod('warn', 'warn')
    wrapConsoleMethod('error', 'error')
  } else {
    // eslint-disable-next-line no-console
    console.log = function () { /* ignore */ }
    console.warn = function () { /* ignore */ }
    // eslint-disable-next-line no-console
    console.info = function () { /* ignore */ }
    wrapConsoleMethod('error', 'error')
  }

  wrapStream('stderr', 'error')
  wrapStream('stdout', 'log')
}

function handleExceptions () {
  // Handle uncaught exceptions
  process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception: ', err)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', function (reason) {
    console.error('Unhandled Promise Rejection: ', reason)
  })
}

function terminateWhenParentTerminates () {
  const parentPid = Number(process.env.VSCODE_PARENT_PID)

  if (typeof parentPid === 'number' && !isNaN(parentPid)) {
    setInterval(function () {
      try {
        process.kill(parentPid, 0) // throws an exception if the main process doesn't exist anymore.
      } catch (e) {
        process.exit()
      }
    }, 5000)
  }
}
