import { IProductService } from 'vs/platform/product/common/productService'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const thisWithVSCodeParams = globalThis as typeof globalThis & {
  _VSCODE_PRODUCT_JSON: Partial<IProductService>
  _VSCODE_PACKAGE_JSON: { version: string }
}

// Initialize the product information for the server, including the extension gallery URL.
thisWithVSCodeParams._VSCODE_PRODUCT_JSON = {
  extensionsGallery: {
    serviceUrl: 'https://open-vsx.org/vscode/gallery',
    itemUrl: 'https://open-vsx.org/vscode/item',
    resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
    controlUrl: '',
    nlsBaseUrl: '',
    publisherUrl: ''
  }
}
thisWithVSCodeParams._VSCODE_PACKAGE_JSON = {
  version: VSCODE_VERSION
}

const PRODUCT_JSON_PATH = process.env.PRODUCT_JSON_PATH
if (PRODUCT_JSON_PATH != null) {
  const productJson = await fs.readFile(PRODUCT_JSON_PATH, { encoding: 'utf8' })
  Object.assign(thisWithVSCodeParams._VSCODE_PRODUCT_JSON, JSON.parse(productJson))
}

// Create a directory for system extensions to be installed in, VSCode
// will try to read this folder to find system extensions, and will
// error if it does not exist.
const currentDirPath = fileURLToPath(import.meta.url)
await fs.mkdir(path.join(currentDirPath, 'extensions'), { recursive: true })

import('./server-main')
