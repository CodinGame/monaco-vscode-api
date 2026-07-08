import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ICommentService } from 'vs/workbench/contrib/comments/browser/commentService.service'
import { CommentService } from 'vs/workbench/contrib/comments/browser/commentService'
import { IAgentEditorCommentsBridge } from 'vs/workbench/services/agentEditorComments/common/agentEditorComments.service'
import { AgentEditorCommentsBridge } from 'vs/workbench/services/agentEditorComments/common/agentEditorComments'
import 'vs/workbench/contrib/comments/browser/comments.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ICommentService.toString()]: new SyncDescriptor(CommentService, [], true),
    [IAgentEditorCommentsBridge.toString()]: new SyncDescriptor(AgentEditorCommentsBridge, [], true)
  }
}
