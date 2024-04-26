import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import 'vs/workbench/contrib/timeline/browser/timeline.contribution'
import 'vs/workbench/contrib/localHistory/browser/localHistory.contribution'
import { ITimelineService } from 'vs/workbench/contrib/timeline/common/timeline.service'
import { TimelineService } from 'vs/workbench/contrib/timeline/common/timelineService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITimelineService.toString()]: new SyncDescriptor(TimelineService, [], true)
  }
}
