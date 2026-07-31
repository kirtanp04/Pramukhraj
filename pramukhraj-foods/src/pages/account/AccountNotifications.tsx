import { ComingSoon } from '@/components/ui/ComingSoon'
import { Bell } from 'lucide-react'
export function AccountNotifications() {
  return <ComingSoon icon={Bell} title="No new notifications" description="Order updates, offers and alerts will show up here." />
}
