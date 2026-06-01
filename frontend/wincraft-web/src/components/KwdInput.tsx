import { useController, type Control } from 'react-hook-form'
import clsx from 'clsx'

interface Props {
  name: string
  control: Control<any>
  label?: string
  className?: string
  disabled?: boolean
}

export function KwdInput({ name, control, label, className, disabled }: Props) {
  const { field, fieldState } = useController({ name, control })

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        <input
          {...field}
          type="number"
          step="0.001"
          min="0"
          disabled={disabled}
          className={clsx(
            'w-full rounded-md border px-3 py-2 text-right font-mono text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-600',
            fieldState.error
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 bg-white',
            disabled && 'cursor-not-allowed bg-slate-100',
          )}
          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          KWD
        </span>
      </div>
      {fieldState.error && (
        <p className="text-xs text-red-500">{fieldState.error.message}</p>
      )}
    </div>
  )
}
