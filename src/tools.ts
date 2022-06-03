export function unsupported (): never {
  throw new Error('unsupported')
}

export const noop = (): void => {}
