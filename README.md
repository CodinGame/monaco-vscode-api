# @codingame/monaco-vscode-api &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-vscode-api)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-vscode-api.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-vscode-api/pulls)

[NPM module](https://www.npmjs.com/) that allows to use every part of VSCode, including the monaco editor

## Installation

```bash
npm install vscode@npm:@codingame/monaco-vscode-api
npm install monaco-editor@npm:@codingame/monaco-vscode-editor-api
npm install -D @types/vscode
```

`@codingame/monaco-vscode-api` is installed as an alias to `vscode` to be able to run `import * as vscode from 'vscode'`, similar to what is done inside a VSCode extension

`@codingame/monaco-vscode-editor-api` is installed as an alias to `monaco-editor` because it provides the same api as the official `monaco-editor`

# Usage

## Monaco standalone services

`monaco-editor`, as well as this library by default, uses `standalone` version or the vscode services, which are much simpler than the one used in VSCode.

You may want to provide your custom implementations of them. To do so, you can use the `initialize` method from `vscode/services`.
Also, monaco-editor doesn't provide types for them, so this library exports them.

Example:

```typescript
import { INotificationService, initialize } from 'vscode/services'

class MyCustomNotificationService implements INotificationService { ... }
await initialize({
  get [INotificationService.toString()] () {
    return new MyCustomNotificationService(...)
  }
})
```

Additionally, several packages that include the VSCode version of some services (with some glue to make it work with monaco) are published:

- **Base** (included by default): `@codingame/monaco-vscode-base-service-override`
  - Contains some general-use services that are mandatory to most of the other features
- **Monarch**:
  - When textmate and theme service overrides are not used, it allows to restore some standalone features (Token inspection and toggle high contrast commands)
- **Host** (included by default): `@codingame/monaco-vscode-host-service-override`
  - Interaction with the host/browser (shutdown veto, focus/active management, window opening, fullscreen...)
- **Extensions** (included by default): `@codingame/monaco-vscode-extensions-service-override`
  - Support for VSCode extensions.
  - A worker configuration can be provided to it:
    - Then, extensions run in a worker which runs in an iframe, with all the implications (can be created by the bundler directly). The worker script is expected to be hosted on a separate domain.
- **Files** (included by default): `@codingame/monaco-vscode-files-service-override`
  - It adds the overlay filesystem for `file://` files, but also adds the support for lazy loaded extension files. It adds separate memory user files (e.g. config, keybindings), cache files and log files.
  - It supports adding overlay filesystems for `file://` files
- **QuickAccess** (included by default): `@codingame/monaco-vscode-quickaccess-service-override`
  - Enables the quickaccess menu in the editor (press F1 or ctrl+shift+p)
- **Notifications**: `@codingame/monaco-vscode-notifications-service-override`
  - This services enables vscode notifications you usually find in the bottom right corner.
- **Dialogs**: `@codingame/monaco-vscode-dialogs-service-override`
  - Enable vscode modal dialogs. It allows users to select an action to do. Those actions are exposed to the vscode API. Additionally, this service can be used by the language client to delegate questions to the user.
- **Model**: `@codingame/monaco-vscode-model-service-override`
  - This service creates and takes care of model references. For example:
    - Create model from filesystem if content is unknown
    - Count references
    - Destroy models when they are no longer used
- **Editor**: `@codingame/monaco-vscode-editor-service-override`
  - Enable editor support. This is usually needed when working with the language server protocol. Without enabling the editor service, it will only be able to resolve the currently open model (only internal file links will work).
- **Views**: `@codingame/monaco-vscode-views-service-override`
  - Enable full views support. Is exclusive with the `editor` service. Do not use both services at the same time.
- **Configuration**: `@codingame/monaco-vscode-configuration-service-override`
  - Allows to change the configuration of not only the editors, but every part of vscode. The language client for instance uses it to send the requested configuration to the server. The default configuration service already allows to change the configuration. This service overrides makes it rely on a user configuration file (with json schema, overridable by language including all vscode features).
- **Keybindings**: `@codingame/monaco-vscode-keybindings-service-override`
  - Enables platform specific keybindings and make it rely on a user definded keybindings configuration (if available).
- **Languages**: `@codingame/monaco-vscode-languages-service-override`
  - Enable language support. It's like the standalone service with 2 differences:
    - It handle the language extension point (getting languages from vscode extensions)
    - It triggers the `onLanguage:${language}` event (to load vscode extension listening to those events)
- **Textmate**: `@codingame/monaco-vscode-textmate-service-override`
  - Allows to use textmate grammars. Depends on *themes* service. vscode extensions use textmate grammars exclusively for highlighting. Once this is enabled monarch grammars can no longer be loaded by monaco-editor.
- **Themes**: `@codingame/monaco-vscode-theme-service-override`
  - Allows to use VSCode themes.
- **Snippets**: `@codingame/monaco-vscode-snippets-service-override`
  - Add snippet extension point (register vscode extension snippets)
- **Debug**: `@codingame/monaco-vscode-debug-service-override`
  - Activate debugging support
- **Preferences**: `@codingame/monaco-vscode-preferences-service-override`
  - Allow to read and write preferences
- **Output**: `@codingame/monaco-vscode-output-service-override`
  - Output panel support. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Terminal**: `@codingame/monaco-vscode-terminal-service-override`
  - Terminal panel support. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Search**: `@codingame/monaco-vscode-search-service-override`
  - search panel support. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Markers**: `@codingame/monaco-vscode-markers-service-override`
  - It adds the problems panel tab. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **SCM**: `@codingame/monaco-vscode-scm-service-override`
  - It adds the SCM API that can be used to implement source control. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Testing**: `@codingame/monaco-vscode-testing-service-override`
  - It adds the Tests API. *Hint*: It makes more sense to enable it when *Views* service is used.
- **Language detection worker**: `@codingame/monaco-vscode-language-detection-worker-service-override`
  - When opening an untitled model or a file without extension or if vscode is unable to guess the language simply by the file extension or by reading the first line. Then it will use tensorflow in a worker to try to guess the most probable language (here we are only able to rely on the open source model).
- **Storage**: `@codingame/monaco-vscode-storage-service-override`
  - Define your own storage or use the default BrowserStorageService. The storage service is used in many places either as a cache or as a user preference store. For instance:
    - Current loaded theme is stored in there to be loaded faster on start.
    - Every panel/view positions are stored in there.
- **LifeCycle**: `@codingame/monaco-vscode-lifecycle-service-override`
  - Allow other services to veto a page reload (for instance when not all open files are saved)
- **Remote agent**: `@codingame/monaco-vscode-remote-agent-service-override`
  - Connect to a remote vscode agent and have access to:
    - The remote filesystem
    - The remote file search
    - Running terminals
    - Running vscode extensions (not web-compatible)
    - and probably more?

  Another package `@codingame/monaco-vscode-server` is published, which expose a `vscode-ext-host-server` bin to start the remote agent
- **Accessibility**: `@codingame/monaco-vscode-accessibility-service-override`
  - Register accessibility helpers and signals
- **Workspace trust**: `@codingame/monaco-vscode-workspace-trust-service-override`
  - Ask user it they trust the current workspace, disable some features if not
- **Extension Gallery**: `@codingame/monaco-vscode-extension-gallery-service-override`
  - Support for the VSCode marketplace, it allows to install extensions from the marketplace.
- **Chat**: `@codingame/monaco-vscode-chat-service-override`
  - Support for chat and inline chat features
- **Notebook**: `@codingame/monaco-vscode-notebook-service-override`
  - Support for Jupyter notebooks
- **Welcome**: `@codingame/monaco-vscode-welcome-service-override`
  - Support for [viewsWelcome contribution point](https://code.visualstudio.com/api/references/contribution-points#contributes.viewsWelcome). *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Walkthrough**: `@codingame/monaco-vscode-walkthrough-service-override`
  - Getting Started page and support for [walkthrough contribution point](https://code.visualstudio.com/api/references/contribution-points#contributes.walkthroughs). *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **User data profile**: `@codingame/monaco-vscode-user-data-profile-service-override`
  - User profiles support
- **User data sync**: `@codingame/monaco-vscode-user-data-sync-service-override`
  - Support for user data sync. ⚠️ It can't really be used as it relies on a [closed source backend from microsoft](https://code.visualstudio.com/docs/editor/settings-sync#_can-i-use-a-different-backend-or-service-for-settings-sync) for the moment ⚠️
- **Ai**: `@codingame/monaco-vscode-ai-service-override`
  - Ai support for the ai extension api (RelatedInformation/EmbeddingVector)
- **Task**: `@codingame/monaco-vscode-task-service-override`
  - Task management
- **Outline**: `@codingame/monaco-vscode-outline-service-override`
  - Support for the outline view. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Timeline**: `@codingame/monaco-vscode-timeline-service-override`
  - Support for the timeline view. *Hint*: It only makes sense to enable it when *Views* or *Workbench* service are used.
- **Workbench**: `@codingame/monaco-vscode-workbench-service-override`
  - Allows to render the full workbench layout. Is exclusive with the `views` service. Do not use both services at the same time.
- **Comments**
  - Enables comments extension api
- **Edit-sessions**
  - Enable cloudchanges
- **Emmet**
  - Enables the `triggerExpansionOnTab` command for the emmet default extension
- **Interactive**
  - Interactive notbooks
- **Issue**
  - Issue reporting
- **Multi diff editor**
  - Multi diff editor support (<https://code.visualstudio.com/updates/v1_85#_multifile-diff-editor>)
- **Performance**
  - Performance monitoring
- **Relauncher**
  - Detects changes that require a reload (like settings change) and prompt the user for it
- **Share**
  - Enables the share extension api
- **Survey**
  - Survey/feedback support
- **Update**
  - Update detection, release notes...
- **Localization**
  - Register callbacks to update the display language from the VSCode UI (either from the `Set Display Language` command or from the extension gallery extension packs)
- **Secret Storage**
  - Storage of secrets for extensions, will store by default in-memory. You can pass a custom implementation as part of the workbench construction options when initializing monaco services (under `secretStorageProvider`).

Usage:

```typescript
import * as vscode from 'vscode'
import { initialize } from 'vscode/services'
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override'
import getConfigurationServiceOverride, { updateUserConfiguration, configurationRegistry } from '@codingame/monaco-vscode-configuration-service-override'

await initialize({
  ...getModelEditorServiceOverride((model, input, sideBySide) => {
    // Open a new editor here and return it
    // It will be called when for instance the user ctrl+click on an import
  }),
  ...getConfigurationServiceOverride()
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

## Model creation

The official `monaco-editor` package provides a function to create models: `monaco.editor.createModel`.

This method creates a standalone model that cannot be found or used by any VSCode services.

The recommended way is to used the `createModelReference` method instead (added on top of the official monaco-editor api) which returns instead a reference to a model.

It has some pros:

- The model reference can be used by VSCode services, allowing for instance following links between files (ctrl+click)
- The returned model is bound to a filesystem file, and you have access to methods allowing to control the file lifecycle (saving the file, accessing the dirty state...)
- It is possible to call the method multiple times on the same file to get multiple references. The model is disposed when there is no reference left

The second argument of the method allows you to write the file content to the virtual filesystem in case the file wasn't registered in it beforehand.

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
import * as monaco from 'monaco-editor'

const modelRef = await monaco.editor.createModelReference(...)

const editor = monaco.editor.create({ model: modelRef.object.textEditorModel })

...

await modelRef.object.save()

...

modelRef.dispose()
editor.dispose()


```

`createModelReference` return a reference to a model. The value is fetched from the memory filesystem (which is written if you provide the second argument).
The reference can then be disposed, the model will only be disposed if there is no remaining references.

## VSCode api usage

To be able to use the VSCode api directly from your code, you need to import `vscode/localExtensionHost` and the services to be initialized.

You will then be able to import it as if you were in a VSCode extension:

```typescript
import * as vscode from 'vscode'
import 'vscode/localExtensionHost'

const range = new vscode.Range(...)
vscode.languages.registerCompletionItemProvider(...)
```

You can also register a new extension from its manifest:

```typescript
import { registerExtension, initialize, ExtensionHostKind } from 'vscode/extensions'

await initialize()

const { registerFileUrl, getApi } = registerExtension({
  name: 'my-extension',
  publisher: 'someone',
  version: '1.0.0',
  engines: {
      vscode: '*'
  },
  contributes: {
  }
}, ExtensionHostKind.LocalProcess)

registerFileUrl('/file-extension-path.json', new URL('./file-real-path.json', import.meta.url).toString())

const vscode = await getApi()

vscode.languages.registerCompletionItemProvider(...)

```

### Default vscode extensions

VSCode uses a bunch of default extensions. Most of them are used to load the default languages and grammars (see <ttps://github.com/microsoft/vscode/tree/main/extensions>).

This library bundles and publishes them and allows to import the ones you want:

```typescript
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
...
```

### Loading vsix file

VSCode extensions are bundled as vsix files.
This library publishes a rollup plugin (vite-compatible) that allows to load a vsix file.

- rollup/vite config:

```typescript
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin'
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

### Localization

This library also offers the possibility to localize vscode and the extensions in the supported languages. To do so, import one of the following packages before anything else:

- `@codingame/monaco-vscode-language-pack-cs`
- `@codingame/monaco-vscode-language-pack-de`
- `@codingame/monaco-vscode-language-pack-es`
- `@codingame/monaco-vscode-language-pack-fr`
- `@codingame/monaco-vscode-language-pack-it`
- `@codingame/monaco-vscode-language-pack-ja`
- `@codingame/monaco-vscode-language-pack-ko`
- `@codingame/monaco-vscode-language-pack-pl`
- `@codingame/monaco-vscode-language-pack-pt-br`
- `@codingame/monaco-vscode-language-pack-qps-ploc`
- `@codingame/monaco-vscode-language-pack-ru`
- `@codingame/monaco-vscode-language-pack-tr`
- `@codingame/monaco-vscode-language-pack-zh-hans`
- `@codingame/monaco-vscode-language-pack-zh-hant`

⚠️ The language pack should be imported and loaded BEFORE anything else from monaco-editor or this library is loaded. Otherwise, some translations would be missing. ⚠️

### Demo

Try it out on <https://monaco-vscode-api.netlify.app/>

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
- Remote agent
- and much more

From CLI run:

```bash
# build monaco-vscode-api (the demo use it as a local dependency)
npm ci
npm run build
# start demo
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

⚠️ Building monaco-vscode-api is only supported on Linux or Mac. It you use Windows, have a look at [WSL](https://learn.microsoft.com/windows/wsl/install) ⚠️

#### Remote agent

[See vscode_server.md](./docs/vscode_server.md)

## Troubleshooting

### Duplicate versions

Many packages are published with the same version, and almost all of them depend on the `@codingame/monaco-vscode-api` main package (with strict version range).

It is VERY important that only a single version of ALL the packages is installed, otherwise weird things can happen.

You can check that `npm list vscode` only lists a single version.

### If you use Webpack

#### monaco-editor-webpack-plugin

Starting from v2, [monaco-editor-webpack-plugin](https://www.npmjs.com/package/monaco-editor-webpack-plugin) can't be used

Here's the alternative for each options:

- `filename`: it can be configured at the webpack level directly
- `publicPath`: it can be configured at the webpack level or by hands when redistering the worker in `window.MonacoEnvironment`.
- `languages`: Import vscode language extensions (`@codingame/monaco-vscode-xxx-default-extension`) or (`@codingame/@codingame/monaco-vscode-standalone-*`). Please obey: VSCode extensions can only be used if `themes` and `textmate` service overrides are configured and monaco languages can only be used if those two services are not configured (see [here](#monaco-standalone-services) for further details).
- `features`: With this lib, you can't remove editor features.
- `globalAPI`: you can set `window.MonacoEnvironment.globalAPI` to true

#### exclude assets from loaders

Webpack makes all file go through all matching loaders. This libraries need to load a lot of internals resources, including HTML, svg and javascript files (for default extension codes).

We need webpack to let those file untouched:
- the babel loader shouldn't transform extension javascript files
- the html loader shouldn't transform the worker extension host iframe html
- ...

Fortunately, all the assets are loaded via the `new URL('asset.extension', import.meta.url)` syntax, and webpack provide a way to exclude the file loaded that way: `dependency: { not: ['url'] }` see https://webpack.js.org/guides/asset-modules/

### If you use Vite

This library uses a lot the `new URL('asset.extension', import.meta.url)` syntax which [is supported by vite](https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url)

While it works great in `build` mode (because rollup is used), there is some issues in `watch` mode:

- import.meta.url is not replaced while creating bundles, it is an issue when the syntax is used inside a dependency
- vite is still trying to inject/transform javascript assets files, breaking the code by injecting ESM imports in commonjs files

There are workarounds for both:

- We can help vite by replacing `import.meta.url` by the original module path:

```typescript
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'

{
  ...
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importMetaUrlPlugin]
    }
  }
}
```

### If using Angular and getting `Not allowed to load local resource:` errors

*The short version*: set up and use a custom webpack config file and add this under `module`:

```typescript
parser: {
  javascript: {
    url: true,
  }
}
```

See [this issue](https://github.com/CodinGame/monaco-vscode-api/issues/186) or this [StackOverflow answer](https://stackoverflow.com/a/75252098) for more details, and [this discussion](https://github.com/angular/angular-cli/issues/24617) for more context.

### The typescript language features extension is not providing project-wide intellisense

The typescript language features extensions requires [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) to enable project wide intellisense or only a per-file intellisense is provided.

It requires [crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated) to be true, which requires assets files to be servers with some specific headers:

- [Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy): `same-origin`
- [Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy): `require-corp` or `credentialless`

At least thoses files should have the headers:

- the main page html
- the worker extension host iframe html: `webWorkerExtensionHostIframe.html`
- the worker extension host worker javascript: `extensionHost.worker.js`

If adding those headers is not an options, you can have a look at <https://github.com/gzuidhof/coi-serviceworker>, but only if you are not using webviews as it introduces problems then.

## History

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
