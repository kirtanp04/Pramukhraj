export type LogSubModule = 'all' | 'payment' | 'email' | 'shipment'

export type LogLevel = 'Error' | 'Warning' | 'Information' | 'Success' | 'Debug' | 'Fatal' | 'Verbose'

export type LogLevelFilter = 'all' | 'error' | 'warning' | 'info' | 'success'

export interface AdminLogEntry {
  id: string
  timestamp: string
  level: LogLevel
  sourceContext: string | null
  subModule: string
  message: string
  details: string | null
  raw: string
  isSuccess: boolean
}

export interface AdminLogFileInfo {
  date: string
  fileName: string
  sizeBytes: number
  formattedSize: string
  lastModified: string
  isActive: boolean
}

export interface AdminLogChunkResponse {
  entries: AdminLogEntry[]
  nextCursor: string | null
  hasMore: boolean
  totalFileSizeBytes: number
  subModule: string
  date: string
  availableDates: AdminLogFileInfo[]
}

export interface AdminLogQueryParams {
  subModule?: LogSubModule
  date?: string
  cursor?: string | null
  limit?: number
  level?: LogLevelFilter
  search?: string
}

export interface ClearLogsPayload {
  date?: string
  subModule?: string
}

