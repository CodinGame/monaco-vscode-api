import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AccessibleViewService } from 'vs/workbench/contrib/accessibility/browser/accessibleView'
import { AccessibilitySignalService } from 'vs/platform/accessibilitySignal/browser/accessibilitySignalService'
import audioAssets from 'vs/platform/accessibilitySignal/browser/media/*.mp3'
import { IAccessibleViewService } from 'vs/platform/accessibility/browser/accessibleView.service'
import { IAccessibilitySignalService } from 'vs/platform/accessibilitySignal/browser/accessibilitySignalService.service'
import { IAccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService.service'
import { AccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService'
import { IAccessibilityService } from 'vs/platform/accessibility/common/accessibility.service'
import { AccessibilityService } from 'vs/platform/accessibility/browser/accessibilityService'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/accessibility/browser/accessibility.contribution'
import 'vs/workbench/contrib/codeEditor/browser/accessibility/accessibility'
import 'vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution'

registerAssets(audioAssets)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAccessibleViewService.toString()]: new SyncDescriptor(AccessibleViewService, [], true),
    [IAccessibilitySignalService.toString()]: new SyncDescriptor(AccessibilitySignalService, [], true),
    [IAccessibilityService.toString()]: new SyncDescriptor(AccessibilityService, [], true),
    [IAccessibleViewInformationService.toString()]: new SyncDescriptor(AccessibleViewInformationService, [], true)
  }
}
