import type { HardwareItem, HardwareType } from '@/lib/api/types'
import { HARDWARE, HARDWARE_BY_ID } from '@/mocks/catalog'

// A CPU like the Core Ultra 7 265K carries an iGPU and an NPU on its package. The catalog records that on the CPU
// entry (`integrated`); everything here derives from it. The parts stay separate catalog items, so a model run on
// the CPU cores, on the iGPU, and on the NPU of the same chip ranks as three parts with three numbers.

type PartRef = { hardwareId: string }

/** The iGPU and NPU on a CPU's package, in catalog order. Empty for anything that is not a CPU with integrated parts. */
export function integratedParts(hardware: HardwareItem | undefined): HardwareItem[] {
  return (hardware?.integrated ?? []).map((id) => HARDWARE_BY_ID[id]).filter((part): part is HardwareItem => !!part)
}

/** Every CPU in the catalog whose package carries this part. */
export function hostsOf(hardware: HardwareItem | undefined): HardwareItem[] {
  if (!hardware || (hardware.type !== 'igpu' && hardware.type !== 'npu')) return []
  return HARDWARE.filter((candidate) => candidate.integrated?.includes(hardware.id))
}

/** The CPU in this parts list whose package carries the part, if the list has one. */
export function hostIn(components: PartRef[], partId: string): HardwareItem | undefined {
  const cpu = components.find((component) => HARDWARE_BY_ID[component.hardwareId]?.integrated?.includes(partId))
  return cpu ? HARDWARE_BY_ID[cpu.hardwareId] : undefined
}

export function hasDiscreteGpu(components: PartRef[]): boolean {
  return components.some((component) => HARDWARE_BY_ID[component.hardwareId]?.type === 'gpu')
}

/** The compute unit a component result names. A result on a CPU item means its cores; the iGPU and NPU are their own parts. */
export const UNIT_LABEL: Record<HardwareType, string> = { cpu: 'CPU cores', gpu: 'GPU', igpu: 'iGPU', npu: 'NPU', ram: 'Memory' }

/** "CPU cores", "GPU", or, for a part carried by a CPU in the rig, "iGPU on the Core Ultra 7 265K". */
export function unitLabel(hardware: HardwareItem, host?: HardwareItem): string {
  const unit = UNIT_LABEL[hardware.type]
  return host && (hardware.type === 'igpu' || hardware.type === 'npu') ? `${unit} on the ${host.name}` : unit
}

export type NestedPart<T extends PartRef> = { part: T; host?: HardwareItem }

/**
 * A parts list ordered for display: each CPU is followed by the integrated parts it carries, marked with their host,
 * then everything else in its original order.
 */
export function nestParts<T extends PartRef>(components: T[]): NestedPart<T>[] {
  const out: NestedPart<T>[] = []
  const placed = new Set<string>()
  for (const component of components) {
    const hardware = HARDWARE_BY_ID[component.hardwareId]
    if (hardware?.type !== 'cpu' || placed.has(component.hardwareId)) continue
    out.push({ part: component })
    placed.add(component.hardwareId)
    for (const id of hardware.integrated ?? []) {
      const nested = components.find((candidate) => candidate.hardwareId === id)
      if (nested && !placed.has(id)) {
        out.push({ part: nested, host: hardware })
        placed.add(id)
      }
    }
  }
  for (const component of components) {
    if (placed.has(component.hardwareId)) continue
    out.push({ part: component })
    placed.add(component.hardwareId)
  }
  return out
}
