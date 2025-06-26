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

export interface DatabaseFile {
  id: string;
  name: string;
  context_id: string;
  user_id: string;
  size: number;
  type: string;
  path?: string;
  content?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSite {
  id: string;
  url: string;
  context_id: string;
  created_at: string;
}

export interface CreateFileData {
  name: string;
  context_id: string;
  size: number;
  type: string;
  path?: string;
  content?: string;
}