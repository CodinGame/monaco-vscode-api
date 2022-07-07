export * from 'vs/workbench/services/textfile/common/textFileEditorModel'

// Replace right TextFileEditorModel implementation by an empty class
// This class is only used in an `instanceof` always false but pulls a lot of code
export class TextFileEditorModel {}
