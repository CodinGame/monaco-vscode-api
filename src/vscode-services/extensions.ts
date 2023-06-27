/// <reference path="../../vscode.proposed.extensionsAny.d.ts" />
import type * as vscode from 'vscode'
import { ExtensionIdentifierSet, IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { Extension } from 'vs/workbench/api/common/extHostExtensionService'
import { checkProposedApiEnabled, isProposedApiEnabled } from 'vs/workbench/services/extensions/common/extensions'
import { ExtensionKind } from 'vs/workbench/api/common/extHostTypes'
import { Event } from 'vs/base/common/event'
import { getExtHostServices } from './extHost'

export default function create (getExtension: () => IExtensionDescription): typeof vscode.extensions {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getExtension (extensionId: string, includeFromDifferentExtensionHosts: boolean = false): vscode.Extension<any> | undefined {
      const { extHostExtensionService: extensionService } = getExtHostServices()
      const extensionInfo = extensionService.getExtensionRegistries()
      const extension = getExtension()

      if (!isProposedApiEnabled(getExtension(), 'extensionsAny')) {
        includeFromDifferentExtensionHosts = false
      }
      const mine = extensionInfo.mine.getExtensionDescription(extensionId)
      if (mine != null) {
        return new Extension(extensionService, extension.identifier, mine, ExtensionKind.UI, false)
      }
      if (includeFromDifferentExtensionHosts) {
        const foreign = extensionInfo.all.getExtensionDescription(extensionId)
        if (foreign != null) {
          return new Extension(extensionService, extension.identifier, foreign, ExtensionKind.UI, true)
        }
      }
      return undefined
    },
    get all () {
      const { extHostExtensionService } = getExtHostServices()
      const extensionInfo = extHostExtensionService.getExtensionRegistries()

      const result: vscode.Extension<unknown>[] = []
      for (const desc of extensionInfo.mine.getAllExtensionDescriptions()) {
        result.push(new Extension(extHostExtensionService, getExtension().identifier, desc, ExtensionKind.UI, false))
      }
      return result
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get allAcrossExtensionHosts (): vscode.Extension<any>[] {
      const extension = getExtension()
      const { extHostExtensionService } = getExtHostServices()
      const extensionInfo = extHostExtensionService.getExtensionRegistries()

      checkProposedApiEnabled(extension, 'extensionsAny')
      const local = new ExtensionIdentifierSet(extensionInfo.mine.getAllExtensionDescriptions().map(desc => desc.identifier))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: vscode.Extension<any>[] = []
      for (const desc of extensionInfo.all.getAllExtensionDescriptions()) {
        const isFromDifferentExtensionHost = !local.has(desc.identifier)
        result.push(new Extension(extHostExtensionService, extension.identifier, desc, ExtensionKind.UI, isFromDifferentExtensionHost))
      }
      return result
    },
    get onDidChange () {
      const { extHostExtensionService } = getExtHostServices()
      const extensionInfo = extHostExtensionService.getExtensionRegistries()

      if (isProposedApiEnabled(getExtension(), 'extensionsAny')) {
        return Event.any(extensionInfo.mine.onDidChange, extensionInfo.all.onDidChange)
      }
      return extensionInfo.mine.onDidChange
    }
  }
}
