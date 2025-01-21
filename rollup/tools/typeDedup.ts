import ts from 'typescript'

function createEntityName(names: string[]): ts.EntityName {
  if (names.length === 1) {
    return ts.factory.createIdentifier(names[0]!)
  }
  const identifiers = names.map((name) => ts.factory.createIdentifier(name))

  let qualifiedName = ts.factory.createQualifiedName(identifiers.shift()!, identifiers.shift()!)
  while (identifiers.length > 0) {
    qualifiedName = ts.factory.createQualifiedName(qualifiedName, identifiers.shift()!)
  }

  return qualifiedName
}
function replaceInterface(int: ts.InterfaceDeclaration, from: string, entityName: string[]) {
  const importType = ts.factory.createImportTypeNode(
    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(from)),
    undefined,
    createEntityName(entityName),
    int.typeParameters?.map((param) => ts.factory.createTypeReferenceNode(param.name)),
    false
  )

  return ts.factory.createTypeAliasDeclaration(undefined, int.name, int.typeParameters, importType)
}
function createReplacer(from: string, names: string[]): (int: ts.InterfaceDeclaration) => ts.Node {
  return (int: ts.InterfaceDeclaration) => replaceInterface(int, from, names)
}

const interfaceOverride = new Map<string, (int: ts.InterfaceDeclaration) => ts.Node>()
interfaceOverride.set('Event', createReplacer('vscode', ['Event']))
interfaceOverride.set(
  'IActionDescriptor',
  createReplacer('vs/editor/editor.api', ['editor', 'IActionDescriptor'])
)
interfaceOverride.set(
  'ICodeEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'ICodeEditor'])
)
interfaceOverride.set('IEditor', createReplacer('vs/editor/editor.api', ['editor', 'IEditor']))
interfaceOverride.set(
  'ITextModel',
  createReplacer('vs/editor/editor.api', ['editor', 'ITextModel'])
)
interfaceOverride.set(
  'IEditorOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IEditorOptions'])
)
interfaceOverride.set(
  'IEditorOverrideServices',
  createReplacer('vs/editor/editor.api', ['editor', 'IEditorOverrideServices'])
)
interfaceOverride.set(
  'IStandaloneCodeEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneCodeEditor'])
)
interfaceOverride.set(
  'IStandaloneDiffEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneDiffEditor'])
)
interfaceOverride.set(
  'IStandaloneEditorConstructionOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneEditorConstructionOptions'])
)
interfaceOverride.set(
  'IStandaloneDiffEditorConstructionOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneDiffEditorConstructionOptions'])
)

export function typeDedupReplaceTransformer(context: ts.TransformationContext) {
  return (rootNode: ts.Node): ts.Node => {
    const sourceFile = rootNode.getSourceFile()
    const fileName = sourceFile.fileName
    if (!fileName.includes('vs/editor') && !fileName.includes('vs/base')) {
      return rootNode
    }
    if (fileName.endsWith('editor.api.d.ts')) {
      return rootNode
    }

    function typeDedupReplaceVisitor(node: ts.Node): ts.Node {
      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text
        const replacement = interfaceOverride.get(name)
        if (replacement != null) {
          const nodeReplacement = replacement(node)
          return nodeReplacement
        }
      }
      return ts.visitEachChild(node, typeDedupReplaceVisitor, context)
    }

    return ts.visitNode(rootNode, typeDedupReplaceVisitor)
  }
}
