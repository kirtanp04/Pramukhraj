// Permission strings follow the pattern "<resource>.<action>".
// "<resource>.*" grants every action on that resource; "*" grants everything.
export type Permission = string

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  color: 'oxblood' | 'teal' | 'turmeric' | 'soft'
}

export interface AdminUser {
  id: string
  name: string
  email: string
  password: string // demo-only, plaintext mock credential
  avatar: string
  roleId: string
  status: 'Active' | 'Suspended'
  lastLogin: string | null
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  timestamp: string
  ip: string
}
