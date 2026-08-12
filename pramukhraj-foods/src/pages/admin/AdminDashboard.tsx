import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'
import { orders, products, categories } from '@/mock'
import { formatINR } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const revenueByMonth = [
  { month: 'Feb', revenue: 412000 }, { month: 'Mar', revenue: 468000 }, { month: 'Apr', revenue: 441000 },
  { month: 'May', revenue: 512000 }, { month: 'Jun', revenue: 587000 }, { month: 'Jul', revenue: 634000 },
]

const salesByCategory = categories.slice(0, 6).map((c) => ({ name: c.name, sales: Math.round(20000 + Math.random() * 80000) }))

const COLORS = ['#7A2531', '#D4A017', '#16302B', '#234c43', '#e4d2a6', '#591a24']
const orderStatusData = [
  { name: 'Delivered', value: 62 },
  { name: 'Shipped', value: 18 },
  { name: 'Processing', value: 14 },
  { name: 'Cancelled', value: 6 },
]

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15).length
  const outOfStock = products.filter((p) => p.stock === 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Welcome back, {user?.username?.split(' ')[0]}</h1>
        <p className="text-sm text-ink-soft">Here's what's happening across the store today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue (mock)" value={formatINR(totalRevenue * 40)} icon={IndianRupee} change="+12.4%" />
        <StatCard label="Orders This Month" value="1,284" icon={ShoppingCart} change="+8.1%" />
        <StatCard label="Active Customers" value="9,462" icon={Users} change="+3.6%" />
        <StatCard label="Catalog Size" value={`${products.length} SKUs`} icon={Package} change={`${lowStock} low stock`} positive={false} />
      </div>

      {(lowStock > 0 || outOfStock > 0) && (
        <div className="flex items-center gap-2 rounded-card border border-turmeric/40 bg-turmeric/10 px-4 py-3 text-sm text-turmeric-deep">
          <AlertTriangle size={16} />
          {lowStock} products are running low on stock and {outOfStock} are out of stock. Review the Inventory module.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-card border border-ink/10 bg-ivory p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A2531" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7A2531" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b211c1a" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Area type="monotone" dataKey="revenue" stroke="#7A2531" fill="url(#revColor)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Order Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {orderStatusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b211c1a" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Bar dataKey="sales" fill="#D4A017" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Recent Orders</h2>
          <div className="divide-y divide-ink/10">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-mono text-xs">#{o.id}</span>
                <span className="text-ink-soft">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="font-mono">{formatINR(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
