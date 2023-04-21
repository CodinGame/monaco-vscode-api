import './polyfill'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Registry } from 'vs/platform/registry/common/platform'
import * as monaco from 'monaco-editor'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IJSONContributionRegistry, Extensions as JsonExtensions } from 'vs/platform/jsonschemas/common/jsonContributionRegistry'
import { Emitter, Event } from 'vs/base/common/event'
import * as vscode from './api'

type Unpacked<T> = T extends (infer U)[] ? U : T
type JsonSchema = Unpacked<NonNullable<monaco.languages.json.DiagnosticsOptions['schemas']>>

const registry = Registry.as<IJSONContributionRegistry>(JsonExtensions.JSONContribution)
function getDefaultSchemaAssociations (): JsonSchema[] {
  const userDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  const profile = userDataProfilesService.defaultProfile
  return [{
    fileMatch: [profile.keybindingsResource.toString(true)],
    uri: 'vscode://schemas/keybindings'
  }, {
    fileMatch: [profile.settingsResource.toString(true)],
    uri: 'vscode://schemas/settings/user'
  }]
}

function getExtensionSchemaAssociations (): JsonSchema[] {
  const associations: JsonSchema[] = []
  vscode.extensions.all.forEach(extension => {
    const packageJSON = extension.packageJSON
    const jsonValidation = packageJSON?.contributes?.jsonValidation
    if (jsonValidation != null) {
      if (Array.isArray(jsonValidation)) {
        jsonValidation.forEach(jv => {
          let { fileMatch, url }: { fileMatch: string | string[], url: string } = jv
          if (typeof fileMatch === 'string') {
            fileMatch = [fileMatch]
          }
          if (Array.isArray(fileMatch) && typeof url === 'string') {
            let uri: string = url
            if (uri[0] === '.' && uri[1] === '/') {
              uri = monaco.Uri.joinPath(extension.extensionUri, uri).toString()
            }
            fileMatch = fileMatch.map(fm => {
              if (fm[0] === '%') {
                fm = fm.replace(/%APP_SETTINGS_HOME%/, '/User')
                fm = fm.replace(/%MACHINE_SETTINGS_HOME%/, '/Machine')
                fm = fm.replace(/%APP_WORKSPACES_HOME%/, '/Workspaces')
              } else if (fm.match(/^(\w+:\/\/|\/|!)/) == null) {
                fm = '/' + fm
              }
              return fm
            })
            associations.push({ fileMatch, uri })
          }
        })
      }
    }
  })
  return associations
}

const customSchemaChangeEmitter = new Emitter<void>()

function getJsonSchemas (): JsonSchema[] {
  return Object.entries(registry.getSchemaContributions().schemas)
    .filter(([uri]) => uri !== 'vscode://schemas/vscode-extensions') // remove it because for some reason it makes the json worker message fail
    .map(([uri, schema]) => ({
      uri,
      schema
    }))
}

const customJsonSchema: JsonSchema[] = []
function registerJsonSchema (schema: JsonSchema): monaco.IDisposable {
  customJsonSchema.push(schema)
  customSchemaChangeEmitter.fire()
  return new vscode.Disposable(() => {
    const index = customJsonSchema.indexOf(schema)
    if (index >= 0) {
      customJsonSchema.splice(index, 1)
      customSchemaChangeEmitter.fire()
    }
  })
}

/**
 * Synchronize registered json schema on the monaco json worker
 */
function synchronizeJsonSchemas (): monaco.IDisposable {
  function updateDiagnosticsOptions () {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      ...monaco.languages.json.jsonDefaults.diagnosticsOptions,
      schemas: [
        ...getJsonSchemas(),
        ...getDefaultSchemaAssociations(),
        ...getExtensionSchemaAssociations()
      ]
    })
  }

  updateDiagnosticsOptions()
  const changeEvent = Event.any<unknown>(vscode.extensions.onDidChange as Event<void>, customSchemaChangeEmitter.event, registry.onDidChangeSchema)

  return changeEvent(updateDiagnosticsOptions)
}

export {
  JsonSchema,
  registerJsonSchema,
  synchronizeJsonSchemas
}
