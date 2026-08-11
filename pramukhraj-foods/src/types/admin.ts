// Permission strings follow the pattern "<resource>.<action>".
// "<resource>.*" grants every action on that resource; "*" grants everything.
export type Permission = string;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  color: "oxblood" | "teal" | "turmeric" | "soft";
}

export interface AdminUser {
  AccessToken: string;
  RefreshToken: string;
  ExpiresIn: number; // seconds, aligns with JwtSettings.AccessTokenExpirationMinutes if 60
  UserId: string;
  Email: string;
  Role: string;
  Username: string;
  IsDeleted:boolean
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}
