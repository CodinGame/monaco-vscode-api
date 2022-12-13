import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getNotificationServiceOverride from './notifications'
import getDialogServiceOverride from './dialogs'

/**
 * @deprecated use `getNotificationServiceOverride` and `getDialogServiceOverride` instead
 */
export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    ...getNotificationServiceOverride(container),
    ...getDialogServiceOverride(container)
  }
}
