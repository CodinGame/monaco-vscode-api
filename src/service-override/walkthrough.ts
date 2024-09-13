import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService'
import { IWalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService.service'
import 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution'
import 'vs/workbench/contrib/welcomeWalkthrough/browser/walkThrough.contribution'
import svgAssets from 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.svg'
import pngAssets from 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.png'
import { registerAssets } from '../assets'

registerAssets(svgAssets)
registerAssets(pngAssets)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IWalkthroughsService.toString()]: new SyncDescriptor(WalkthroughsService, [], true)
  }
}
