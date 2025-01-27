import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITelemetryService } from '../services'
import { TelemetryService } from 'vs/workbench/services/telemetry/browser/telemetryService'
import 'vs/workbench/contrib/telemetry/browser/telemetry.contribution'
export type { ITelemetryData, TelemetryLevel } from 'vs/platform/telemetry/common/telemetry'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITelemetryService.toString()]: new SyncDescriptor(TelemetryService, [], true)
  }
}
