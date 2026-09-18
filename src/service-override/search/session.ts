import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride()
  }
}
