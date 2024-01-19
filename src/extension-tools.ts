import { ParseError, parse } from 'vs/base/common/json.js'
import { getParseErrorMessage } from 'vs/base/common/jsonErrorMessages'
import * as mime from 'mime-types'
import path from 'node:path'

export interface ExtensionResource {
  path: string
  extensionPaths: string[]
  mimeType?: string
}

function lookupMime (path: string) {
  const mimeType = mime.lookup(path)
  if (mimeType === false) {
    return undefined
  }
  return mimeType
}

function getPaths (filePath: string) {
  const paths = [filePath]
  if (path.extname(filePath) === '.js') {
    paths.push(filePath.substring(0, filePath.lastIndexOf('.')))
  }
  return paths
}

export function toResource (path: string): ExtensionResource {
  return {
    path,
    extensionPaths: getPaths(path),
    mimeType: lookupMime(path)
  }
}

export function parseJson<T> (path: string, text: string): T {
  const errors: ParseError[] = []
  const result = parse(text, errors)
  if (errors.length > 0) {
    throw new Error(`Failed to parse ${path}:\n${errors.map(error => `    ${getParseErrorMessage(error.error)}`).join('\n')}`)
  }
  return result
}
