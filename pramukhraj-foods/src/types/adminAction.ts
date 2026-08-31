export interface AdminActionListItem {
  id: string | null
  adminId: string | null
  adminName: string
  module: string
  action: string
  entityId: string | null
  entityName: string
  description: string
  createdOn: string
}
