import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'vscode/services': resolve(__dirname, './dist/services.js'),
      'vscode/service-override/messages': resolve(__dirname, './dist/messages.js'),
      'vscode/service-override/notifications': resolve(__dirname, './dist/notifications.js'),
      'vscode/service-override/dialogs': resolve(__dirname, './dist/dialogs.js'),
      'vscode/service-override/modelEditor': resolve(__dirname, './dist/modelEditor.js'),
      'vscode/service-override/configuration': resolve(__dirname, './dist/configuration.js'),
      'vscode/service-override/keybindings': resolve(__dirname, './dist/keybindings.js'),
      'vscode/service-override/textmate': resolve(__dirname, './dist/textmate.js'),
      'vscode/service-override/languageConfiguration': resolve(__dirname, './dist/languageConfiguration.js'),
      'vscode/service-override/theme': resolve(__dirname, './dist/theme.js'),
      'vscode/service-override/tokenClassification': resolve(__dirname, './dist/tokenClassification.js'),
      'vscode/service-override/snippets': resolve(__dirname, './dist/snippets.js'),
      'vscode/service-override/languages': resolve(__dirname, './dist/languages.js'),
      'vscode/monaco': resolve(__dirname, './dist/monaco.js'),
      vscode: resolve(__dirname, './dist/api.js'),
      'webpack-loader': resolve(__dirname, './dist/webpack-loader.js')
    }
  }
})
