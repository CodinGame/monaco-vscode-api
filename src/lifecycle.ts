import { Registry } from 'vs/platform/registry/common/platform'
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IInstantiationService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { Barrier, RunOnceScheduler, _runWhenIdle } from 'vs/base/common/async'
import { Emitter } from 'vs/base/common/event'
import { EditorExtensions, IEditorFactoryRegistry } from 'vs/workbench/common/editor'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Disposable } from 'vs/base/common/lifecycle'

const renderWorkbenchEmitter = new Emitter<ServicesAccessor>()
export const onRenderWorkbench = renderWorkbenchEmitter.event

export const serviceInitializedBarrier = new Barrier()
export const serviceInitializedEmitter = new Emitter<void>()

interface ServiceInitializeParticipant {
  (accessor: ServicesAccessor): Promise<void>
}
const serviceInitializePreParticipants: ServiceInitializeParticipant[] = []
const serviceInitializeParticipants: ServiceInitializeParticipant[] = []
const serviceInitializePostParticipants: ServiceInitializeParticipant[] = []
export function registerServiceInitializePreParticipant (participant: ServiceInitializeParticipant): void {
  serviceInitializePreParticipants.push(participant)
}
export function registerServiceInitializeParticipant (participant: ServiceInitializeParticipant): void {
  serviceInitializeParticipants.push(participant)
}
export function registerServiceInitializePostParticipant (participant: ServiceInitializeParticipant): void {
  serviceInitializePostParticipants.push(participant)
}

export async function startup (instantiationService: IInstantiationService): Promise<void> {
  await instantiationService.invokeFunction(async accessor => {
    await Promise.all(serviceInitializePreParticipants.map(participant => participant(accessor)))
  })

  await instantiationService.invokeFunction(async accessor => {
    const lifecycleService = accessor.get(ILifecycleService)

    await Promise.all(serviceInitializeParticipants.map(participant => participant(accessor)))

    // Signal to lifecycle that services are set
    lifecycleService.phase = LifecyclePhase.Ready
  })

  await instantiationService.invokeFunction(async accessor => {
    await Promise.all(serviceInitializePostParticipants.map(participant => participant(accessor)))
  })

  serviceInitializedBarrier.open()
  serviceInitializedEmitter.fire()

  instantiationService.invokeFunction(accessor => {
    const lifecycleService = accessor.get(ILifecycleService)

    Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).start(accessor)
    Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).start(accessor)

    renderWorkbenchEmitter.fire(accessor)

    lifecycleService.phase = LifecyclePhase.Restored

    // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
    const eventuallyPhaseScheduler = new RunOnceScheduler(() => {
      _runWhenIdle(window, () => {
        lifecycleService.phase = LifecyclePhase.Eventually
      }, 2500)
    }, 2500)
    eventuallyPhaseScheduler.schedule()
  })
}

let servicesInitialized = false
StandaloneServices.withServices(() => {
  servicesInitialized = true
  return Disposable.None
})

export async function waitServicesReady (): Promise<void> {
  await serviceInitializedBarrier.wait()
}

export function checkServicesReady (): void {
  if (!serviceInitializedBarrier.isOpen()) {
    throw new Error('Services are not ready yet')
  }
}

export function checkServicesNotInitialized (): void {
  if (servicesInitialized) {
    throw new Error('Services are already initialized')
  }
}
