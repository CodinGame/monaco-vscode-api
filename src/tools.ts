export function unsupported(): never {
  throw new Error('unsupported')
}

export const noop = (): void => {}

export function memoized<A extends unknown[], T>(fct: (...args: A) => T): (...args: A) => T {
  let v: T | null = null
  return (...args) => {
    if (v == null) {
      v = fct(...args)
    }
    return v
  }
}

export function memoizedConstructor<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctor: new (...args: any[]) => T
): new (...args: unknown[]) => T {
  return new Proxy(ctor, {
    construct: memoized((target, args) => {
      return Reflect.construct(ctor, args) as object
    })
  })
}

export async function sleep(duration: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, duration))
}

export function throttle<T>(
  fct: (param: T) => Promise<void>,
  merge: (a: T, b: T) => T,
  delay: number
): (param: T) => Promise<void> {
  let lastPromise: Promise<void> = Promise.resolve()
  let toConsume: T | null = null

  return async (param: T) => {
    if (toConsume == null) {
      toConsume = param
      lastPromise = lastPromise
        .then(async () => await sleep(delay))
        .then(async () => {
          const _toConsume = toConsume!
          toConsume = null
          await fct(_toConsume)
        })
    } else {
      toConsume = merge(toConsume, param)
    }
    await lastPromise
  }
}
