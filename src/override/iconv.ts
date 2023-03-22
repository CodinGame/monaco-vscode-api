import type { EncoderStream, DecoderStream, getEncoder as _getEncoder, getDecoder as _getDecoder, encodingExists as _encodingExists, decode as _decode, encode as _encode } from '@vscode/iconv-lite-umd'

const textDecoder = new TextEncoder()
const textEncoder = new TextDecoder()
const encoder: EncoderStream = {
  write (str: string) {
    return textDecoder.encode(str)
  },
  end () {
    return undefined
  }
}
const decoder: DecoderStream = {
  write (str: Uint8Array) {
    return textEncoder.decode(str)
  },
  end () {
    return undefined
  }
}

function checkEncoding (encoding: string) {
  if (!encodingExists(encoding)) {
    throw new Error(`Encoding not found: ${encoding}`)
  }
}

export const getEncoder: typeof _getEncoder = (encoding) => {
  checkEncoding(encoding)
  return encoder
}

export const getDecoder: typeof _getDecoder = (encoding) => {
  checkEncoding(encoding)
  return decoder
}

export const encodingExists: typeof _encodingExists = (encoding) => {
  return encoding === 'utf8'
}

export const decode: typeof _decode = (buffer, encoding) => {
  checkEncoding(encoding)
  return decoder.write(buffer)
}

export const encode: typeof _encode = (buffer, encoding) => {
  checkEncoding(encoding)
  return encoder.write(buffer)
}
