import type { AuditLogEntry } from '@/types/admin'

export const initialAuditLog: AuditLogEntry[] = [
  { id: 'log-1', actor: 'Riya Kapoor', action: 'Updated product', target: 'Traditional Udad Papad (PRJ-PAP-1000)', timestamp: '2026-07-28T09:20:00.000Z', ip: '103.21.244.10' },
  { id: 'log-2', actor: 'Karan Mehta', action: 'Created coupon', target: 'FESTIVE20', timestamp: '2026-07-27T15:02:00.000Z', ip: '117.98.32.11' },
  { id: 'log-3', actor: 'Neha Joshi', action: 'Marked order shipped', target: '#PRJ100235', timestamp: '2026-07-27T12:44:00.000Z', ip: '49.36.88.201' },
  { id: 'log-4', actor: 'Aditi Rao', action: 'Published homepage banner', target: 'Diwali Faral Sale', timestamp: '2026-07-26T11:30:00.000Z', ip: '183.83.152.9' },
  { id: 'log-5', actor: 'Riya Kapoor', action: 'Suspended admin user', target: 'Sameer Bhatt', timestamp: '2026-05-02T10:20:00.000Z', ip: '103.21.244.10' },
]
