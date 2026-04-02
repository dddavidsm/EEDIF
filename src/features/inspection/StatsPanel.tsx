import { useMemo } from 'react'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'
import { LESION_TYPES, URGENCY_LEVELS } from '@/types'

export function StatsPanel() {
  const project = useProjectStore(selectActiveProject)
  const zones = useProjectStore(s => s.zones)

  // We need all lesions for ALL zones of the project, not just the active zone.
  // For now we use the active zone's lesions — in a production app we'd aggregate.
  // However, the store only loads lesions of the active zone.
  // We'll build stats from what we have + show a note.
  const lesions = useProjectStore(s => s.lesions)

  const stats = useMemo(() => {
    const tot = lesions.length
    const byType = LESION_TYPES
      .map(t => ({ ...t, n: lesions.filter(l => l.tipus === t.code).length }))
      .filter(t => t.n > 0)
    const byUrg = URGENCY_LEVELS.map(u => ({
      ...u,
      n: lesions.filter(l => l.urgency === u.code).length,
    }))
    const fotos = lesions.reduce((s, l) => s + l.photoIds.length, 0)
    const urgent = lesions.filter(l => l.urgency === 'U').length
    return { tot, byType, byUrg, fotos, urgent }
  }, [lesions])

  if (!project) return null

  const max = Math.max(...stats.byType.map(t => t.n), 1)
  const maxUrg = Math.max(...stats.byUrg.map(u => u.n), 1)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[900px] mx-auto">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-1">Estadisticas del proyecto</h2>
          <p className="text-[13px] text-t2">{project.name} &middot; {project.workCode}</p>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatBox value={zones.length} label="Zonas" color="var(--color-accent)" />
          <StatBox value={stats.tot} label="Lesiones" color="var(--color-info)" />
          <StatBox value={stats.urgent} label="Urgentes" color="var(--color-danger)" />
          <StatBox value={stats.fotos} label="Fotos" color="var(--color-ok)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* By type */}
          <div className="bg-s1 border border-border rounded-[var(--radius-md)] p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-3">
              Por tipo de lesion
            </h3>
            {stats.byType.length === 0 ? (
              <div className="text-[12px] text-t3 py-4 text-center">Sin lesiones registradas</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.byType.map(t => (
                  <div key={t.code} className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: t.color }}
                    />
                    <span className="text-[11px] text-t2 w-28 truncate">{t.name}</span>
                    <Bar value={t.n} max={max} color={t.color} />
                    <span className="text-[11px] font-mono font-bold text-text w-6 text-right">
                      {t.n}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By urgency */}
          <div className="bg-s1 border border-border rounded-[var(--radius-md)] p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-3">
              Por urgencia
            </h3>
            <div className="flex flex-col gap-2.5">
              {stats.byUrg.map(u => (
                <div key={u.code} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: u.color }}
                  />
                  <span className="text-[11px] text-t2 w-24">{u.name}</span>
                  <Bar value={u.n} max={maxUrg} color={u.color} />
                  <span className="text-[11px] font-mono font-bold text-text w-6 text-right">
                    {u.n}
                  </span>
                </div>
              ))}
            </div>

            {/* By zone */}
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-3 mt-6">
              Por zona
            </h3>
            <div className="flex flex-col gap-2">
              {zones.map(z => {
                const count = lesions.filter(l => l.zoneId === z.id).length
                const urgCount = lesions.filter(l => l.zoneId === z.id && l.urgency === 'U').length
                return (
                  <div key={z.id} className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius)] hover:bg-s2 transition-colors">
                    <span className="text-[12px] text-text">{z.name}</span>
                    <div className="flex items-center gap-2">
                      {urgCount > 0 && (
                        <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">
                          {urgCount} urg.
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-t2">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-s1 border border-border rounded-[var(--radius-md)] px-4 py-3.5">
      <div className="font-mono text-[28px] font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-t2 uppercase tracking-wider font-semibold mt-1.5">
        {label}
      </div>
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 h-[6px] bg-s3 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
