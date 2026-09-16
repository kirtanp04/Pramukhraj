import { ApiPath } from '@/constants/apiPaths'
import { apiClient, apiGet, apiPost, getAdminAccessToken } from '@/lib/apiClient'
import type { AdminNotification, AdminNotificationList } from '@/types/adminNotifications'

export const adminNotificationsApi = {
  getList(pageNumber: number, pageSize: number, onlyUnacknowledged = false, signal?: AbortSignal) {
    return apiGet<AdminNotificationList>(
      ApiPath.admin.notifications.list(pageNumber, pageSize, onlyUnacknowledged),
      { signal },
    )
  },
  acknowledge(id: string) {
    return apiPost<{ changed: boolean }>(ApiPath.admin.notifications.acknowledge(id))
  },
  acknowledgeAll() {
    return apiPost<{ count: number }>(ApiPath.admin.notifications.acknowledgeAll)
  },
  async stream(onNotification: (notification: AdminNotification) => void, signal: AbortSignal, onConnected?: () => void) {
    const response = await fetch(apiClient.getUri({ url: ApiPath.admin.notifications.stream }), {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${getAdminAccessToken()}`,
        'Time-zone': String(new Date().getTimezoneOffset()),
      },
      credentials: 'include',
      cache: 'no-store',
      signal,
    })
    if (!response.ok) throw new Error(`Notification stream failed with status ${response.status}.`)
    if (!response.body) throw new Error('Notification stream was not provided by the server.')
    onConnected?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (!signal.aborted) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const event = block.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim()
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
        if (event === 'notification' && data) onNotification(JSON.parse(data) as AdminNotification)
        boundary = buffer.indexOf('\n\n')
      }
    }
  },
}
