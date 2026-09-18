import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITimelineService } from 'vs/workbench/contrib/timeline/common/timeline.service'
import { TimelineService } from 'vs/workbench/contrib/timeline/common/timelineService'
import 'vs/workbench/contrib/localHistory/browser/localHistory.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITimelineService.toString()]: new SyncDescriptor(TimelineService, [], true)
  }
}
