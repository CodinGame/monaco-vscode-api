import {
  IDialogService,
  EditorInput,
  createInstance,
  IInstantiationService,
  IEditorGroup
} from '@codingame/monaco-vscode-api'
import {
  IEditorCloseHandler,
  IEditorSerializer,
  registerCustomView,
  registerEditorPane,
  registerEditor,
  registerEditorSerializer,
  ViewContainerLocation,
  SimpleEditorPane,
  SimpleEditorInput,
  RegisteredEditorPriority,
  ConfirmResult
} from '@codingame/monaco-vscode-views-service-override'
import * as monaco from 'monaco-editor'

registerCustomView({
  id: 'custom-view',
  name: 'Custom demo view',
  order: 0,
  renderBody: function (container: HTMLElement): monaco.IDisposable {
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.style.height = '100%'
    container.innerHTML = 'This is a custom view<br />You can render anything you want here'

    return {
      dispose() {}
    }
  },
  location: ViewContainerLocation.Panel,
  icon: new URL('../Visual_Studio_Code_1.35_icon.svg', import.meta.url).toString(),
  actions: [
    {
      id: 'custom-action',
      title: 'Custom action',
      render(element) {
        const button = document.createElement('button')
        button.innerText = 'Ugly button'
        button.style.height = '30px'
        button.onclick = () => {
          alert('What did you expect?')
        }
        element.append(button)
      }
    },
    {
      id: 'custom-action2',
      title: 'Custom action2',
      icon: 'dialogInfo',
      async run(accessor) {
        void accessor.get(IDialogService).info('This is a custom view action button')
      }
    }
  ]
})

class CustomEditorPane extends SimpleEditorPane {
  static readonly ID = 'workbench.editors.customEditor'

  constructor(group: IEditorGroup) {
    super(CustomEditorPane.ID, group)
  }

  initialize(): HTMLElement {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML = 'This is a custom editor pane<br />You can render anything you want here'
    return container
  }

  async renderInput(input: EditorInput): Promise<monaco.IDisposable> {
    if (input.resource != null) {
      this.container.innerHTML = 'Opened file: ' + input.resource.path
    } else {
      this.container.innerHTML =
        'This is a custom editor pane<br />You can render anything you want here'
    }

    return {
      dispose() {}
    }
  }
}
class CustomEditorInput extends SimpleEditorInput implements IEditorCloseHandler {
  constructor(
    resource: monaco.Uri | undefined,
    @IDialogService private dialogService: IDialogService
  ) {
    super(resource)

    this.closeHandler = this

    this.setName('Custom editor pane input')
  }

  async confirm(): Promise<number> {
    const { confirmed } = await this.dialogService.confirm({
      message: 'Are you sure you want to close this INCREDIBLE editor pane?'
    })
    return confirmed ? ConfirmResult.DONT_SAVE : ConfirmResult.CANCEL
  }

  showConfirm(): boolean {
    return true
  }

  get typeId(): string {
    return CustomEditorPane.ID
  }
}

registerEditorPane('custom-editor-pane', 'Custom editor pane', CustomEditorPane, [
  CustomEditorInput
])

registerEditor(
  '*.customeditor',
  {
    id: CustomEditorPane.ID,
    label: 'Custom editor pane input',
    priority: RegisteredEditorPriority.default
  },
  {
    singlePerResource: true
  },
  {
    async createEditorInput(editorInput) {
      return {
        editor: await createInstance(CustomEditorInput, editorInput.resource)
      }
    }
  }
)

interface ISerializedCustomEditorInput {
  resourceJSON?: monaco.UriComponents
}
registerEditorSerializer(
  CustomEditorPane.ID,
  class implements IEditorSerializer {
    canSerialize(): boolean {
      return true
    }

    serialize(editor: CustomEditorInput): string | undefined {
      const serializedFileEditorInput: ISerializedCustomEditorInput = {
        resourceJSON: editor.resource?.toJSON()
      }

      return JSON.stringify(serializedFileEditorInput)
    }

    deserialize(
      instantiationService: IInstantiationService,
      serializedEditor: string
    ): EditorInput | undefined {
      const serializedFileEditorInput: ISerializedCustomEditorInput = JSON.parse(serializedEditor)
      return instantiationService.createInstance(
        CustomEditorInput,
        monaco.Uri.revive(serializedFileEditorInput.resourceJSON)
      )
    }
  }
)

export { CustomEditorInput }
