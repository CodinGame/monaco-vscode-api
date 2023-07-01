import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { ExtHostLocalizationService, IExtHostLocalizationService } from 'vs/workbench/api/common/extHostLocalizationService'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadLocalization'

registerExtHostSingleton(IExtHostLocalizationService, ExtHostLocalizationService, InstantiationType.Delayed)

registerExtHostProvider('localization', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostLocalization = rpcProtocol.set(ExtHostContext.ExtHostLocalization, accessor.get(IExtHostLocalizationService))

    return {
      extHostLocalization
    }
  }
})
