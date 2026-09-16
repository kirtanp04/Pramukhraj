import { useEffect, useState } from 'react'
import { Activity, AlertCircle, CheckCircle2, Cpu, Database, Gauge, HardDrive, MemoryStick, RefreshCw, Server, Timer, TriangleAlert } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMonitoringSnapshot } from '@/hooks/monitoring/useMonitoringSnapshot'
import { cn } from '@/lib/utils'
import { monitoringApi } from '@/services/monitoringApi'
import { formatBytes, formatMetricDate, formatUptime } from '../monitoringFormatters'

interface HistoryPoint { time: string; cpu: number; memory: number }

function MetricCard({ label, value, detail, icon: Icon, warning = false }: { label: string; value: string; detail: string; icon: typeof Cpu; warning?: boolean }) {
  return <div className="rounded-card border border-ink/10 bg-ivory p-5"><span className={cn('flex h-9 w-9 items-center justify-center rounded-full', warning ? 'bg-turmeric/15 text-turmeric-deep' : 'bg-teal/10 text-teal')}><Icon size={17} /></span><p className="mt-4 font-display text-2xl">{value}</p><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[11px] text-ink-soft">{detail}</p></div>
}

function LoadingState() {
  return <div className="space-y-6"><Skeleton className="h-16 w-80" /><div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36 rounded-card" />)}</div><Skeleton className="h-80 rounded-card" /></div>
}

export function AdminServerMetrics() {
  const { metrics, isLoading, isRefreshing, error, refresh } = useMonitoringSnapshot(monitoringApi.getServer)
  const [history, setHistory] = useState<HistoryPoint[]>([])

  useEffect(() => {
    if (!metrics) return
    const memory = metrics.gcHighMemoryLoadThresholdBytes > 0
      ? metrics.gcMemoryLoadBytes / metrics.gcHighMemoryLoadThresholdBytes * 100
      : 0
    const point = { time: new Date(metrics.generatedAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), cpu: metrics.processCpuUsagePercentage, memory: Math.min(memory, 100) }
    setHistory(current => [...current.filter(item => item.time !== point.time), point].slice(-20))
  }, [metrics])

  if (isLoading && !metrics) return <LoadingState />
  if (!metrics) return <div className="flex min-h-96 flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-ivory p-8 text-center"><AlertCircle className="text-oxblood" /><h1 className="mt-4 font-display text-xl">Unable to load server metrics</h1><p className="mt-2 text-sm text-ink-soft">{error ?? 'No server snapshot was returned.'}</p><Button className="mt-5" onClick={() => void refresh()}><RefreshCw size={15} /> Try again</Button></div>

  const memoryPressure = metrics.gcHighMemoryLoadThresholdBytes > 0 ? metrics.gcMemoryLoadBytes / metrics.gcHighMemoryLoadThresholdBytes * 100 : 0
  const workerUsage = metrics.threadPoolMaxWorkerThreads > 0 ? metrics.threadPoolBusyWorkerThreads / metrics.threadPoolMaxWorkerThreads * 100 : 0
  const dependenciesHealthy = metrics.dependencies.every(item => item.status === 'Healthy')
  const gcData = [{ generation: 'Gen 0', collections: metrics.gen0Collections }, { generation: 'Gen 1', collections: metrics.gen1Collections }, { generation: 'Gen 2', collections: metrics.gen2Collections }]

  return <div className="min-w-0 space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><h1 className="font-display text-2xl">Server Metrics</h1><span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', dependenciesHealthy ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{dependenciesHealthy ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{dependenciesHealthy ? 'Operational' : 'Attention required'}</span></div><p className="text-sm text-ink-soft">Live process, runtime, storage, concurrency and dependency health.</p><p className="mt-1 text-[11px] text-ink-soft">Updated {formatMetricDate(metrics.generatedAtUtc)} · refreshes every 15 seconds</p></div><Button variant="outline" disabled={isRefreshing} onClick={() => void refresh()}><RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Refresh now</Button></header>
    {error && <div className="rounded-card border border-turmeric/40 bg-turmeric/10 px-4 py-3 text-sm text-turmeric-deep">Latest refresh failed: {error}. Showing the previous snapshot.</div>}

    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      <MetricCard label="Process CPU" value={`${metrics.processCpuUsagePercentage.toFixed(1)}%`} detail={`${metrics.processorCount} logical processors`} icon={Cpu} warning={metrics.processCpuUsagePercentage >= 80} />
      <MetricCard label="Working set" value={formatBytes(metrics.workingSetBytes)} detail={`${formatBytes(metrics.managedHeapBytes)} managed heap`} icon={MemoryStick} warning={memoryPressure >= 80} />
      <MetricCard label="GC memory pressure" value={`${memoryPressure.toFixed(1)}%`} detail={`${formatBytes(metrics.gcFragmentedBytes)} fragmented`} icon={Gauge} warning={memoryPressure >= 80} />
      <MetricCard label="Process uptime" value={formatUptime(metrics.processUptimeSeconds)} detail={`System up ${formatUptime(metrics.systemUptimeSeconds)}`} icon={Timer} />
      <MetricCard label="Busy worker threads" value={metrics.threadPoolBusyWorkerThreads.toLocaleString()} detail={`${metrics.threadPoolAvailableWorkerThreads.toLocaleString()} available`} icon={Activity} warning={workerUsage >= 80} />
      <MetricCard label="Dependencies" value={`${metrics.dependencies.filter(item => item.status === 'Healthy').length}/${metrics.dependencies.length}`} detail="Healthy registered checks" icon={Database} warning={!dependenciesHealthy} />
    </div>

    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <section className="min-w-0 rounded-card border border-ink/10 bg-ivory p-5"><h2 className="font-display text-lg">CPU & Memory Pressure</h2><p className="text-xs text-ink-soft">Recent process samples retained in this browser session.</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs><linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b2635" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b2635" stopOpacity={0} /></linearGradient><linearGradient id="memoryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#176b66" stopOpacity={0.3} /><stop offset="95%" stopColor="#176b66" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="time" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="cpu" name="CPU" stroke="#8b2635" fill="url(#cpuFill)" /><Area type="monotone" dataKey="memory" name="Memory pressure" stroke="#176b66" fill="url(#memoryFill)" /></AreaChart></ResponsiveContainer></div></section>
      <section className="min-w-0 rounded-card border border-ink/10 bg-ivory p-5"><h2 className="font-display text-lg">Garbage Collections</h2><p className="text-xs text-ink-soft">Collection counts since this process started.</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={gcData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="generation" /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="collections" name="Collections" fill="#d69e2e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-card border border-ink/10 bg-ivory p-5"><div className="flex items-center gap-2"><HardDrive size={17} className="text-oxblood" /><h2 className="font-display text-lg">Storage</h2></div><div className="mt-4 space-y-5">{metrics.storage.length === 0 ? <p className="text-sm text-ink-soft">No accessible storage volumes were reported.</p> : metrics.storage.map(drive => <div key={drive.name}><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">{drive.name}</p><p className="text-xs text-ink-soft">{drive.driveFormat} · {formatBytes(drive.usedBytes)} of {formatBytes(drive.totalBytes)}</p></div><span className="text-sm font-semibold tabular-nums">{drive.usedPercentage.toFixed(1)}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/5"><div className={cn('h-full rounded-full', drive.usedPercentage >= 90 ? 'bg-red-600' : drive.usedPercentage >= 75 ? 'bg-turmeric' : 'bg-teal')} style={{ width: `${Math.min(drive.usedPercentage, 100)}%` }} /></div></div>)}</div></section>
      <section className="rounded-card border border-ink/10 bg-ivory p-5"><div className="flex items-center gap-2"><Database size={17} className="text-oxblood" /><h2 className="font-display text-lg">Dependencies</h2></div><div className="mt-4 space-y-3">{metrics.dependencies.map(item => <div key={item.name} className="flex items-center justify-between rounded-xl border border-ink/10 p-4"><div className="flex items-center gap-3">{item.status === 'Healthy' ? <CheckCircle2 className="text-green-700" size={18} /> : <AlertCircle className="text-red-700" size={18} />}<div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-ink-soft">{item.description}</p></div></div><span className="text-xs tabular-nums text-ink-soft">{item.durationMilliseconds.toFixed(1)} ms</span></div>)}</div></section>
    </div>

    <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory"><div className="border-b border-ink/10 p-5"><div className="flex items-center gap-2"><Server size={17} className="text-oxblood" /><h2 className="font-display text-lg">Runtime & ThreadPool</h2></div></div><div className="grid gap-px bg-ink/10 sm:grid-cols-2 xl:grid-cols-4">{[['Framework', metrics.frameworkDescription], ['Operating system', metrics.osDescription], ['Architecture', metrics.processArchitecture], ['Environment', metrics.isContainer ? 'Container' : 'Host process'], ['GC heap', formatBytes(metrics.gcHeapSizeBytes)], ['GC memory load', formatBytes(metrics.gcMemoryLoadBytes)], ['Worker threads', `${metrics.threadPoolAvailableWorkerThreads.toLocaleString()} / ${metrics.threadPoolMaxWorkerThreads.toLocaleString()} available`], ['I/O threads', `${metrics.threadPoolAvailableIoThreads.toLocaleString()} / ${metrics.threadPoolMaxIoThreads.toLocaleString()} available`]].map(([label, value]) => <div key={label} className="bg-ivory p-4"><p className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div>)}</div></section>

    <section className="rounded-card border border-ink/10 bg-ink/[0.025] p-5"><div className="flex items-center gap-2"><TriangleAlert size={17} className="text-turmeric-deep" /><h2 className="font-display text-lg">Unavailable in Hosted Environments</h2></div><div className="mt-3 grid gap-3 md:grid-cols-2">{metrics.unsupportedMetrics.map(item => <div key={item.name} className="rounded-xl bg-ivory p-4"><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs leading-5 text-ink-soft">{item.reason}</p></div>)}</div></section>
    <p className="rounded-lg bg-ink/[0.035] px-4 py-3 text-[11px] text-ink-soft">CPU is calculated from process-time deltas between requests. Metrics describe this API instance only and do not expose environment variables, connection strings or machine names.</p>
  </div>
}
