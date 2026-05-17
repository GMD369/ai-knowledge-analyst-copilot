export interface Document {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  status: "pending" | "processing" | "ready" | "failed"
  chunk_count: number
  created_at: string
  updated_at?: string
}

export interface Citation {
  document_id: string
  filename: string
  page_number?: number
  chunk_text: string
  relevance_score: number
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  confidence?: number
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title?: string
  messages: Message[]
  created_at: string
}

export interface ChatResponse {
  conversation_id: string
  answer: string
  citations: Citation[]
  confidence: number
}
