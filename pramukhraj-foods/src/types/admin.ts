export interface AdminUser {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds, aligns with JwtSettings.AccessTokenExpirationMinutes if 60
  userId: string;
  email: string;
  username: string;
  isDeleted: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}
