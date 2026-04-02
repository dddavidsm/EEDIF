import type { ReactNode } from 'react'
import { ArrowLeft, Home, Settings2 } from 'lucide-react'

interface AppLayoutProps {
  title: string
  subtitle: string
  eyebrow?: string
  onBack?: () => void
  actions?: ReactNode
  children: ReactNode
}

export function AppLayout({
  title,
  subtitle,
  eyebrow = 'SOCOTEC Engineering',
  onBack,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef3fa_46%,_#e9f0f8_100%)] text-text">
      <div className="flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/80 bg-white/85 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-6">
            <div className="flex items-center gap-4">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-s1 text-t2 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                </button>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-md shadow-blue-600/20">
                  <Home className="h-5 w-5" strokeWidth={2.2} />
                </div>
              )}

              <div className="min-w-0">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-t3">
                  {eyebrow}
                </div>
                <h1 className="font-title text-2xl leading-none text-text sm:text-3xl lg:text-[2rem]">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-t2 sm:text-base">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 self-stretch sm:self-auto">
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl border border-border bg-s1 text-t3 shadow-sm lg:inline-flex">
                <Settings2 className="h-5 w-5" strokeWidth={2.1} />
              </div>
              {actions}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}