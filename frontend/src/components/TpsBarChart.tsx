import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { RuntimeDot } from '@/components/RuntimeBadge'
import type { ChartBar, Runtime } from '@/lib/api/types'
import { fmtTps } from '@/lib/format'

type Datum = ChartBar & { color: string; runtimeName: string }

/** Horizontal bars of decode tok/s, colored by runtime. Rows link to their unit. */
export function TpsBarChart({ bars, runtimes, className }: { bars: ChartBar[]; runtimes: Runtime[]; className?: string }) {
  const navigate = useNavigate()
  const byId = useMemo(() => Object.fromEntries(runtimes.map((r) => [r.id, r])), [runtimes])
  const data: Datum[] = bars.map((b) => ({ ...b, color: byId[b.runtimeId]?.color ?? 'var(--muted-foreground)', runtimeName: byId[b.runtimeId]?.name ?? b.runtimeId }))
  const config: ChartConfig = Object.fromEntries(runtimes.map((r) => [r.id, { label: r.name, color: r.color }]))
  const used = runtimes.filter((r) => bars.some((b) => b.runtimeId === r.id))

  if (bars.length < 2)
    return (
      <div className="py-6 text-sm text-muted-foreground">
        {bars.length === 0 ? 'No results to chart yet.' : `One result: ${bars[0].label} at ${fmtTps(bars[0].tps)} tok/s.`}
      </div>
    )

  const height = 36 * data.length + 24
  return (
    <div className={className} role="img" aria-label={`Bar chart of decode tokens per second for ${data.length} entries, fastest first: ${data.slice(0, 3).map((d) => `${d.label} ${fmtTps(d.tps)}`).join(', ')}`}>
      <ChartContainer config={config} className="w-full" style={{ height }}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56, top: 4, bottom: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickFormatter={(v: number) => fmtTps(v)} />
          <YAxis type="category" dataKey="label" width={240} tickLine={false} axisLine={false} tick={{ fill: 'var(--foreground)', fontSize: 12 }} interval={0} />
          <ChartTooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as Datum
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <div className="font-medium text-foreground">{d.label}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <RuntimeDot runtime={byId[d.runtimeId]} /> {d.runtimeName}
                    <span className="ml-2 font-mono text-foreground">{fmtTps(d.tps)} tok/s</span>
                  </div>
                </div>
              )
            }}
          />
          <Bar dataKey="tps" radius={4} className="cursor-pointer" onClick={(_: unknown, index: number) => navigate(data[index].href)}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
            <LabelList dataKey="tps" position="right" fontSize={11} className="fill-foreground font-mono" formatter={(v: unknown) => fmtTps(Number(v))} />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {used.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1.5">
            <RuntimeDot runtime={r} /> {r.name}
          </span>
        ))}
      </div>
    </div>
  )
}
