import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { CommentService, ICommentService } from 'vs/workbench/contrib/comments/browser/commentService'
import 'vs/workbench/contrib/comments/browser/comments.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ICommentService.toString()]: new SyncDescriptor(CommentService, [], true)
  }
}
