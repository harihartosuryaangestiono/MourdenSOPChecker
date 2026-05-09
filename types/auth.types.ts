export type UserRole = "owner" | "admin" | "staff";
export type ShiftPreference = "opening" | "middle" | "closing" | "all";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  shift_preference: ShiftPreference;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
