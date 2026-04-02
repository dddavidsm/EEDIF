import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full bg-s2 border border-border rounded-[var(--radius)] text-text text-[14px] px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent placeholder:text-t3 ${className}`}
        {...props}
      />
    </div>
  ),
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full bg-s2 border border-border rounded-[var(--radius)] text-text text-[14px] px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent placeholder:text-t3 resize-y min-h-[92px] ${className}`}
        {...props}
      />
    </div>
  ),
)
Textarea.displayName = 'Textarea'
