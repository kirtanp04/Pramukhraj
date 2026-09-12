import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LoaderCircle, Trash2 } from 'lucide-react'
import type { CacheMetrics } from '@/types/cacheMetrics'
import { formatNumber } from './cacheMetricsFormatters'

const CHART_COLORS = ['#7A2531', '#D4A017', '#287271', '#B45F45', '#6B7280', '#9B6A6C']

export function CacheOverviewCharts({
  metrics,
  onClearModule,
  mutationTarget,
}: {
  metrics: CacheMetrics
  onClearModule: (module: string) => void
  mutationTarget: string | null
}) {
  const requestData = [
    { name: 'Hits', value: metrics.totalCacheHits },
    { name: 'Misses', value: metrics.totalCacheMisses },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="cache-hit-chart-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cache-hit-chart-title" className="font-display text-lg">Request Efficiency</h2>
            <p className="text-xs text-ink-soft">Hit and miss distribution since server start.</p>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">
            {metrics.hitRatioPercentage.toFixed(2)}%
          </span>
        </div>
        {metrics.totalCacheHits + metrics.totalCacheMisses > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={requestData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                  {requestData.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index]} />)}
                </Pie>
                <Tooltip formatter={value => formatNumber(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {requestData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-ivory-dim px-3 py-2">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} />{item.name}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[268px] items-center justify-center text-sm text-ink-soft">No cache requests recorded yet.</div>
        )}
      </section>

      <section className="rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="cache-size-chart-title">
        <div>
          <h2 id="cache-size-chart-title" className="font-display text-lg">Size by Cache Group</h2>
          <p className="text-xs text-ink-soft">Configured size units allocated across key namespaces.</p>
        </div>
        {metrics.sizeDistribution.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={235}>
              <BarChart data={metrics.sizeDistribution} margin={{ top: 20, right: 5, left: 0, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1118271a" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => [formatNumber(Number(value)), name === 'size' ? 'Size units' : name]}
                  labelFormatter={label => `${label} cache`}
                />
                <Bar dataKey="size" fill="#7A2531" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto pt-1">
              {metrics.sizeDistribution.map(module => {
                const isClearing = mutationTarget === `module:${module.group}`
                return (
                  <button
                    key={module.group}
                    type="button"
                    disabled={mutationTarget !== null}
                    onClick={() => onClearModule(module.group)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ivory-dim px-2.5 py-1 text-[11px] hover:border-oxblood/30 hover:text-oxblood disabled:opacity-40"
                    title={`Clear ${module.group} cache module`}
                  >
                    {isClearing ? <LoaderCircle size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    {module.group} ({module.entryCount})
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex h-[285px] items-center justify-center text-sm text-ink-soft">Cache is currently empty.</div>
        )}
      </section>
    </div>
  )
}
