import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AccessibleViewService, IAccessibleViewService } from 'vs/workbench/contrib/accessibility/browser/accessibleView'
import { AccessibilitySignalService, IAccessibilitySignalService } from 'vs/platform/accessibilitySignal/browser/accessibilitySignalService'
import audioAssets from 'vs/platform/accessibilitySignal/browser/media/*.mp3'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/accessibility/browser/accessibility.contribution'
import 'vs/workbench/contrib/codeEditor/browser/accessibility/accessibility'
import 'vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution'

registerAssets(audioAssets)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAccessibleViewService.toString()]: new SyncDescriptor(AccessibleViewService, [], true),
    [IAccessibilitySignalService.toString()]: new SyncDescriptor(AccessibilitySignalService, [], true)
  }
}
