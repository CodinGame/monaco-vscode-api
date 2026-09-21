import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

import getCommonServiceOverride, { type ExtensionGalleryOptions } from './common.js'
import 'vs/sessions/contrib/extensions/browser/extensions.contribution'
import { NullExtensionRecommendationNotificationService } from 'vs/sessions/services/extensionRecommendations/common/extensionRecommendationNotificationService.js'

export default function getServiceOverride({
  webOnly = false,
  transformExtensionGalleryManifest
}: ExtensionGalleryOptions = {}): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride({ webOnly, transformExtensionGalleryManifest }),
    [IExtensionRecommendationNotificationService.toString()]: new SyncDescriptor(
      NullExtensionRecommendationNotificationService,
      [],
      true
    )
  }
}

export type { IExtensionGalleryManifest, ExtensionGalleryOptions } from './common.js'
