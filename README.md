# @codingame/monaco-vscode-api &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-vscode-api)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-vscode-api.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-vscode-api) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-vscode-api/pulls)

[NPM module](https://www.npmjs.com/) that respects the vscode api and redirect calls to monaco editor.

Some features not supported by monaco (type hierarchy, call hierarchy...) can be implemented by hands:
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

Just import it as if you were in a vscode extensions:

```typescript
import * as vscode from 'vscode'

const range = new new vscode.Range(...)
vscode.languages.registerCompletionItemProvider(...)
```

