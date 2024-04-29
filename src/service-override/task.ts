import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService.service'
import { TaskService } from 'vs/workbench/contrib/tasks/browser/taskService'
import 'vs/workbench/contrib/tasks/browser/task.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITaskService.toString()]: new SyncDescriptor(TaskService, [], true)
  }
}
