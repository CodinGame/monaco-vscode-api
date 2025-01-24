import ts from 'typescript'

export function transformImportEqualsTransformerFactory(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return function transformerFactory(context) {
    return function transformer(sourceFile) {
      if (sourceFile.fileName.endsWith('extension.api.ts')) {
        let exportEqualsFound = false
        function visitor(node: ts.Node): ts.Node {
          // Transform `export = api` to `export { field1, field2, ... } = api` as the first syntax is not supported when generating ESM
          if (ts.isExportAssignment(node) && (node.isExportEquals ?? false)) {
            if (ts.isIdentifier(node.expression)) {
              const declaration = program.getTypeChecker().getSymbolAtLocation(node.expression)!
                .declarations![0]!
              if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer != null &&
                ts.isObjectLiteralExpression(declaration.initializer)
              ) {
                const propertyNames = declaration.initializer.properties.map(
                  (prop) => (prop.name as ts.Identifier).text
                )
                exportEqualsFound = true
                return context.factory.createVariableStatement(
                  [context.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                  context.factory.createVariableDeclarationList(
                    [
                      context.factory.createVariableDeclaration(
                        context.factory.createObjectBindingPattern(
                          propertyNames.map((name) =>
                            context.factory.createBindingElement(
                              undefined,
                              undefined,
                              context.factory.createIdentifier(name)
                            )
                          )
                        ),
                        undefined,
                        undefined,
                        node.expression
                      )
                    ],
                    ts.NodeFlags.Const
                  )
                )
              }
            }
          }
          return node
        }
        const transformed = ts.visitEachChild(sourceFile, visitor, context)
        if (!exportEqualsFound) {
          throw new Error('`export =` not found in api.ts')
        }
        return transformed
      }
      return sourceFile
    }
  }
}
