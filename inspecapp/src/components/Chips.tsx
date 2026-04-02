import type { UrgencyCode } from '@/types'
import { LESION_TYPES, URGENCY_LEVELS } from '@/types'
import type { LesionTypeCode } from '@/types'

export function TypeChip({ code }: { code: LesionTypeCode }) {
  const t = LESION_TYPES.find(lt => lt.code === code) ?? LESION_TYPES[0]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono"
      style={{
        background: t.color + '22',
        color: t.color,
        border: `1px solid ${t.color}44`,
      }}
    >
      {code}
    </span>
  )
}

export function UrgencyBadge({ code }: { code: UrgencyCode }) {
  const u = URGENCY_LEVELS.find(ul => ul.code === code) ?? URGENCY_LEVELS[1]
  return (
    <span
      className="inline-flex items-center px-[7px] py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
      style={{
        background: u.color + '22',
        color: u.color,
      }}
    >
      {u.name}
    </span>
  )
}

export function StatBox({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="bg-s1 border border-border rounded-[var(--radius)] px-[18px] py-[14px]">
      <div className="font-mono text-[26px] font-semibold" style={{ color: color ?? 'var(--color-accent)' }}>
        {value}
      </div>
      <div className="text-[10px] text-t2 uppercase tracking-wider font-semibold mt-0.5">
        {label}
      </div>
    </div>
  )
}
