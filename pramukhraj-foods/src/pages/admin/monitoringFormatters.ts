export function formatMetricDate(value: string | null): string {
  if (!value) return 'Not yet'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1) return `${milliseconds.toFixed(2)} ms`
  if (milliseconds < 1_000) return `${milliseconds.toFixed(0)} ms`
  return `${(milliseconds / 1_000).toFixed(2)} s`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index < 2 ? 0 : 1)} ${units[index]}`
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value)
}
