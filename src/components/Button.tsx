import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'accent' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-default select-none'

const variants: Record<Variant, string> = {
  accent: 'bg-accent text-white hover:bg-accent-h active:brightness-90',
  ghost:  'bg-transparent text-t2 border border-border hover:bg-s2 hover:text-text hover:border-border2',
  danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/[.18]',
}

const sizes: Record<Size, string> = {
  sm:   'px-2.5 py-1.5 text-xs',
  md:   'px-3.5 py-[7px] text-[13px]',
  lg:   'px-5 py-2.5 text-sm',
  icon: 'p-[7px] aspect-square text-xs',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
