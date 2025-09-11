import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITelemetryService } from '../services'
import { TelemetryService } from 'vs/workbench/services/telemetry/browser/telemetryService'
import { IDataChannelService } from 'vs/platform/dataChannel/common/dataChannel.service'
export type { ITelemetryData, TelemetryLevel } from 'vs/platform/telemetry/common/telemetry'
import { DataChannelService } from 'vs/workbench/services/dataChannel/browser/dataChannelService'
import 'vs/workbench/contrib/telemetry/browser/telemetry.contribution'
export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITelemetryService.toString()]: new SyncDescriptor(TelemetryService, [], true),
    [IDataChannelService.toString()]: new SyncDescriptor(DataChannelService, [], true)
  }
}
