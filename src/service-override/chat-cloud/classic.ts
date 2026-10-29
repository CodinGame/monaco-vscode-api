import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common.js'
export * from './common.js'

export default function getServiceOverride(): IEditorOverrideServices {
  return getCommonServiceOverride()
}
