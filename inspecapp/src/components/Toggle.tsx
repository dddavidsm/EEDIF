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
    <div className="flex gap-1">
      {options.map(o => (
        <button
          key={o.code}
          type="button"
          onClick={() => onChange(o.code)}
          className={`
            flex-1 px-2.5 py-[7px] rounded-[var(--radius)] text-[12px] font-semibold
            cursor-pointer transition-all duration-100 border text-center
            ${value === o.code
              ? 'border-accent bg-accent-d text-accent'
              : 'border-border bg-s2 text-t2 hover:bg-s3 hover:text-text'}
          `}
          style={value === o.code && o.color ? {
            borderColor: o.color,
            background: o.color + '18',
            color: o.color,
          } : undefined}
        >
          <span className="font-mono text-[10px] mr-1">{o.code}</span>
          {o.name}
        </button>
      ))}
    </div>
  )
}
