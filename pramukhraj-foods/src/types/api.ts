export interface ApiResponse<T> {
  success: boolean
  message: string
  statusCode?: number
  data: T | null
  errors?: unknown
}