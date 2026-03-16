import { ExtensionHostKind, registerExtension } from '@codingame/monaco-vscode-api/extensions'
import * as vscode from 'vscode'

const { getApi } = registerExtension(
  {
    name: 'aiDemo',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    },
    contributes: {
      commands: [
        {
          command: 'aiSuggestedCommand',
          title: 'This is a command suggested by the AI'
        }
      ],
      chatParticipants: [
        {
          id: 'codingame.aiDemo.participant',
          fullName: 'Codingame AI',
          name: 'codingame-ai',
          isDefault: true,
          modes: ['agent']
        }
      ],
      languageModelChatProviders: [
        {
          vendor: 'coddingame.aiDemo.modelProvider',
          displayName: 'Codingame provider'
        }
      ],
      languageModelTools: [
        {
          name: 'codingame-tool',
          toolReferenceName: 'codingame-tool',
          displayName: 'Codingame tool',
          userDescription: 'A tool that multiply a number by two',
          modelDescription: 'Use this tool to get the result of a multiplication by two',
          canBeReferencedInPrompt: true,
          inputSchema: {
            type: 'object',
            properties: {
              value: {
                type: 'number'
              }
            },
            required: ['value'],
            additionalProperties: false
          }
        }
      ]
    },
    enabledApiProposals: [
      'aiRelatedInformation',
      'mappedEditsProvider',
      'chatSessionsProvider',
      'defaultChatParticipant',
      'chatParticipantAdditions',
      'chatParticipantPrivate',
      'languageModelThinkingPart'
    ]
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true // to be able to use api proposals
  }
)

void getApi().then(async (vscodeApi) => {
  vscodeApi.commands.registerCommand('aiSuggestedCommand', () => {
    void vscodeApi.window.showInformationMessage('Hello', {
      detail: 'You just run the AI suggested command',
      modal: true
    })
  })
  vscodeApi.ai.registerRelatedInformationProvider(
    vscodeApi.RelatedInformationType.CommandInformation,
    {
      provideRelatedInformation() {
        return [
          {
            type: vscode.RelatedInformationType.CommandInformation,
            command: 'aiSuggestedCommand',
            weight: 9999
          }
        ]
      }
    }
  )

  interface CodingameToolParameters {
    value: number
  }

  class CodingameTool implements vscode.LanguageModelTool<CodingameToolParameters> {
    async invoke(
      options: vscode.LanguageModelToolInvocationPrepareOptions<CodingameToolParameters>
    ) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart('The result is: ' + options.input.value * 2)
      ])
    }

    async prepareInvocation(
      options: vscode.LanguageModelToolInvocationPrepareOptions<CodingameToolParameters>
    ): Promise<vscode.PreparedToolInvocation> {
      const confirmationMessages = {
        title: vscode.l10n.t('Use Codingame tool'),
        message: new vscode.MarkdownString(
          'AI wants to get the double of `' + options.input.value + '`'
        )
      }

      return {
        invocationMessage: new vscode.MarkdownString(
          'Doubling the value `' + options.input.value + '`'
        ),
        confirmationMessages
      }
    }
  }

  vscodeApi.lm.registerTool('codingame-tool', new CodingameTool())

  const _onDidChangeLanguageModelChatInformation = new vscodeApi.EventEmitter<void>()

  vscodeApi.lm.registerLanguageModelChatProvider('coddingame.aiDemo.modelProvider', {
    provideLanguageModelChatInformation() {
      return [
        {
          id: 'codingame',
          capabilities: {
            toolCalling: true
          },
          family: 'codingame',
          maxInputTokens: 1000000,
          maxOutputTokens: 1000000,
          name: 'Codingame',
          version: '1.0.0',
          isDefault: true,
          isUserSelectable: true
        }
      ]
    },
    async provideTokenCount() {
      return 0
    },
    async provideLanguageModelChatResponse(
      _model,
      _messages,
      _options,
      progress: vscode.Progress<vscode.LanguageModelResponsePart2>
    ) {
      progress.report(new vscode.LanguageModelThinkingPart('Think', 'thinkId'))
      await new Promise((resolve) => setTimeout(resolve, 300))
      progress.report(new vscode.LanguageModelThinkingPart('ing...', 'thinkId'))
      await new Promise((resolve) => setTimeout(resolve, 1000))
      progress.report(
        new vscode.LanguageModelToolCallPart('callId', 'codingame-tool', { value: 21 })
      )
      await new Promise((resole) => setTimeout(resole, 2000))
      progress.report(new vscode.LanguageModelTextPart('Tool'))
      await new Promise((resole) => setTimeout(resole, 300))
      progress.report(new vscode.LanguageModelTextPart(' called\n'))
    },
    onDidChangeLanguageModelChatInformation: _onDidChangeLanguageModelChatInformation.event
  })

  _onDidChangeLanguageModelChatInformation.fire()

  vscodeApi.chat.createChatParticipant(
    'codingame.aiDemo.participant',
    async (
      request: vscode.ChatRequest,
      _context: vscode.ChatContext,
      response: vscode.ChatResponseStream
    ) => {
      const modelResponse = await request.model.sendRequest([
        vscodeApi.LanguageModelChatMessage.User(request.prompt)
      ])
      for await (const part of modelResponse.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          response.markdown(part.value)
        } else if (part instanceof vscode.LanguageModelThinkingPart) {
          response.thinkingProgress({
            id: part.id,
            text: part.value,
            metadata: part.metadata
          })
        } else if (part instanceof vscode.LanguageModelToolCallPart) {
          const res = await vscode.lm.invokeTool(part.name, {
            toolInvocationToken: request.toolInvocationToken,
            input: part.input
          })
          let toolResult = ''
          for (const toolPart of res.content) {
            if (toolPart instanceof vscode.LanguageModelTextPart) {
              toolResult += toolPart.value
            }
          }
          response.markdown('Tool result: `' + toolResult + '`\n')
        }
      }

      const firstFile = request.references[0]?.value
      if (firstFile != null && firstFile instanceof vscodeApi.Uri) {
        response.textEdit(
          request.references[0]!.value as vscode.Uri,
          vscodeApi.TextEdit.replace(new vscodeApi.Range(5, 0, 7, 0), 'Hello world')
        )
      }
    }
  )
})
