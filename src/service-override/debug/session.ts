import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserExtensionHostDebugService } from 'vs/workbench/contrib/debug/browser/extensionHostDebugService'
import { IDebugService } from 'vs/workbench/contrib/debug/common/debug.service'
import { IDebugVisualizerService } from 'vs/workbench/contrib/debug/common/debugVisualizers.service'
import {
  NullDebugService,
  NullDebugVisualizerService
} from 'vs/workbench/contrib/debug/common/nullDebugService'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IDebugService.toString()]: new SyncDescriptor(NullDebugService, [], true),
    [IExtensionHostDebugService.toString()]: new SyncDescriptor(
      BrowserExtensionHostDebugService,
      [],
      true
    ),
    [IDebugVisualizerService.toString()]: new SyncDescriptor(NullDebugVisualizerService, [], true)
  }
}
