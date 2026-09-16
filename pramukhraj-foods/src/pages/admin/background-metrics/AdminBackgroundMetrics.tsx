import { Activity, AlertCircle, Boxes, Clock3, Gauge, HeartPulse, RefreshCw, TimerReset } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMonitoringSnapshot } from '@/hooks/monitoring/useMonitoringSnapshot'
import { cn } from '@/lib/utils'
import { monitoringApi } from '@/services/monitoringApi'
import { formatCount, formatDuration, formatMetricDate } from '../monitoringFormatters'

function stateTone(state: string) {
  if (state === 'Running') return 'bg-blue-50 text-blue-700 ring-blue-200'
  if (state === 'Idle') return 'bg-green-50 text-green-700 ring-green-200'
  if (state === 'Faulted') return 'bg-red-50 text-red-700 ring-red-200'
  return 'bg-ink/5 text-ink-soft ring-ink/10'
}

function StateBadge({ state }: { state: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', stateTone(state))}>{state}</span>
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <div className="rounded-card border border-ink/10 bg-ivory p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood/10 text-oxblood"><Icon size={17} /></span>
      <p className="mt-4 font-display text-2xl text-ink">{value}</p>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
    </div>
  )
}

function LoadingState() {
  return <div className="space-y-6"><Skeleton className="h-16 w-80" /><div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36 rounded-card" />)}</div><Skeleton className="h-80 rounded-card" /></div>
}

export function AdminBackgroundMetrics() {
  const { metrics, isLoading, isRefreshing, error, refresh } = useMonitoringSnapshot(monitoringApi.getBackground)

  if (isLoading && !metrics) return <LoadingState />
  if (!metrics) return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-ivory p-8 text-center">
      <AlertCircle className="text-oxblood" /><h1 className="mt-4 font-display text-xl">Unable to load background metrics</h1>
      <p className="mt-2 text-sm text-ink-soft">{error ?? 'No monitoring snapshot was returned.'}</p>
      <Button className="mt-5" onClick={() => void refresh()}><RefreshCw size={15} /> Try again</Button>
    </div>
  )

  const timingData = metrics.tasks.map(task => ({ name: task.name.replace(/ expired| refresh tokens/g, ''), last: task.lastDurationMilliseconds, average: task.averageDurationMilliseconds }))
  const processingData = metrics.tasks.map(task => ({ name: task.name.replace(/ expired| refresh tokens/g, ''), lastRun: task.itemsProcessedLastRun, backlog: task.queueDepth }))

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-3"><h1 className="font-display text-2xl">Background Metrics</h1><StateBadge state={metrics.workerState} /></div><p className="text-sm text-ink-soft">Worker liveness, execution timing, throughput, backlog and task failures.</p><p className="mt-1 text-[11px] text-ink-soft">Updated {formatMetricDate(metrics.generatedAtUtc)} · refreshes every 15 seconds</p></div>
        <Button variant="outline" disabled={isRefreshing} onClick={() => void refresh()}><RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Refresh now</Button>
      </header>

      {error && <div className="rounded-card border border-turmeric/40 bg-turmeric/10 px-4 py-3 text-sm text-turmeric-deep">Latest refresh failed: {error}. Showing the previous snapshot.</div>}
      {metrics.lastErrorMessage && <div className="flex gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={17} /><div><p className="font-semibold">Latest worker failure</p><p>{metrics.lastErrorMessage}</p><p className="mt-1 text-xs text-red-700">{formatMetricDate(metrics.lastErrorAtUtc)}</p></div></div>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <MetricCard label="Heartbeat" value={metrics.lastHeartbeatUtc ? 'Responsive' : 'Waiting'} detail={formatMetricDate(metrics.lastHeartbeatUtc)} icon={HeartPulse} />
        <MetricCard label="Completed iterations" value={formatCount(metrics.completedIterations)} detail={`Last run ${formatMetricDate(metrics.lastRunTimeUtc)}`} icon={TimerReset} />
        <MetricCard label="Average run time" value={formatDuration(metrics.averageExecutionDurationMilliseconds)} detail={`Last ${formatDuration(metrics.lastExecutionDurationMilliseconds)}`} icon={Clock3} />
        <MetricCard label="Total processed" value={formatCount(metrics.totalItemsProcessed)} detail={`${formatCount(metrics.itemsProcessedLastRun)} in the latest run`} icon={Boxes} />
        <MetricCard label="Current backlog" value={formatCount(metrics.queueDepth)} detail="Items waiting across registered tasks" icon={Gauge} />
        <MetricCard label="Consecutive errors" value={formatCount(metrics.consecutiveErrorCount)} detail={`Next run ${formatMetricDate(metrics.nextRunTimeUtc)}`} icon={AlertCircle} />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-card border border-ink/10 bg-ivory p-5"><h2 className="font-display text-lg">Task Timing</h2><p className="text-xs text-ink-soft">Last and average execution duration in milliseconds.</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={timingData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="last" name="Last run" fill="#8b2635" radius={[4, 4, 0, 0]} /><Bar dataKey="average" name="Average" fill="#d69e2e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="min-w-0 rounded-card border border-ink/10 bg-ivory p-5"><h2 className="font-display text-lg">Processing & Backlog</h2><p className="text-xs text-ink-soft">Items handled in the latest run compared with remaining work.</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={processingData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="lastRun" name="Processed" fill="#176b66" radius={[4, 4, 0, 0]} /><Bar dataKey="backlog" name="Backlog" fill="#c2413d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      </div>

      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory"><div className="border-b border-ink/10 p-5"><h2 className="font-display text-lg">Registered Tasks</h2><p className="text-xs text-ink-soft">Per-task state, recency, throughput and failure information.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-ink/[0.035] text-xs uppercase tracking-wide text-ink-soft"><tr><th className="px-5 py-3">Task</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Last completed</th><th className="px-4 py-3 text-right">Duration</th><th className="px-4 py-3 text-right">Last / Total</th><th className="px-4 py-3 text-right">Backlog</th><th className="px-5 py-3">Failure</th></tr></thead><tbody className="divide-y divide-ink/10">{metrics.tasks.map(task => <tr key={task.name} className="align-top"><td className="px-5 py-4 font-medium">{task.name}<p className="mt-1 text-xs font-normal text-ink-soft">{formatCount(task.runCount)} runs</p></td><td className="px-4 py-4"><StateBadge state={task.state} /></td><td className="px-4 py-4 text-xs text-ink-soft">{formatMetricDate(task.lastCompletedAtUtc)}</td><td className="px-4 py-4 text-right tabular-nums">{formatDuration(task.lastDurationMilliseconds)}</td><td className="px-4 py-4 text-right tabular-nums">{formatCount(task.itemsProcessedLastRun)} / {formatCount(task.totalItemsProcessed)}</td><td className="px-4 py-4 text-right tabular-nums">{formatCount(task.queueDepth)}</td><td className="max-w-56 px-5 py-4 text-xs text-ink-soft">{task.lastErrorMessage ?? 'None'}{task.consecutiveErrorCount > 0 && <p className="mt-1 font-semibold text-red-700">{task.consecutiveErrorCount} consecutive</p>}</td></tr>)}</tbody></table></div></section>
      <p className="rounded-lg bg-ink/[0.035] px-4 py-3 text-[11px] text-ink-soft">Metrics are process-local and reset when this API instance restarts. Each container instance reports its own worker.</p>
    </div>
  )
}
