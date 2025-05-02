# @codingame/monaco-vscode-api &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-vscode-api)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-vscode-api.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-vscode-api/pulls)

This [NPM module](https://www.npmjs.com/) allows to integrate full VSCode functionality into your `monaco-editor`. 

For more information, please checkout the project's [wiki](https://github.com/CodinGame/monaco-vscode-api/wiki).

## Installation

```bash
npm install @codingame/monaco-vscode-api
# Optionally install the extension api and the editor api
npm install vscode@npm:@codingame/monaco-vscode-extension-api
npm install monaco-editor@npm:@codingame/monaco-vscode-editor-api
```

`@codingame/monaco-vscode-extension-api` is installed as an alias to `vscode` to be able to run `import * as vscode from 'vscode'`, similar to what is done inside a VSCode extension

`@codingame/monaco-vscode-editor-api` is installed as an alias to `monaco-editor` because it provides the same api as the official `monaco-editor`

# Usage
If you are just starting with `monaco-editor` and `monaco-vscode-api` you may find helpful the [Getting Started Guide](https://github.com/CodinGame/monaco-vscode-api/wiki/Getting-started-guide) in the wiki.
## Monaco service override

Most of VSCode functionality implemented as "services", e.g. 
- theme service, providing support for VSCode themes
- languages service, providing support for different language features.

By default, Monaco uses a simplified versions of the VSCode services, called `standalone` services. 
This package allows to 
1) override them with fully-functional alternatives from VSCode
2) add new services that were not included in Monaco

Here is an example usage that overrides Monaco default configuration with VSCode json-based settings:
```typescript
// default monaco-editor imports
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// utilities to override Monaco services
import { initialize } from '@codingame/monaco-vscode-api'
import getConfigurationServiceOverride, { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'

window.MonacoEnvironment = {
  getWorker: (_moduleId, _label) => new editorWorker()
}

// overriding Monaco service with VSCode
await initialize({
    ...getConfigurationServiceOverride(),
});

// json config like in vscode settings.json
updateUserConfiguration(`{
    "editor.fontSize": 30,
    "editor.lineHeight": 30,
    "editor.fontFamily": "monospace",
    "editor.fontWeight": "bold",
    "editor.letterSpacing": 0,
}`)

// creating an editor with VSCode configuration
monaco.editor.create(document.getElementById('editor')!, {
    value: "Editor with VSCode config and large bold fonts",
});
```
> [!NOTE]
> `initialize` can only be called once (and it should be called BEFORE creating your first editor).


Each `get<service-name>ServiceOverride` contains the service and some glue to make VSCode service work with Monaco.

### List of service overrides
Some basic service overrides are coming with this package as dependencies:
- **Base**: `@codingame/monaco-vscode-base-service-override`
  - Contains some general-use services that are mandatory to most of the other features
- **Host**: `@codingame/monaco-vscode-host-service-override`
  - Interaction with the host/browser (shutdown veto, focus/active management, window opening, fullscreen...)
- **Extensions**: `@codingame/monaco-vscode-extensions-service-override`
  - Support for VSCode extensions.
  - A worker configuration can be provided to it:
    - Then, the webworker extension host will be available, allowing to run extensions in a worker which runs in an iframe
- **Files**: `@codingame/monaco-vscode-files-service-override`
  - It adds the overlay filesystem for `file://` files, but also adds the support for lazy loaded extension files. It adds separate memory user files (e.g. config, keybindings), cache files and log files
  - It supports adding overlay filesystems for `file://` files
- **QuickAccess**: `@codingame/monaco-vscode-quickaccess-service-override`
  - Enables the quickaccess menu in the editor (press F1 or ctrl+shift+p)

However, most of the services are separated into different modules, so they can be imported as required. You can find a full list of services in the [corresponding wiki page](https://github.com/CodinGame/monaco-vscode-api/wiki/List-of-service-overrides).


### Default vscode extensions

VSCode uses a bunch of default extensions. Most of them are used to load the default languages and grammars (see <https://github.com/microsoft/vscode/tree/main/extensions>).

This library bundles and publishes them as separate packages, which allows to use the ones you want. To use an extension, just install the corresponding package and import it in the beginning of the file:

```typescript
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
...
```

Here is an example of usage of default VSCode theme extension with theme service override:

```typescript
// importing default VSCode theme extension
import "@codingame/monaco-vscode-theme-defaults-default-extension";	

// default monaco-editor imports
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// utilities to override Monaco services
import { initialize } from '@codingame/monaco-vscode-api'
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";

window.MonacoEnvironment = {
  getWorker: function (_moduleId, _label) {
	return new editorWorker();
  }
}

// overriding Monaco service with VSCode
await initialize({
    ...getThemeServiceOverride(),
});

// creating an editor with VSCode theme
monaco.editor.create(document.getElementById('editor')!, {
    value: "Editor with VSCode Theme Support",
});
```

See [the full list of ported default extensions](https://www.npmjs.com/search?q=%40codingame%2Fmonaco-vscode-*-default-extension)

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

⚠️ The language pack should be imported and loaded BEFORE anything else from this library is loaded. Otherwise, some translations would be missing and an error would be displayed in the console. ⚠️


## Model creation

The official `monaco-editor` package provides a function to create models: `monaco.editor.createModel`.

This method creates a standalone model that cannot be found or used by any VSCode services.

The recommended way is to used the `createModelReference` method instead (added on top of the official monaco-editor api) which returns instead a reference to a model.

It has some pros:

- The model reference can be used by VSCode services, allowing for instance following links between files (ctrl+click)
- The returned model is bound to a filesystem file, and you have access to methods allowing to control the file lifecycle (saving the file, accessing the dirty state...)
- It is possible to call the method multiple times on the same file to get multiple references. The model is disposed when there is no reference left

To work, it needs the file to exist on the virtual filesystem. It can be achieved either by:
- using the `registerFileSystemOverlay` from the files service override, which can be cleaned when not needed anymore (recommended)
- by using the second argument of the `createModelReference` function, which writes the file content to the virtual filesystem before creating the model

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
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override'

const fileUri = monaco.Uri.file(<file uri>);

const fileSystemProvider = new RegisteredFileSystemProvider(false)
fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, <file content>))
const overlayDisposable = registerFileSystemOverlay(1, fileSystemProvider)

const modelRef = await monaco.editor.createModelReference(fileUri)

const editor = monaco.editor.create({ model: modelRef.object.textEditorModel })

...

await modelRef.object.save()

...

modelRef.dispose()
editor.dispose()
overlayDisposable.dispose()

```

`createModelReference` return a reference to a model. The value is fetched from the memory filesystem.
The reference can then be disposed, the model will only be disposed if there is no remaining references.

## VSCode api usage

To be able to use the VSCode api directly from your code, you need to import `vscode/localExtensionHost` and wait for the services to be initialized.

You will then be able to import it as if you were in a VSCode extension:

```typescript
import * as vscode from 'vscode'
import 'vscode/localExtensionHost'

const range = new vscode.Range(...)
vscode.languages.registerCompletionItemProvider(...)
```

You can also register a new extension from its manifest:

```typescript
import { registerExtension, initialize, ExtensionHostKind } from '@codingame/monaco-vscode-api/extensions'

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

### Demo

Try it out on <https://monaco-vscode-api.netlify.app/>

There is a demo that showcases the service-override features.
It includes:
- Languages
- VSCode themes
- Textmate grammars (requires VSCode themes)
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

See the [VSCode Server](https://github.com/CodinGame/monaco-vscode-api/wiki/How-to-install-and-use-VSCode-server-with-monaco‐vscode‐api) wiki page.

## Shadow dom (⚠️ beta ⚠️)

The library supports shadow-dom.

⚠️ VSCode itself does support shadow dom, and there are multiple parts that needed to be patched in order for it to work.

There are multiple benefits of using it:
- Your custom global style won't impact the VSCode workbench style (for instance if you did override the default [box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing))
- The VSCode styles won't impact other parts of your app
- You page head won't be polluted with dozen of css files from VSCode

### How to use it

If the provided container element is a child of a shadow dom element, the styles will be injected in both the main page and the shadow root. That's it.

### Prerequisites

In order to be able to load the static css files in the shadow dom as well. Your bundler configuration needs to be adapted so that importing css files doesn't load their content in the page head, but instead just returns the file content as default. It can be achieved with most bundlers with some configurations.

#### Webpack
Add this rule in your configuration:
```typescript
{
  test: /node_modules\/(@codingame\/monaco-vscode|vscode|monaco-editor).*\.css$/,
  type: 'asset/source'
}
```

#### Vite
Add this plugin in your configuration:
```typescript
{
  name: 'load-vscode-css-as-string',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    const resolved = (await this.resolve(source, importer, options))!
    if (
      resolved.id.match(
        /node_modules\/(@codingame\/monaco-vscode|vscode|monaco-editor).*\.css$/
      )
    ) {
      return {
        ...resolved,
        id: resolved.id + '?inline'
      }
    }
    return undefined
  }
}
```

## Troubleshooting

If something doesn't work, make sure to check out the [Troubleshooting](https://github.com/CodinGame/monaco-vscode-api/wiki/Troubleshooting) wiki page.

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
