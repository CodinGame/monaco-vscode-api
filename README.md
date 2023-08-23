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

### Why?

Monaco-editor is a library that is constructed using code from vscode and goes through an intense treeshaking process.

However, due to the inclusion of additional code from VSCode in this library that utilizes internal modules bundled in monaco, this treeshaking is a problem here.

To **tree-mend** (to **un**treeshake it) monaco-editor, this library provides a script that will apply a patch on the local installation of monaco-editor, restoring all the code that was treeshaken during the monaco-editor build process

## Troubleshooting

### If you use Vite

This library uses a lot the `new URL('asset.extension', import.meta.url)` syntax which [is supported by vite](https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url)

While it works great in `build` mode (because rollup is used), there is some issues in `watch`` mode:
- import.meta.url is not replaced while creating bundles, it is an issue when the syntax is used inside a dependency
- vite is still trying to inject/transform javascript assets files, breaking the code by injecting ESM imports in commonjs files

There are workarounds for both:

- We can help vite by replacing `import.meta.url` by the original module path (you need the --experimental-import-meta-resolve note option):
```typescript
{
  ...
  optimizeDeps: {
    esbuildOptions: {
      plugins: [{
        name: 'import.meta.url',
        setup ({ onLoad }) {
          // Help vite that bundles/move files in dev mode without touching `import.meta.url` which breaks asset urls
          onLoad({ filter: /.*\.js/, namespace: 'file' }, async args => {
            const code = fs.readFileSync(args.path, 'utf8')

            const assetImportMetaUrlRE = /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/g
            let i = 0
            let newCode = ''
            for (let match = assetImportMetaUrlRE.exec(code); match != null; match = assetImportMetaUrlRE.exec(code)) {
              newCode += code.slice(i, match.index)

              const path = match[1].slice(1, -1)
              const resolved = await import.meta.resolve!(path, url.pathToFileURL(args.path))

              newCode += `new URL(${JSON.stringify(url.fileURLToPath(resolved))}, import.meta.url)`

              i = assetImportMetaUrlRE.lastIndex
            }
            newCode += code.slice(i)

            return { contents: newCode }
          })
        }
      }]
    }
  }
}
```
- we can serialize and eval the code to prevent vite from touching it:
```typescript
{
  plugins: [{
    // prevent vite from trying to inject code into an extension file du to an `import()` in that file
    name: 'hack-prevent-transform-javascript',
    apply: 'serve',
    load (source) {
      if (source.includes('tsserver.web.js')) {
        return `eval(${JSON.stringify(fs.readFileSync(source).toString('utf-8'))})`
      }
    }
  }]
}
```

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

Additionally, this library exposes 23 modules that include the vscode version of some services (with some glue to make it work with monaco):

- **Extensions** (included by default): `vscode/service-override/extensions`
  - Support for VSCode extensions. A worker configuration can be past to it:
    - Then, everything runs in one worker, where extensions run in an iframe, with all the implications (can be created by the bundler directly). The worker script is expected to be hosted on a separate domain.
- **Files** (included by default): `vscode/service-override/files`
  - It adds the memory filesystem for `file://` files, but also adds the support for lazy loaded extension files. It adds separate memory user files (e.g. config, keybindings), cache files and log files.
- **QuickAccess** (included by default): `vscode/service-override/quickaccess`
  - Enables the quickaccess menu in the editor (press F1 or ctrl+shift+p)
- **Notifications**: `vscode/service-override/notifications`
  - This services enables vscode notifications you usually find in the bottom right corner.
- **Dialogs**: `vscode/service-override/dialogs`
  - Enable vscode modal dialogs. It allows users to select an action to do. Those actions are exposed to the vscode API. Additionally, this service can be used by the language client to delegate questions to the user.
- **Model**: `vscode/service-override/model`
  - This service creates and takes care of model references. For example:
    - Create model if content is unknown
    - Count references
    - Destroy models when they are no longer used
- **Editor**: `vscode/service-override/editor`
  - Enable editor support. This is usually needed when working with the language server protocol. Without enabling the editor service, it will only be able to resolve the currently open model (only internal file links will work).
- **Views**: `vscode/service-override/views`
  - Enable full views support. Is exclusive with the `editor` service. Do not use both services at the same time.
- **Configuration**: `vscode/service-override/configuration`
  - Allows to change the configuration of not only the editors, but every part of vscode. The language client for instance uses it to send the requested configuration to the server. The default configuration service already allows to change the configuration. This service overrides makes it rely on a user configuration file (with json schema, overridable by language including all vscode features).
- **Keybindings**: `vscode/service-override/keybindings`
  - Enables platform specific keybindings and make it rely on a user definded keybindings configuration (if available).
- **Languages**: `vscode/service-override/languages`
  - Enable language support. It's like the standalone service with 2 differences:
    - It handle the language extension point (getting languages from vscode extensions)
    - It triggers the `onLanguage:${language}` event (to load vscode extension listening to those events)
- **Textmate**: `vscode/service-override/textmate`
  - Allows to use textmate grammars. Depends on *themes* service. vscode extensions use textmate grammars exclusively for highlighting. Once this is enabled monarch grammars can no longer be loaded by monaco-editor.
- **Themes**: `vscode/service-override/theme`
  - Allows to use VSCode themes.
- **Snippets**: `vscode/service-override/snippets`
  - Add snippet extension point (register vscode extension snippets)
- **Audio cue**: `vscode/service-override/audioCue`
  - If enabled the editor may provides audible hints
- **Debug**: `vscode/service-override/debug`
  - Activate debugging support
- **Preferences**: `vscode/service-override/preferences`
  - Allow to read and write preferences
- **Output**: `vscode/service-override/output`
  - Output panel support. *Hint*: It only makes sense to enable it when *Views* service is used.
- **Terminal**: `vscode/service-override/terminal`
  - Terminal panel support. *Hint*: It only makes sense to enable it when *Views* service is used.
- **Search**: `vscode/service-override/search`
  - search panel support. *Hint*: It only makes sense to enable it when *Views* service is used.
- **Markers**: `vscode/service-override/markers`
  - It adds the problems panel tab. *Hint*: It only makes sense to enable it when *Views* service is used.
- **Language detection worker**: `vscode/service-override/languageDetectionWorker`
  - When opening an untitled model or a file without extension or if vscode is unable to guess the language simply by the file extension or by reading the first line. Then it will use tensorflow in a worker to try to guess the most probable language (here we are only able to rely on the open source model).
- **Storage**: `vscode/service-override/storage`
  - Define your own storage or use the default BrowserStorageService. The storage service is used in many places either as a cache or as a user preference store. For instance:
    - Current loaded theme is stored in there to be loaded faster on start.
    - Every panel/view positions are stored in there.

Usage:

```typescript
import * as vscode from 'vscode'
import { initialize } from 'vscode/services'
import getEditorServiceOverride from 'vscode/service-override/editor'
import getConfigurationServiceOverride, { updateUserConfiguration, configurationRegistry } from 'vscode/service-override/configuration'

await initialize({
  ...getModelEditorServiceOverride((model, input, sideBySide) => {
    // Open a new editor here and return it
    // It will be called when for instance the user ctrl+click on an import
  }),
  ...getConfigurationServiceOverride(vscode.Uri.file('/tmp/'))
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
import { registerExtension, initialize } from 'vscode/extensions'

await initialize()

const { registerFile: registerExtensionFile, getApi } = registerExtension(defaultThemesExtensions)

registerExtensionFile('/file.json', async () => fileContent)

getApi().then(vscodeApi => vscodeApi.languages.registerCompletionItemProvider(...))

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
