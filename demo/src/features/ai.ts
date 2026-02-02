import { ExtensionHostKind, registerExtension } from '@codingame/monaco-vscode-api/extensions'
import type * as vscode from 'vscode'

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
          id: 'toto',
          fullName: 'toto',
          name: 'toto',
          isDefault: true
        }
      ],
      languageModelChatProviders: [
        {
          vendor: 'toto',
          displayName: 'Toto'
        }
      ]
    },
    enabledApiProposals: [
      'aiRelatedInformation',
      'mappedEditsProvider',
      'chatSessionsProvider',
      'defaultChatParticipant',
      'chatParticipantAdditions'
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
            type: vscodeApi.RelatedInformationType.CommandInformation,
            command: 'aiSuggestedCommand',
            weight: 9999
          }
        ]
      }
    }
  )

  vscodeApi.lm.registerLanguageModelChatProvider('toto', {
    provideLanguageModelChatInformation(options, token) {
      console.log('provideLanguageModelChatInformation', options, token)
      return [
        {
          id: 'toto',
          capabilities: {},
          family: 'toto',
          maxInputTokens: 1000000,
          maxOutputTokens: 1000000,
          name: 'Toto',
          version: '1.0.0',
          isDefault: true,
          isUserSelectable: true
        },
        {
          id: 'Tata',
          capabilities: {},
          family: 'tata',
          maxInputTokens: 1000000,
          maxOutputTokens: 1000000,
          name: 'tata',
          version: '1.0.0',
          isUserSelectable: true
        }
      ]
    },
    async provideTokenCount(model, text, token) {
      return 0
    },
    async provideLanguageModelChatResponse(model, messages, options, progress) {
      console.log('provideLanguageModelChatResponse', model, messages, options, progress)
      progress.report(new vscodeApi.LanguageModelTextPart('Response from model ' + model.id))
    },
    onDidChangeLanguageModelChatInformation: new vscodeApi.EventEmitter<void>().event
  })

  vscodeApi.chat.createChatParticipant(
    'toto',
    async (
      request: vscode.ChatRequest,
      context: vscode.ChatContext,
      response: vscode.ChatResponseStream
    ) => {
      console.log('Participant', request, context)

      response.progress(
        `Thinking about "${request.prompt}" with ${request.references.map((r) => r.value?.toString()).join(', ')}...`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const firstFile = request.references[0]?.value
      if (firstFile != null && firstFile instanceof vscodeApi.Uri) {
        response.textEdit(
          request.references[0]!.value as vscode.Uri,
          vscodeApi.TextEdit.replace(new vscodeApi.Range(5, 0, 7, 0), 'Hello world')
        )
        response.markdown(`Here's your changes!`)
      } else {
        const modelResponse = await request.model.sendRequest([
          vscodeApi.LanguageModelChatMessage.User('toto')
        ])

        response.progress(`Calling the model ${request.model.id}...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        for await (const test of modelResponse.text) {
          response.markdown(`Model answer: ${test}`)
        }
      }
    }
  )
})
