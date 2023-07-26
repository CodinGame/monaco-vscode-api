export * from 'vscode/vs/platform/dialogs/common/dialogs'

// export it as non-const enum (because const enum should never be exported: https://ncjamieson.com/dont-export-const-enums/)
export enum ConfirmResult {
  SAVE,
  DONT_SAVE,
  CANCEL
}
