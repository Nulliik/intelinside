import { Link } from 'react-router-dom'
import type { HardwareItem } from '@/lib/api/types'
import { UNIT_LABEL } from '@/lib/hardware'

/**
 * The compute unit a component result names: "CPU cores", "GPU", or, for a part carried by a CPU in the rig,
 * "iGPU on the Core Ultra 7 265K" with the host linked. `prefix` goes in front, for example the vendor.
 */
export function UnitLabel({ hardware, host, prefix }: { hardware: HardwareItem; host?: HardwareItem; prefix?: string }) {
  const hosted = host && (hardware.type === 'igpu' || hardware.type === 'npu')
  return (
    <span>
      {prefix ? `${prefix} ` : ''}
      {UNIT_LABEL[hardware.type]}
      {hosted ? (
        <>
          {' on the '}
          <Link to={`/hardware/${host.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline underline-offset-4">
            {host.name}
          </Link>
        </>
      ) : null}
    </span>
  )
}
