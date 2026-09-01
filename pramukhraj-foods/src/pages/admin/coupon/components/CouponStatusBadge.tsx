import { Badge } from '@/components/ui/Badge'
import type { CouponStatus } from '@/types/coupon'

const variants = {
  Active: 'success', Scheduled: 'turmeric', Expired: 'outline', Inactive: 'oxblood',
  UsageLimitReached: 'teal', Archived: 'soft',
} as const

const labels: Record<CouponStatus, string> = {
  Active: 'Active', Scheduled: 'Scheduled', Expired: 'Expired', Inactive: 'Inactive',
  UsageLimitReached: 'Limit reached', Archived: 'Archived',
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
