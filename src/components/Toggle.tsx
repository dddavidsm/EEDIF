interface ToggleOption<T extends string> {
  code: T
  name: string
  color?: string
}

interface ToggleProps<T extends string> {
  options: readonly ToggleOption<T>[]
  value: T
  onChange: (v: T) => void
}

export function Toggle<T extends string>({ options, value, onChange }: ToggleProps<T>) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => {
        const isActive = value === o.code
        const borderColor = isActive ? (o.color ? o.color + '99' : 'var(--color-accent)') : 'var(--color-border)'
        const bg = isActive ? (o.color ? o.color + '18' : 'var(--color-accent-d)') : 'var(--color-s2)'
        const textColor = isActive ? (o.color ?? 'var(--color-accent)') : 'var(--color-t2)'
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => onChange(o.code)}
            className="flex-1 px-3 py-2 rounded-[var(--radius)] text-[12px] font-semibold cursor-pointer transition-all duration-100 border text-center hover:brightness-110 min-w-[64px]"
            style={{ borderColor, background: bg, color: textColor }}
          >
            {o.name}
          </button>
        )
      })}
    </div>
  )
}
