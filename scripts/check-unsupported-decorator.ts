import { Project } from 'ts-morph'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
const sourceFile = project.getSourceFileOrThrow('src/missing-services.ts')

const issues: string[] = []

for (const cls of sourceFile.getClasses()) {
  for (const prop of cls.getProperties()) {
    const initText = prop.getInitializer()?.getText().trim()
    const usesUnsupported = initText === 'unsupported'
    const hasDecorator = prop.getDecorator('Unsupported') != null

    const loc = `${cls.getName()}.${prop.getName()} (line ${prop.getStartLineNumber()})`

    if (usesUnsupported && !hasDecorator) {
      issues.push(`❌ ${loc}: uses \`unsupported\` but is missing the @Unsupported decorator`)
    }
    if (!usesUnsupported && hasDecorator) {
      issues.push(`❌ ${loc}: has @Unsupported decorator but does not use \`unsupported\``)
    }
  }
}

if (issues.length) {
  console.error(issues.join('\n'))
  process.exit(1)
}
console.log('✅ All consistent')