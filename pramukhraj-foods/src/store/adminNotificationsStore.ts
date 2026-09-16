import { create } from 'zustand'
import { adminNotificationsApi } from '@/services/adminNotificationsApi'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/apiClient'
import type { AdminNotification } from '@/types/adminNotifications'

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting'

interface AdminNotificationsState {
  unread: AdminNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  connectionState: ConnectionState
  revision: number
  loadUnread: () => Promise<void>
  acknowledge: (id: string) => Promise<void>
  acknowledgeAll: () => Promise<void>
  startStream: () => void
  stopStream: () => void
}

let streamController: AbortController | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconciliationTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempt = 0

export const useAdminNotificationsStore = create<AdminNotificationsState>((set, get) => ({
  unread: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  connectionState: 'idle',
  revision: 0,

  loadUnread: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await adminNotificationsApi.getList(1, 10, true)
      set({ unread: result?.items ?? [], unreadCount: result?.unacknowledgedCount ?? 0 })
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  acknowledge: async id => {
    try {
      await adminNotificationsApi.acknowledge(id)
      set(state => ({
        unread: state.unread.filter(item => item.id !== id),
        unreadCount: Math.max(0, state.unreadCount - 1),
        revision: state.revision + 1,
        error: null,
      }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
      throw error
    }
  },

  acknowledgeAll: async () => {
    try {
      await adminNotificationsApi.acknowledgeAll()
      set(state => ({ unread: [], unreadCount: 0, revision: state.revision + 1, error: null }))
    } catch (error) {
      set({ error: getApiErrorMessage(error) })
      throw error
    }
  },

  startStream: () => {
    if (streamController) return
    void get().loadUnread()
    reconciliationTimer ??= setInterval(() => { void get().loadUnread() }, 60_000)

    const connect = async () => {
      if (streamController) return
      const controller = new AbortController()
      streamController = controller
      set({ connectionState: reconnectAttempt === 0 ? 'connecting' : 'reconnecting' })
      try {
        await adminNotificationsApi.stream(notification => {
          reconnectAttempt = 0
          set(state => ({
            connectionState: 'connected',
            unread: [notification, ...state.unread.filter(item => item.id !== notification.id)].slice(0, 10),
            unreadCount: state.unread.some(item => item.id === notification.id) ? state.unreadCount : state.unreadCount + 1,
            revision: state.revision + 1,
          }))
        }, controller.signal, () => {
          reconnectAttempt = 0
          set({ connectionState: 'connected', error: null })
        })
        if (!controller.signal.aborted) throw new Error('Notification stream disconnected.')
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof Error && error.message.includes('status 401')) {
          await useAuthStore.getState().refresh()
        }
        set({ connectionState: 'reconnecting' })
      } finally {
        if (streamController === controller) streamController = null
      }

      if (!controller.signal.aborted) {
        reconnectAttempt++
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempt, 5))
        reconnectTimer = setTimeout(() => { reconnectTimer = null; void connect() }, delay)
      }
    }
    void connect()
  },

  stopStream: () => {
    streamController?.abort()
    streamController = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (reconciliationTimer) clearInterval(reconciliationTimer)
    reconnectTimer = null
    reconciliationTimer = null
    reconnectAttempt = 0
    set({ connectionState: 'idle' })
  },
}))
