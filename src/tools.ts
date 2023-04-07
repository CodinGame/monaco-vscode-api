
export function unsupported (): never {
  throw new Error('unsupported')
}

export const noop = (): void => {}

export function memoized<A extends unknown[], T> (fct: (...args: A) => T): (...args: A) => T {
  let v: T | null = null
  return (...args) => {
    if (v == null) {
      v = fct(...args)
    }
    return v
  }
}

export function memoizedConstructor<T> (ctor: new (...args: any[]) => T): new (...args: any[]) => T {
  return new Proxy(ctor, {
    construct: memoized((target, args) => {
      return Reflect.construct(ctor, args) as object
    })
  })
}
