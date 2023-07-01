import { ExtHostClipboard } from 'vs/workbench/api/common/extHostClipboard'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadClipboard'

registerExtHostProvider('clipboard', {
  dependencies: [],
  provide: (accessor, mainContext) => {
    const extHostClipboard = new ExtHostClipboard(mainContext)

    return {
      extHostClipboard
    }
  }
})
