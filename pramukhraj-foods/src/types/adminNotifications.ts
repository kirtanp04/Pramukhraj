export interface AdminNotification {
  id: string
  type: string
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | string
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  actionUrl: string | null
  metadataJson: string | null
  createdOn: string
  acknowledgedOn: string | null
  sequenceNumber: number
  dismissedOn: string | null
}

export interface AdminNotificationList {
  items: AdminNotification[]
  pageNumber: number
  pageSize: number
  totalCount: number
  unacknowledgedCount: number
}
