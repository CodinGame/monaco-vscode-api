# @codingame/monaco-vscode-api &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-vscode-api)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-vscode-api.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-vscode-api/pulls)

[NPM module](https://www.npmjs.com/) that implements the VSCode api and redirects calls to Monaco editor.

The VSCode api is composed of:

- A lot of classes and tools, which are exported the same way as in VSCode.
- Some features that are supported by Monaco (Language feature registrations...) which are just forwarded to it (with some transformations)
- Some features that are not supported by Monaco, and in such case:
  - If it's an important feature: we let the user implement it as they wish.
  - If it's some advanced features that don't make a lot of sense on Monaco (debug, tests...), it just throws an error when you try to use it.


To implement by hands the optional features (type hierarchy, call hierarchy...), you can use the `Services` namespace from `vscode/services`:
```typescript
import { Services } from 'vscode/services'
Services.install({
   languages: {
       registerTypeHierarchyProvider (documentSelector, provider) {
           ...
       }
   }
})
```



### Installation

```bash
npm install vscode@npm:@codingame/monaco-vscode-api
npm install -D @types/vscode
```

### Usage

Just import it as if you were in a vscode extension:

```typescript
import * as vscode from 'vscode'

const range = new new vscode.Range(...)
vscode.languages.registerCompletionItemProvider(...)
```
