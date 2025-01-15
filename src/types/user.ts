export interface User {
  id: string;
  email: string;
  role?: string;
  created_by?: string;
  created_at: string;
  email_confirmed: boolean;
}

export interface Log {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
}