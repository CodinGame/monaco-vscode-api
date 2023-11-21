import { IProductService } from 'vs/platform/product/common/productService'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import VSCODE_PACKAGE_JSON from '../../vscode/package.json' assert { type: 'json' }

const thisWithVSCodeParams = globalThis as typeof globalThis & {
  _VSCODE_PRODUCT_JSON: Partial<IProductService>
  _VSCODE_PACKAGE_JSON: { version: string }
}

const WEB_ENDPOINT_URL_TEMPLATE = process.env.WEB_ENDPOINT_URL_TEMPLATE
if (WEB_ENDPOINT_URL_TEMPLATE == null) {
  console.warn('No WEB_ENDPOINT_URL_TEMPLATE env variable set, the client won\'t be able to load server extension files')
}

// Initialize the product information for the server, including the extension gallery URL.
thisWithVSCodeParams._VSCODE_PRODUCT_JSON = {
  quality: 'oss',
  commit: VSCODE_REF,
  webEndpointUrlTemplate: WEB_ENDPOINT_URL_TEMPLATE,
  extensionsGallery: {
    serviceUrl: 'https://open-vsx.org/vscode/gallery',
    itemUrl: 'https://open-vsx.org/vscode/item',
    resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
    controlUrl: '',
    nlsBaseUrl: '',
    publisherUrl: ''
  }
}
thisWithVSCodeParams._VSCODE_PACKAGE_JSON = VSCODE_PACKAGE_JSON

const PRODUCT_JSON_PATH = process.env.PRODUCT_JSON_PATH
if (PRODUCT_JSON_PATH != null) {
  const productJson = await fs.readFile(PRODUCT_JSON_PATH, { encoding: 'utf8' })
  Object.assign(thisWithVSCodeParams._VSCODE_PRODUCT_JSON, JSON.parse(productJson))
}

// Create a directory for system extensions to be installed in, VSCode
// will try to read this folder to find system extensions, and will
// error if it does not exist.
const currentDirPath = path.dirname(fileURLToPath(import.meta.url))
await fs.mkdir(path.join(currentDirPath, 'extensions'), { recursive: true })

import('./server-main')
