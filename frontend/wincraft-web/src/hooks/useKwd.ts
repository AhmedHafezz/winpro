export const fmtKwd = (v: number | null | undefined): string => {
  if (v == null) return '— KWD'
  return (
    v.toLocaleString('en-KW', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + ' KWD'
  )
}

export const roundKwd = (v: number): number => Math.round(v * 1000) / 1000

export const grandTotal = (
  subtotal: number,
  discPct: number,
  taxPct: number = 15,
): number => {
  const afterDisc = roundKwd(subtotal * (1 - discPct / 100))
  return roundKwd(afterDisc + roundKwd((afterDisc * taxPct) / 100))
}

export function useKwd() {
  return { fmtKwd, roundKwd, grandTotal }
}
