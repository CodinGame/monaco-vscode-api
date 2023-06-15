import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import createApi from '../../../../../createApi'

export function createApiFactoryAndRegisterActors (): unknown {
  return (extension: IExtensionDescription) => createApi(extension)
}
