import type * as vscode from 'vscode'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { getExtHostServices } from '../extHost'

export default function create (getExtension: () => IExtensionDescription): typeof vscode.l10n {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t (...params: [message: string, ...args: Array<string | number | boolean>] | [message: string, args: Record<string, any>] | [{ message: string, args?: Array<string | number | boolean> | Record<string, any>, comment: string | string[] }]): string {
      const { extHostLocalization } = getExtHostServices()
      const extension = getExtension()
      if (typeof params[0] === 'string') {
        const key = params.shift() as string

        // We have either rest args which are Array<string | number | boolean> or an array with a single Record<string, any>.
        // This ensures we get a Record<string | number, any> which will be formatted correctly.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
        const argsFormatted = !params || typeof params[0] !== 'object' ? params : params[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return extHostLocalization.getMessage(extension.identifier.value, { message: key, args: argsFormatted as Record<string | number, any> | undefined })
      }

      return extHostLocalization.getMessage(extension.identifier.value, params[0])
    },
    get bundle () {
      const { extHostLocalization } = getExtHostServices()
      const extension = getExtension()
      return extHostLocalization.getBundle(extension.identifier.value)
    },
    get uri () {
      const { extHostLocalization } = getExtHostServices()
      const extension = getExtension()
      return extHostLocalization.getBundleUri(extension.identifier.value)
    }
  }
}
