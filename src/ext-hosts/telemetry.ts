import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostTelemetry, IExtHostTelemetry } from 'vs/workbench/api/common/extHostTelemetry'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadTelemetry'

registerExtHostSingleton(IExtHostTelemetry, ExtHostTelemetry, InstantiationType.Eager)

registerExtHostProvider('telemetry', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostTelemetry = accessor.get(IExtHostTelemetry)

    rpcProtocol.set(ExtHostContext.ExtHostTelemetry, extHostTelemetry)

    return {
      extHostTelemetry
    }
  }
})
