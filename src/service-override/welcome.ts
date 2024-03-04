import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWalkthroughsService, WalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService'
import 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution'
import 'vs/workbench/contrib/welcomeWalkthrough/browser/walkThrough.contribution'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'
// @ts-ignore
import svgAssets from 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.svg'
// @ts-ignore
import pngAssets from 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.png'
import { FileAccess } from 'vs/base/common/network'
import { registerAssets } from '../assets'

registerAssets(svgAssets)
registerAssets(pngAssets)

FileAccess.registerModuleContentProvider('vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough', () => import('vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough'))
FileAccess.registerModuleContentProvider('vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker', () => import('vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker'))
FileAccess.registerModuleContentProvider('vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile', () => import('vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile'))

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IWalkthroughsService.toString()]: new SyncDescriptor(WalkthroughsService, [], true)
  }
}
