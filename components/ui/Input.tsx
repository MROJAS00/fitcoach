import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#d1d5db]">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2 bg-[#1a1a1a] border rounded-lg text-[#f0f0f0] placeholder-[#6b7280] text-sm',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-[#2a2a2a]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
