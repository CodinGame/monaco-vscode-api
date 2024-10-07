import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ISCMService, ISCMViewService } from 'vs/workbench/contrib/scm/common/scm.service'
import { SCMService } from 'vs/workbench/contrib/scm/common/scmService'
import { SCMViewService } from 'vs/workbench/contrib/scm/browser/scmViewService'
import { IQuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiff.service'
import { QuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiffService'
import 'vs/workbench/contrib/scm/browser/scm.contribution'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ISCMService.toString()]: new SyncDescriptor(SCMService, [], true),
    [ISCMViewService.toString()]: new SyncDescriptor(SCMViewService, [], true),
    [IQuickDiffService.toString()]: new SyncDescriptor(QuickDiffService, [], true)
  }
}
