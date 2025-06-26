export interface DatabaseContext {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContextData {
  name: string;
  description?: string;
}