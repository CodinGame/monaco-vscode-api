import { ILogService } from 'vs/platform/log/common/log.service'
import { MainContext } from 'vs/workbench/api/common/extHost.protocol'
import {
  extHostCustomer,
  type IExtHostContext
} from 'vs/workbench/services/extensions/common/extHostCustomers'
import type { ProxyIdentifier } from 'vs/workbench/services/extensions/common/proxyIdentifier'

/**
 * The extension host requires every `MainContext` proxy to have a main thread implementation,
 * but the ones of optional features (chat, notebook, mcp...) are only registered by their service overrides.
 *
 * This customer registers an inert implementation for every proxy that nothing else registered.
 * It doesn't depend on the registration order: unnamed customers are instantiated after the named ones,
 * and a real implementation set later by another unnamed customer replaces the inert one.
 *
 * Every `$` method resolves with an empty array: some extHost implementations call the main thread
 * on construction and iterate over the result (e.g. `ExtHostLanguageModelTools` with `$getTools`)
 */
class InertMainThreadCustomer {
  constructor(extHostContext: IExtHostContext, @ILogService logService: ILogService) {
    const ids: ProxyIdentifier<unknown>[] = Object.values(MainContext)
    const missing = ids.filter((id) => {
      try {
        extHostContext.assertRegistered([id])
        return false
      } catch {
        return true
      }
    })
    for (const id of missing) {
      extHostContext.set(id, createInertMainThreadActor())
    }
    if (missing.length > 0) {
      logService.debug(
        `Registered inert main thread implementations for: ${missing.map((id) => id.sid).join(', ')}`
      )
    }
  }

  dispose(): void {}
}

function createInertMainThreadActor() {
  return new Proxy(
    {},
    {
      get: (_target, property) =>
        typeof property === 'string' && property.startsWith('$') ? async () => [] : undefined
    }
  )
}

extHostCustomer(InertMainThreadCustomer)
