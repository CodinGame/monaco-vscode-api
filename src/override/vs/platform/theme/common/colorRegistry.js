import { Extensions } from 'vs/platform/theme/common/colorRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
export * from 'monaco-editor/esm/vs/platform/theme/common/colorRegistry.js'

// This function is treeshaked in monaco-editor and we can't just take the one from vscode
// as it just returns a module local scope variable (so it would return an empty instance)
// Fortunately there is a way to retrieve the instance from monaco
export function getColorRegistry () {
  return Registry.as(Extensions.ColorContribution)
}
