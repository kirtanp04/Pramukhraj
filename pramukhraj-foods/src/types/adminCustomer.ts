export type AdminCustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED'
export type AdminCustomerFilterStatus = 'ALL' | AdminCustomerStatus

export interface AdminCustomerListItem {
  id: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  status: AdminCustomerStatus
  isMobileVerified: boolean
  isEmailVerified: boolean
  isProfileCompleted: boolean
  marketingConsent: boolean
  addressCount: number
  reviewCount: number
  lastLoginOn: string | null
  createdOn: string
  updatedOn: string
  concurrencyStamp: string
}

export interface AdminCustomerSummary {
  total: number
  active: number
  blocked: number
  inactive: number
  deleted: number
}

export interface AdminCustomerListPage {
  items: AdminCustomerListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: AdminCustomerSummary
}

export interface AdminCustomerAddress {
  id: string
  recipientName: string
  mobileNumber: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  landmark: string | null
  addressType: string
  isDefaultShipping: boolean
  isDefaultBilling: boolean
  isActive: boolean
  createdOn: string
  updatedOn: string
}

export interface AdminCustomerDetails {
  id: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  status: AdminCustomerStatus
  blockReason: string | null
  blockedOn: string | null
  isMobileVerified: boolean
  isEmailVerified: boolean
  isProfileCompleted: boolean
  marketingConsent: boolean
  marketingConsentOn: string | null
  lastLoginOn: string | null
  createdOn: string
  updatedOn: string
  deletedOn: string | null
  reviewCount: number
  activeCartCount: number
  convertedCartCount: number
  activeSessionCount: number
  concurrencyStamp: string
  addresses: AdminCustomerAddress[]
}

export interface AdminCustomerListQuery {
  pageNumber: number
  pageSize: number
  search?: string
  status: AdminCustomerFilterStatus
  sortBy: 'createdOn' | 'updatedOn' | 'fullName' | 'lastLoginOn'
  sortDirection: 'asc' | 'desc'
}
