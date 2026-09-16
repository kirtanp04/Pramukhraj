import {
  Bell, Check, CircleCheck, CircleX, CreditCard, Package, ShoppingBag, UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminNotification } from '@/types/adminNotifications'

const notificationVisuals: Record<string, { icon: LucideIcon; tone: string }> = {
  CUSTOMER_REGISTERED: { icon: UserPlus, tone: 'bg-teal/10 text-teal' },
  ORDER_PLACED: { icon: ShoppingBag, tone: 'bg-blue-50 text-blue-700' },
  PAYMENT_SUCCEEDED: { icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-700' },
  PAYMENT_FAILED: { icon: CircleX, tone: 'bg-red-50 text-red-700' },
  LOW_STOCK: { icon: Package, tone: 'bg-turmeric/15 text-turmeric-deep' },
  PAYMENT: { icon: CreditCard, tone: 'bg-blue-50 text-blue-700' },
}

function relativeTime(value: string) {
  const date = new Date(value)
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, 'day')
  return date.toLocaleDateString()
}

interface NotificationItemProps {
  notification: AdminNotification
  compact?: boolean
  onOpen?: () => void
  onAcknowledge?: () => void
  isAcknowledging?: boolean
}

export function NotificationItem({ notification, compact = false, onOpen, onAcknowledge, isAcknowledging }: NotificationItemProps) {
  const visual = notificationVisuals[notification.type] ?? { icon: Bell, tone: 'bg-ink/5 text-ink-soft' }
  const Icon = visual.icon
  const unread = !notification.acknowledgedOn

  return (
    <article className={cn('relative flex items-start gap-3 transition-colors', compact ? 'px-4 py-3' : 'p-4 sm:p-5', unread && 'bg-teal/[0.035]')}>
      {unread && <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-oxblood" aria-label="Unread" />}
      <span className={cn('flex shrink-0 items-center justify-center rounded-full', compact ? 'h-9 w-9' : 'h-10 w-10', visual.tone)}><Icon size={compact ? 16 : 18} aria-hidden /></span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
          <span className={cn('text-sm!', unread ? 'font-semibold text-ink' : 'font-medium text-ink/80')}>{notification.title}</span>
          <time dateTime={notification.createdOn} className="shrink-0 text-[10px]! text-ink-soft">{relativeTime(notification.createdOn)}</time>
        </span>
        <span className={cn('mt-0.5 block text-xs! leading-5 text-ink-soft', compact && 'line-clamp-2')}>{notification.message}</span>
      </button>
      {unread && onAcknowledge && (
        <button type="button" disabled={isAcknowledging} onClick={onAcknowledge} aria-label={`Mark ${notification.title} as read`} title="Mark as read" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-teal/10 hover:text-teal disabled:opacity-50"><Check size={14} /></button>
      )}
    </article>
  )
}
