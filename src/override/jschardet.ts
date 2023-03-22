import type { detect as _detect } from 'jschardet'

export const detect: typeof _detect = () => {
  return {
    encoding: 'utf8',
    confidence: 1
  }
}
