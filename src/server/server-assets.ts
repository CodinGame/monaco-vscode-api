import { registerAssets } from '../assets'

registerAssets({
  'vs/code/browser/workbench/workbench.html': new URL('vs/code/browser/workbench/workbench.html', import.meta.url).toString(),
  'bootstrap-fork': new URL('bootstrap-fork.js', import.meta.url).toString()
})
