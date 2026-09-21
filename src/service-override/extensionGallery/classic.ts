import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ExtensionRecommendationNotificationService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService'
import { ExtensionRecommendationsService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationsService'
import { IExtensionRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations.service'

import getCommonServiceOverride, { type ExtensionGalleryOptions } from './common.js'
import 'vs/workbench/contrib/extensions/browser/extensions.contribution'

export default function getServiceOverride({
  webOnly = false,
  transformExtensionGalleryManifest
}: ExtensionGalleryOptions = {}): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride({ webOnly, transformExtensionGalleryManifest }),
    [IExtensionRecommendationsService.toString()]: new SyncDescriptor(
      ExtensionRecommendationsService,
      [],
      true
    ),
    [IExtensionRecommendationNotificationService.toString()]: new SyncDescriptor(
      ExtensionRecommendationNotificationService,
      [],
      true
    )
  }
}

export type { IExtensionGalleryManifest, ExtensionGalleryOptions } from './common.js'
