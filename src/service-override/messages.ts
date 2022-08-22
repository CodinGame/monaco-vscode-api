import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getNotificationServiceOverride from './notifications'
import getDialogServiceOverride from './dialogs'

/**
 * @deprecated
 */
export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    ...getNotificationServiceOverride(container),
    ...getDialogServiceOverride(container)
  }
}
