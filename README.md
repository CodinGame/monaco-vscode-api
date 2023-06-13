# @codingame/monaco-vscode-api &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-vscode-api)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-vscode-api.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-vscode-api/pulls)

[NPM module](https://www.npmjs.com/) that implements the VSCode api and redirects calls to Monaco editor.

The VSCode api is composed of:

- A lot of classes and tools, which are exported the same way as in VSCode.
- Some features that are supported by Monaco (Language feature registrations...) which are just forwarded to it (with some transformations)
- Some features that are not supported by Monaco, and in such case:
  - If it's an important feature: it requires to use the corresponding service override.
  - If it's some advanced features that don't make a lot of sense on Monaco (scm, tests...), it just throws an error when you try to use it.

## Installation

```bash
npm install vscode@npm:@codingame/monaco-vscode-api
npm install -D @types/vscode
```

⚠️ And add in your package.json ⚠️:
```json
{
  "scripts": {
    "postinstall": "monaco-treemending",
  }
}
```

If you use Vite, add in your vite.config.js:
```js
assetsInclude: ['node_modules/vscode-oniguruma/**/*.wasm']
```

### Why?

Monaco-editor is a library that is constructed using code from vscode and goes through an intense treeshaking process.

However, due to the inclusion of additional code from VSCode in this library that utilizes internal modules bundled in monaco, this treeshaking is a problem here.

To **tree-mend** (to **un**treeshake it) monaco-editor, this library provide a script that will apply a patch on the local installation of monaco-editor, restoring all the code that was treeshaken during the monaco-editor build process

# Usage

## Monaco standalone services

Also, monaco-editor use `standalone` versions or the vscode services, which are much simpler.

You may want to provide your custom implementations of them. To do so, you can use the `initialize` method from `vscode/services`.
Also, monaco-editor doesn't provide good type for them, so this library does it.

Example:

```typescript
import { StandaloneServices, INotificationService, initialize } from 'vscode/services'

class MyCustomNotificationService implements INotificationService { ... }
await initialize({
  get [INotificationService.toString()] () {
    return new MyCustomNotificationService(...)
  }
})
```

Additionally, this library exposes 20 modules that include the vscode version of some services (with some glue to make it work with monaco):

- Notifications: `vscode/service-override/notifications`
- Dialogs: `vscode/service-override/dialogs`
- Model: `vscode/service-override/model`
- Editor: `vscode/service-override/editor`
- Configuration: `vscode/service-override/configuration`
- Keybindings: `vscode/service-override/keybindings`
- Languages: `vscode/service-override/languages`
- Textmate: `vscode/service-override/textmate`
- Snippets: `vscode/service-override/snippets`
- VSCode themes: `vscode/service-override/theme`
- Audio cue: `vscode/service-override/audioCue`
- Debug: `vscode/service-override/debug`
- Files: `vscode/service-override/files`
- Preferences: `vscode/service-override/preferences`
- Views: `vscode/service-override/views` (Is exclusive with `editor`, do not use both at the same time)
- QuickAccess: `vscode/service-override/quickaccess`
- Output: `vscode/service-override/output`
- Terminal: `vscode/service-override/terminal`
- Search: `vscode/service-override/search`
- Markers: `vscode/service-override/markers`

Usage:

```typescript
import { initialize } from 'vscode/services'
import getEditorServiceOverride from 'vscode/service-override/editor'
import getConfigurationServiceOverride, { updateUserConfiguration, configurationRegistry } from 'vscode/service-override/configuration'

await initialize({
  ...getModelEditorServiceOverride((model, input, sideBySide) => {
    // Open a new editor here and return it
    // It will be called when for instance the user ctrl+click on an import
  }),
  ...getConfigurationServiceOverride(monaco.Uri.file('/tmp/'))
})

updateUserConfiguration(`{
  "editor.fontSize": 12,
  "[java]": {
    "editor.fontSize": 15,
  }
}`)
```

### Troubleshoot

`initialize` can only be called once ( and it should be called BEFORE creating your first editor).

## Editor configuration

The editors created using `monaco.editor.create` don't use the configuration from the configurationService.

This library exposes functions to create editors binded on the configuration service:

before:

```typescript
import * as monaco from 'monaco-editor'
const model = monaco.editor.createModel(...)
const editor = monaco.editor.create({ model, ... })

...

model.dispose()
editor.dispose()

```

after:

```typescript
import { createConfiguredEditor, createModelReference } from 'vscode/monaco'

const modelRef = await createModelReference(...)

const editor = createConfiguredEditor({ model: modelRef.object.textEditorModel })

...

await modelRef.object.save()

...

modelRef.dispose()
editor.dispose()


```

`createConfiguredEditor` returns a subclass of what is returned by `monaco.editor.create`, the `updateOptions` method can still be used.
The only difference is that is will use the `configurationService` as a default configuration

`createModelReference` return a reference to a model. The value is fetched from the memory filesystem (which is written if you provide the second argument).
The reference can then be disposed, the model will only be disposed if there is no remaining references.

## VSCode api usage

You can just import it as if you were in a vscode extension:

```typescript
import * as vscode from 'vscode'
import { initialize } from 'vscode/extensions'

await initialize()

const range = new vscode.Range(...)
vscode.languages.registerCompletionItemProvider(...)
```

The api will use the manifest of a default vscode extension, which can be overriden by providing it to the `initialize` function.

You can also register a new extension from its manifest:
```typescript
import { registerExtension, initialize as initializeVscodeExtensions } from 'vscode/extensions'

await initialize()

const { registerFile: registerExtensionFile, api: vscodeApi } = registerExtension(defaultThemesExtensions)

registerExtensionFile('/file.json', async () => fileContent)
vscodeApi.languages.registerCompletionItemProvider(...)
```

### Default vscode extensions

VSCode uses a bunch of default extensions. Most of them are used to load the default languages and grammars (see https://github.com/microsoft/vscode/tree/main/extensions).

This library bundles most of them and allows to import the ones you want:
```typescript
import 'vscode/default-extensions/javascript'
import 'vscode/default-extensions/json'
...
```

### Loading vsix file

VSCode extension are bundled as vsix files.
This library exposes a rollup plugin (vite-compatible) that allows to load a vsix file.

- rollup/vite config:
```typescript
import vsixPlugin from 'vscode/rollup-vsix-plugin'
...
plugins: [
  ...,
  vsixPlugin()
]
```
- code:
```typescript
import './extension.vsix'
```

### Demo

Try it out on https://codingame.github.io/monaco-vscode-api/

There is a demo that showcases the service-override features. It allows to register contributions with the same syntaxes as in VSCode.
It includes:

- Languages
- VSCode themes
- Textmate grammars (requires vscode themes)
- Notifications/Dialogs
- Model/Editor services
- Configuration service, with user configuration editor
- Keybinding service, with user keybindings editor
- Debuggers

It also uses the `synchronizeJsonSchemas` function to register them on the monaco json worker and have autocomplete/hover on settings and keybindings.

From CLI run:

```bash
cd demo
npm ci
npm start
# OR: for vite debug output
npm run start:debug
```

For the debug feature, also run:
```bash
npm run start:debugServer
```

### History

This project was mainly created to make the implementation of [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) more robust and maintainable.

monaco-languageclient uses [vscode-languageclient](https://www.npmjs.com/package/vscode-languageclient) which was built to run inside a VSCode extension. VSCode extensions communicate with the editor via an [API](https://www.npmjs.com/package/@types/vscode) they can import into their code.

[The VSCode api](https://code.visualstudio.com/api/references/vscode-api) exports:

- Some functions to interact with the IDE ([language feature registrations](https://code.visualstudio.com/api/references/vscode-api#languages), [command execution](https://code.visualstudio.com/api/references/vscode-api#commands)...)
- A lot of utility classes (Range, Position...)

The first implementations of [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) were using a fake VSCode api implementation. The vscode-languageclient was hacked so the VSCode<->protocol object converters were mainly bypassed, so the fake VSCode api was receiving [Language Server Protocol](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/) objects. Then the objects were transformed using custom transformers into [Monaco](https://www.npmjs.com/package/monaco-editor) objects to communicate with the monaco api.

This approach has some disadvantages:

- There is a lot of code to transform LSP objects into Monaco objects
- It's hard to follow the updates of VSCode and the language server protocol
- It doesn't behave exactly the same as in VSCode

With this library, it would be possible to plug vscode-languageclient directly on top of monaco, monaco-languageclient still helps to do so by:

- Adding some tweaks to the VSCode LanguageClient (Removing unsupported features...)
- Providing some examples on how to build an app using it
- Adding some tools (DisposableCollection)
