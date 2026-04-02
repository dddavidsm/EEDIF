import type { ReactNode } from 'react'
import { ArrowLeft, Home } from 'lucide-react'

interface AppLayoutProps {
  title: string
  subtitle: string
  onBack?: () => void
  actions?: ReactNode
  children: ReactNode
}

export function AppLayout({
  title,
  subtitle,
  onBack,
  actions,
  children,
}: AppLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef3fa_50%,_#e9f0f8_100%)] text-text">
      <div className="flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/60 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-t2 transition hover:border-accent/40 hover:text-accent"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
                  <Home className="h-4 w-4" strokeWidth={2} />
                </div>
              )}

              <div className="min-w-0">
                <h1 className="font-title text-lg leading-tight text-text">
                  {title}
                </h1>
                <p className="hidden text-xs text-t2 sm:block truncate max-w-md">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {actions}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}