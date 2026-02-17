const vscode = require('vscode')

vscode.commands.registerCommand('aiSuggestedCommand', () => {
  void vscode.window.showInformationMessage('Hello', {
    detail: 'You just run the AI suggested command',
    modal: true
  })
})
vscode.ai.registerRelatedInformationProvider(vscode.RelatedInformationType.CommandInformation, {
  provideRelatedInformation() {
    return [
      {
        type: vscode.RelatedInformationType.CommandInformation,
        command: 'aiSuggestedCommand',
        weight: 9999
      }
    ]
  }
})

console.log('registerLanguageModelChatProvider')
vscode.lm.registerLanguageModelChatProvider('toto', {
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
    progress.report(new vscode.LanguageModelTextPart('Response from model ' + model.id))
  },
  onDidChangeLanguageModelChatInformation: new vscode.EventEmitter().event
})

const participant = vscode.chat.createChatParticipant(
  'toto',
  async (request, context, response) => {
    console.log('Participant', request, context)

    response.progress(
      `Thinking about "${request.prompt}" with ${request.references.map((r) => r.value?.toString()).join(', ')}...`
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(vscode.lm.tools)
    vscode.lm.invokeTool('run_in_terminal', {
      toolInvocationToken: undefined,
      input: {
        command: 'echo Hello world',
        explanation: 'I want to run this command in the terminal to show how tool invocation works',
        goal: 'Show how to use tool invocation in the API',
        isBackground: false,
        timeout: 10000
      }
    })
    // vscode.ai.invokeTool()

    const firstFile = request.references[0]?.value
    if (firstFile != null && firstFile instanceof vscode.Uri) {
      response.textEdit(
        request.references[0].value,
        vscode.TextEdit.replace(new vscode.Range(5, 0, 6, 99), 'Hello world')
      )
      response.markdown(`Here's your changes!`)
    } else {
      const modelResponse = await request.model.sendRequest([
        vscode.LanguageModelChatMessage.User('toto')
      ])

      response.progress(`Calling the model ${request.model.id}...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      for await (const test of modelResponse.text) {
        response.markdown(`Model answer: ${test}`)
      }
    }
  }
)

vscode.chat.registerChatSessionContentProvider(
  'toto',
  {
    async provideChatSessionContent(resource) {
      console.log('provideChatSessionContent', resource)
      return {
        history: [
          new vscode.ChatRequestTurn('toto', undefined, [], participant.id, []),
          new vscode.ChatRequestTurn('tata', undefined, [], participant.id, [])
        ],
        requestHandler() {
          console.log('requestHandler')
        }
      }
    }
  },
  participant
)

// const controller = vscode.chat.createChatSessionItemController('toto')
// const item = controller.createChatSessionItem(vscode.Uri.parse('toto:///test'), 'Toto')

// vscode.chat.registerChatSessionItemProvider('toto', {
//   onDidChangeChatSessionItems: new vscode.EventEmitter().event,

//   provideChatSessionItems(token) {
//     console.log('provideChatSessionItems')
//     return [
//       {
//         archived: false,
//         status: vscode.ChatSessionStatus.Completed,
//         resource: vscode.Uri.parse('toto:///test'),
//         label: 'Toto'
//       }
//     ]
//   },

//   onDidCommitChatSessionItem: new vscode.EventEmitter().event
// })
