import { IFileService } from 'vs/platform/files/common/files'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { URI } from 'vs/base/common/uri'
import { unsupported } from './tools'

const fetch: typeof window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') {
    const uri = URI.parse(input)
    const fileService = StandaloneServices.get(IFileService)
    if (fileService.hasProvider(uri)) {
      const response: Response = {
        get headers () { return unsupported() },
        ok: true,
        redirected: false,
        status: 200,
        statusText: 'Ok',
        type: 'basic',
        url: input,
        clone: unsupported,
        get body () { return unsupported() },
        bodyUsed: false,
        arrayBuffer: unsupported,
        blob: unsupported,
        formData: unsupported,
        json: unsupported,
        text: async function (): Promise<string> {
          const content = await fileService.readFile(URI.parse(input))
          return content.value.toString()
        }
      }
      return response
    }
  }
  return window.fetch(input, init)
}

export default fetch
