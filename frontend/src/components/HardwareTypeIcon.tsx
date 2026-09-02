import { Cpu, Gpu, MemoryStick, Microchip, Zap, type LucideProps } from 'lucide-react'
import type { HardwareType } from '@/lib/api/types'

const ICONS: Record<HardwareType, React.ComponentType<LucideProps>> = { cpu: Cpu, gpu: Gpu, igpu: Microchip, npu: Zap, ram: MemoryStick }

export function HardwareTypeIcon({ type, ...props }: { type: HardwareType } & LucideProps) {
  const Icon = ICONS[type]
  return <Icon aria-hidden {...props} />
}
