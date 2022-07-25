import { BrandedService, IInstantiationService, _util } from 'vs/platform/instantiation/common/instantiation'

function getInjectedParameters<Ctor extends abstract new (...args: any[]) => InstanceType<Ctor>> (instantiationService: IInstantiationService, ctor: Ctor) {
  return instantiationService.invokeFunction((accessor) => {
    return _util.getServiceDependencies(ctor).sort((a, b) => a.index - b.index).map(d => accessor.get(d.id))
  })
}

declare type GetLeadingNonServiceArgs<Args> = Args extends [...BrandedService[]] ? [] : Args extends [infer A, ...BrandedService[]] ? [A] : Args extends [infer A, ...infer R] ? [A, ...GetLeadingNonServiceArgs<R>] : never

/**
 * Takes a class with injected services as parameters and returns a child class that only takes the injector as parameter
 * @param ctor The class to inject
 * @returns A class that only needs the injector
 */
export function createInjectedClass<Ctor extends abstract new (...args: any[]) => InstanceType<Ctor>>(ctor: Ctor): new (instantiationService: IInstantiationService, ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>) => InstanceType<Ctor> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _ctor = (ctor as (abstract new (...args: any[]) => any))
  return class extends _ctor {
    constructor (...args: any[]) {
      super(...args.slice(1), ...getInjectedParameters(args[0], ctor))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}
