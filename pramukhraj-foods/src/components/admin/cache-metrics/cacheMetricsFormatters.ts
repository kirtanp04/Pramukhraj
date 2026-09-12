export function formatCacheDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

export function formatTtl(seconds: number | null) {
  if (seconds === null) return 'No expiry'
  if (seconds <= 0) return 'Expired'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m`
  return `${Math.floor(seconds / 86_400)}d ${Math.floor((seconds % 86_400) / 3_600)}h`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}
