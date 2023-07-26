import { ITerminalChildProcess, SimpleTerminalBackend, SimpleTerminalProcess } from 'vscode/service-override/terminal'
import ansiColors from 'ansi-colors'
import * as vscode from 'vscode'

export class TerminalBackend extends SimpleTerminalBackend {
  override getDefaultSystemShell = async (): Promise<string> => 'fake'
  override createProcess = async (): Promise<ITerminalChildProcess> => {
    const dataEmitter = new vscode.EventEmitter<string>()
    const propertyEmitter = new vscode.EventEmitter<{
      type: string
      value: string
    }>()
    class FakeTerminalProcess extends SimpleTerminalProcess {
      private column = 0
      async start (): Promise<undefined> {
        ansiColors.enabled = true
        dataEmitter.fire(`This is a fake terminal\r\n${ansiColors.green('$')} `)
        setTimeout(() => {
          dataEmitter.fire('\u001B]0;Fake terminal title\u0007')
        }, 0)
        this.column = 2

        return undefined
      }

      override onDidChangeProperty = propertyEmitter.event

      override shutdown (immediate: boolean): void {
        console.log('shutdown', immediate)
      }

      override input (data: string): void {
        for (const c of data) {
          if (c.charCodeAt(0) === 13) {
            dataEmitter.fire(`\r\n${ansiColors.green('$')} `)
            this.column = 2
          } else if (c.charCodeAt(0) === 127) {
            if (this.column > 2) {
              dataEmitter.fire('\b \b')
              this.column--
            }
          } else {
            dataEmitter.fire(c)
            this.column++
          }
        }
      }

      resize (cols: number, rows: number): void {
        console.log('resize', cols, rows)
      }

      override clearBuffer (): void | Promise<void> {
      }
    }
    return new FakeTerminalProcess(1, 1, '/tmp', dataEmitter.event)
  }
}
