import type * as vscode from 'vscode'
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'

const { getApi } = registerExtension({
  name: 'testing',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  },
  enabledApiProposals: ['testCoverage']
}, ExtensionHostKind.LocalProcess, {
  system: true
})

void getApi().then(async api => {
  const testRe = /^([0-9]+)\s*([+*/-])\s*([0-9]+)\s*=\s*([0-9]+)/
  const headingRe = /^(#+)\s*(.+)$/

  const parseMarkdown = (text: string, events: {
    onTest(range: vscode.Range, a: number, operator: string, b: number, expected: number): void
    onHeading(range: vscode.Range, name: string, depth: number): void
  }): void => {
    const lines = text.split('\n')

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      const line = lines[lineNo]
      const test = testRe.exec(line)
      if (test != null) {
        const [, a, operator, b, expected] = test
        const range = new api.Range(new api.Position(lineNo, 0), new api.Position(lineNo, test[0].length))
        events.onTest(range, Number(a), operator, Number(b), Number(expected))
        continue
      }

      const heading = headingRe.exec(line)
      if (heading != null) {
        const [, pounds, name] = heading
        const range = new api.Range(new api.Position(lineNo, 0), new api.Position(lineNo, line.length))
        events.onHeading(range, name, pounds.length)
      }
    }
  }

  const textDecoder = new TextDecoder('utf-8')

  type MarkdownTestData = TestFile | TestHeading | TestCase

  const testData = new WeakMap<vscode.TestItem, MarkdownTestData>()

  let generationCounter = 0

  const getContentFromFilesystem = async (uri: vscode.Uri): Promise<string> => {
    try {
      const rawContent = await api.workspace.fs.readFile(uri)
      return textDecoder.decode(rawContent)
    } catch (e) {
      console.warn(`Error providing tests for ${uri.fsPath}`, e)
      return ''
    }
  }

  class TestFile {
    public didResolve = false

    public async updateFromDisk (controller: vscode.TestController, item: vscode.TestItem): Promise<void> {
      try {
        const content = await getContentFromFilesystem(item.uri!)
        item.error = undefined
        this.updateFromContents(controller, content, item)
      } catch (e) {
        item.error = (e as Error).stack
      }
    }

    /**
   * Parses the tests from the input text, and updates the tests contained
   * by this file to be those from the text,
   */
    public updateFromContents (controller: vscode.TestController, content: string, item: vscode.TestItem): void {
      const ancestors = [{ item, children: [] as vscode.TestItem[] }]
      const thisGeneration = generationCounter++
      this.didResolve = true

      const ascend = (depth: number) => {
        while (ancestors.length > depth) {
          const finished = ancestors.pop()!
          finished.item.children.replace(finished.children)
        }
      }

      parseMarkdown(content, {
        onTest: (range, a, operator, b, expected) => {
          const parent = ancestors[ancestors.length - 1]
          const data = new TestCase(a, operator as Operator, b, expected, thisGeneration)
          const id = `${item.uri}/${data.getLabel()}`

          const tcase = controller.createTestItem(id, data.getLabel(), item.uri)
          testData.set(tcase, data)
          tcase.range = range
          parent.children.push(tcase)
        },

        onHeading: (range, name, depth) => {
          ascend(depth)
          const parent = ancestors[ancestors.length - 1]
          const id = `${item.uri}/${name}`

          const thead = controller.createTestItem(id, name, item.uri)
          thead.range = range
          testData.set(thead, new TestHeading(thisGeneration))
          parent.children.push(thead)
          ancestors.push({ item: thead, children: [] })
        }
      })

      ascend(0) // finish and assign children for all remaining items
    }
  }

  class TestHeading {
    constructor (public generation: number) { }
  }

  type Operator = '+' | '-' | '*' | '/'

  class TestCase {
    constructor (
      private readonly a: number,
      private readonly operator: Operator,
      private readonly b: number,
      private readonly expected: number,
      public generation: number
    ) { }

    getLabel (): string {
      return `${this.a} ${this.operator} ${this.b} = ${this.expected}`
    }

    async run (item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
      const start = Date.now()
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
      const actual = this.evaluate()
      const duration = Date.now() - start

      if (actual === this.expected) {
        options.passed(item, duration)
      } else {
        const message = api.TestMessage.diff(`Expected ${item.label}`, String(this.expected), String(actual))
        message.location = new api.Location(item.uri!, item.range!)
        options.failed(item, message, duration)
      }
    }

    private evaluate () {
      switch (this.operator) {
        case '-':
          return this.a - this.b
        case '+':
          return this.a + this.b
        case '/':
          return Math.floor(this.a / this.b)
        case '*':
          return this.a * this.b
      }
    }
  }

  const ctrl = api.tests.createTestController('mathTestController', 'Markdown Math')

  const fileChangedEmitter = new api.EventEmitter<vscode.Uri>()
  const watchingTests = new Map<vscode.TestItem | 'ALL', vscode.TestRunProfile | undefined>()
  fileChangedEmitter.event(uri => {
    if (watchingTests.has('ALL')) {
      startTestRun(new api.TestRunRequest(undefined, undefined, watchingTests.get('ALL'), true))
      return
    }

    const include: vscode.TestItem[] = []
    let profile: vscode.TestRunProfile | undefined
    for (const [item, thisProfile] of watchingTests) {
      const cast = item as vscode.TestItem
      if (cast.uri?.toString() === uri.toString()) {
        include.push(cast)
        profile = thisProfile
      }
    }

    if (include.length > 0) {
      startTestRun(new api.TestRunRequest(include, undefined, profile, true))
    }
  })

  const runHandler = (request: vscode.TestRunRequest, cancellation: vscode.CancellationToken) => {
    if (!(request.continuous ?? false)) {
      return startTestRun(request)
    }

    if (request.include === undefined) {
      watchingTests.set('ALL', request.profile)
      cancellation.onCancellationRequested(() => watchingTests.delete('ALL'))
    } else {
      request.include.forEach(item => watchingTests.set(item, request.profile))
      cancellation.onCancellationRequested(() => request.include!.forEach(item => watchingTests.delete(item)))
    }
  }

  const startTestRun = (request: vscode.TestRunRequest) => {
    const queue: { test: vscode.TestItem, data: TestCase }[] = []
    const run = ctrl.createTestRun(request)
    // map of file uris to statements on each line:
    type OptionalStatementCoverage = vscode.StatementCoverage | undefined
    const coveredLines = new Map</* file uri */ string, OptionalStatementCoverage[]>()

    const discoverTests = async (tests: Iterable<vscode.TestItem>) => {
      for (const test of tests) {
        if (request.exclude?.includes(test) ?? false) {
          continue
        }

        const data = testData.get(test)
        if (data instanceof TestCase) {
          run.enqueued(test)
          queue.push({ test, data })
        } else {
          if (data instanceof TestFile && !data.didResolve) {
            await data.updateFromDisk(ctrl, test)
          }

          await discoverTests(gatherTestItems(test.children))
        }

        if (test.uri != null && !coveredLines.has(test.uri.toString())) {
          try {
            const lines = (await getContentFromFilesystem(test.uri)).split('\n')
            coveredLines.set(
              test.uri.toString(),
              lines.map((lineText, lineNo) =>
                lineText.trim().length > 0 ? new api.StatementCoverage(0, new api.Position(lineNo, 0)) : undefined
              )
            )
          } catch {
            // ignored
          }
        }
      }
    }

    const runTestQueue = async () => {
      for (const { test, data } of queue) {
        run.appendOutput(`Running ${test.id}\r\n`)
        if (run.token.isCancellationRequested) {
          run.skipped(test)
        } else {
          run.started(test)
          await data.run(test, run)
        }

        const lineNo = test.range!.start.line
        const fileCoverage = coveredLines.get(test.uri!.toString())
        const lineInfo = fileCoverage?.[lineNo]
        if (lineInfo != null) {
          lineInfo.executionCount++
        }

        run.appendOutput(`Completed ${test.id}\r\n`)
      }

      run.coverageProvider = {
        provideFileCoverage () {
          const coverage: vscode.FileCoverage[] = []
          for (const [uri, statements] of coveredLines) {
            coverage.push(
              api.FileCoverage.fromDetails(
                api.Uri.parse(uri),
                statements.filter((s): s is vscode.StatementCoverage => s != null)
              )
            )
          }

          return coverage
        }
      }

      run.end()
    }

    void discoverTests(request.include ?? gatherTestItems(ctrl.items)).then(runTestQueue)
  }

  ctrl.refreshHandler = async () => {
    await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => findInitialFiles(ctrl, pattern)))
  }

  ctrl.createRunProfile('Run Tests', api.TestRunProfileKind.Run, runHandler, true, undefined, true)

  ctrl.resolveHandler = async item => {
    if (item == null) {
      startWatchingWorkspace(ctrl, fileChangedEmitter)
      return
    }

    const data = testData.get(item)
    if (data instanceof TestFile) {
      await data.updateFromDisk(ctrl, item)
    }
  }

  function updateNodeForDocument (e: vscode.TextDocument) {
    if (e.uri.scheme !== 'file') {
      return
    }

    if (!e.uri.path.endsWith('.md')) {
      return
    }

    const { file, data } = getOrCreateFile(ctrl, e.uri)
    data.updateFromContents(ctrl, e.getText(), file)
  }

  for (const document of api.workspace.textDocuments) {
    updateNodeForDocument(document)
  }

  api.workspace.onDidOpenTextDocument(updateNodeForDocument)
  api.workspace.onDidChangeTextDocument(e => updateNodeForDocument(e.document))

  function getOrCreateFile (controller: vscode.TestController, uri: vscode.Uri) {
    const existing = controller.items.get(uri.toString())
    if (existing != null) {
      return { file: existing, data: testData.get(existing) as TestFile }
    }

    const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop()!, uri)
    controller.items.add(file)

    const data = new TestFile()
    testData.set(file, data)

    file.canResolveChildren = true
    return { file, data }
  }

  function gatherTestItems (collection: vscode.TestItemCollection) {
    const items: vscode.TestItem[] = []
    collection.forEach(item => items.push(item))
    return items
  }

  function getWorkspaceTestPatterns () {
    if (api.workspace.workspaceFolders == null) {
      return []
    }

    return api.workspace.workspaceFolders.map(workspaceFolder => ({
      workspaceFolder,
      pattern: new api.RelativePattern(workspaceFolder, '**/*.md')
    }))
  }

  async function findInitialFiles (controller: vscode.TestController, pattern: vscode.GlobPattern) {
    for (const file of await api.workspace.findFiles(pattern)) {
      getOrCreateFile(controller, file)
    }
  }

  function startWatchingWorkspace (controller: vscode.TestController, fileChangedEmitter: vscode.EventEmitter<vscode.Uri>) {
    return getWorkspaceTestPatterns().map(({ pattern }) => {
      const watcher = api.workspace.createFileSystemWatcher(pattern)

      watcher.onDidCreate(uri => {
        getOrCreateFile(controller, uri)
        fileChangedEmitter.fire(uri)
      })
      watcher.onDidChange(async uri => {
        const { file, data } = getOrCreateFile(controller, uri)
        if (data.didResolve) {
          await data.updateFromDisk(controller, file)
        }
        fileChangedEmitter.fire(uri)
      })
      watcher.onDidDelete(uri => controller.items.delete(uri.toString()))

      void findInitialFiles(controller, pattern)

      return watcher
    })
  }
})
