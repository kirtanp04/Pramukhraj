import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { StatCard } from '@/components/admin/StatCard'
import { Users, MousePointerClick, Percent, Clock } from 'lucide-react'

const traffic = [
  { day: 'Mon', visitors: 1240, orders: 84 }, { day: 'Tue', visitors: 1380, orders: 92 },
  { day: 'Wed', visitors: 1510, orders: 101 }, { day: 'Thu', visitors: 1420, orders: 97 },
  { day: 'Fri', visitors: 1690, orders: 128 }, { day: 'Sat', visitors: 2010, orders: 165 },
  { day: 'Sun', visitors: 1840, orders: 140 },
]
const funnel = [
  { stage: 'Visited', count: 10000 }, { stage: 'Viewed Product', count: 6400 },
  { stage: 'Added to Cart', count: 2100 }, { stage: 'Checkout Started', count: 1150 },
  { stage: 'Purchased', count: 807 },
]
const sources = [
  { source: 'Organic Search', visitors: 4200 }, { source: 'Direct', visitors: 2600 },
  { source: 'Social', visitors: 1800 }, { source: 'Referral', visitors: 900 }, { source: 'Email', visitors: 500 },
]

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Analytics</h1>
        <p className="text-sm text-ink-soft">Traffic, conversion and channel performance for the last 7 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Weekly Visitors" value="11,090" icon={Users} change="+9.2%" />
        <StatCard label="Conversion Rate" value="8.07%" icon={Percent} change="+0.4%" />
        <StatCard label="Avg. Session" value="3m 42s" icon={Clock} change="+12s" />
        <StatCard label="Click-through Rate" value="4.6%" icon={MousePointerClick} change="-0.2%" positive={false} />
      </div>

      <div className="rounded-card border border-ink/10 bg-ivory p-5">
        <h2 className="mb-4 font-display text-lg">Visitors vs Orders</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={traffic}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2b211c1a" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="visitors" stroke="#16302B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="orders" stroke="#7A2531" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Conversion Funnel</h2>
          <div className="space-y-2">
            {funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="mb-1 flex justify-between text-xs text-ink-soft"><span>{f.stage}</span><span>{f.count.toLocaleString('en-IN')}</span></div>
                <div className="h-2.5 w-full rounded-full bg-ivory-dim">
                  <div className="h-2.5 rounded-full bg-oxblood" style={{ width: `${(f.count / funnel[0].count) * 100}%`, opacity: 1 - i * 0.12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Traffic by Source</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sources} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip />
              <Bar dataKey="visitors" fill="#D4A017" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
