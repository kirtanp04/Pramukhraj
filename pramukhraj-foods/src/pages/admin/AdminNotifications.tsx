import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-react'
import { NotificationItem } from '@/components/admin/notifications/NotificationItem'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { getApiErrorMessage } from '@/lib/apiClient'
import { adminNotificationsApi } from '@/services/adminNotificationsApi'
import { useAdminNotificationsStore } from '@/store/adminNotificationsStore'
import type { AdminNotification, AdminNotificationList } from '@/types/adminNotifications'

const PAGE_SIZE = 20

function dateGroup(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

export function AdminNotifications() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()
  const revision = useAdminNotificationsStore(state => state.revision)
  const acknowledge = useAdminNotificationsStore(state => state.acknowledge)
  const acknowledgeAll = useAdminNotificationsStore(state => state.acknowledgeAll)
  const [data, setData] = useState<AdminNotificationList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    adminNotificationsApi.getList(page, PAGE_SIZE, false, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(reason => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)) })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [page, reloadKey, revision])

  const groups = useMemo(() => {
    const result = new Map<string, AdminNotification[]>()
    for (const item of data?.items ?? []) {
      const key = dateGroup(item.createdOn)
      result.set(key, [...(result.get(key) ?? []), item])
    }
    return [...result.entries()]
  }, [data?.items])

  async function markOne(id: string) {
    setBusyId(id)
    try { await acknowledge(id) } catch (reason) { setError(getApiErrorMessage(reason)) } finally { setBusyId(null) }
  }

  async function openItem(item: AdminNotification) {
    if (!item.acknowledgedOn) await markOne(item.id)
    if (item.actionUrl) navigate(item.actionUrl)
  }

  async function markAll() {
    setIsClearing(true)
    try { await acknowledgeAll() } catch (reason) { setError(getApiErrorMessage(reason)) } finally { setIsClearing(false) }
  }

  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="font-display text-2xl!">Notifications</h1>{(data?.unacknowledgedCount ?? 0) > 0 && <span className="rounded-full bg-oxblood px-2 py-0.5 text-[10px]! font-semibold text-white">{data?.unacknowledgedCount} unread</span>}</div><p className="mt-1 text-sm! text-ink-soft">Live system activity across customers, orders, payments, inventory, and operations.</p></div>
        {(data?.unacknowledgedCount ?? 0) > 0 && <Button variant="outline" disabled={isClearing} onClick={() => void markAll()}>{isClearing ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCheck size={15} />} Mark all as read</Button>}
      </header>

      {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm! text-red-800"><span>{error}</span><button type="button" onClick={() => setReloadKey(key => key + 1)} className="inline-flex items-center gap-1 font-semibold hover:underline"><RefreshCw size={13} /> Retry</button></div>}

      {isLoading && !data ? <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 rounded-card" />)}</div> : groups.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink/15 bg-ivory px-6 py-16 text-center"><Bell className="mx-auto text-ink-soft/40" size={34} /><h2 className="mt-3 font-display text-lg!">No notifications yet</h2><p className="mt-1 text-sm! text-ink-soft">New customer and operational activity will appear here.</p></div>
      ) : (
        <div className="space-y-5">
          {groups.map(([label, items]) => <section key={label}><h2 className="mb-2 text-xs! font-semibold uppercase tracking-wider text-ink-soft">{label}</h2><div className="divide-y divide-ink/10 overflow-hidden rounded-card border border-ink/10 bg-ivory">{items.map(item => <NotificationItem key={item.id} notification={item} isAcknowledging={busyId === item.id} onOpen={() => void openItem(item)} onAcknowledge={!item.acknowledgedOn ? () => void markOne(item.id) : undefined} />)}</div></section>)}
        </div>
      )}

      {totalPages > 1 && <div className="flex items-center justify-between border-t border-ink/10 pt-4"><p className="text-xs! text-ink-soft">Page {page} of {totalPages} · {data?.totalCount ?? 0} notifications</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /> Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage(page + 1)}>Next <ChevronRight size={14} /></Button></div></div>}
    </div>
  )
}
