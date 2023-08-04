import { IDialogService } from 'vscode/services'
import { registerCustomView, registerEditorPane, ViewContainerLocation } from 'vscode/service-override/views'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import iconUrl from '../Visual_Studio_Code_1.35_icon.svg?url'

registerCustomView({
  id: 'custom-view',
  name: 'Custom demo view',
  order: 0,
  default: true,
  renderBody: function (container: HTMLElement): monaco.IDisposable {
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML = 'This is a custom view<br />You can render anything you want here'

    return {
      dispose () {
      }
    }
  },
  location: ViewContainerLocation.Panel,
  icon: new URL(iconUrl, window.location.href).toString(),
  actions: [{
    id: 'custom-action',
    title: 'Custom action',
    render (element) {
      const button = document.createElement('button')
      button.innerText = 'Ugly button'
      button.style.height = '30px'
      button.onclick = () => {
        alert('What did you expect?')
      }
      element.append(button)
    }
  }, {
    id: 'custom-action2',
    title: 'Custom action2',
    icon: 'dialogInfo',
    async run (accessor) {
      void accessor.get(IDialogService).info('This is a custom view action button')
    }
  }]
})

const { CustomEditorInput } = registerEditorPane({
  id: 'custom-editor-pane',
  name: 'Custom editor pane',
  renderBody (container) {
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML = 'This is a custom editor pane<br />You can render anything you want here'

    return {
      dispose () {
      }
    }
  }
})

export { CustomEditorInput }
