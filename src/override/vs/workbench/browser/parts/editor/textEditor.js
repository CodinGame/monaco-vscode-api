export * from 'vs/workbench/browser/parts/editor/textEditor'

// Replace right AbstractTextEditor implementation by an empty class
// This class is only used in an `instanceof` always false but pulls a lot of code
export class AbstractTextEditor {}
