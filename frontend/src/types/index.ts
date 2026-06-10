export type Sender = 'user' | 'ai'

export interface Message {
  id: string
  sender: Sender
  text: string
  created_at: string
}

export interface ChatResponse {
  reply: string
  session_id: string
}

export interface ConversationHistory {
  id: string
  created_at: string
  messages: Message[]
}

export interface ConversationMeta {
  id: string
  title: string
  updatedAt: string
}

export interface ApiError {
  detail: string
}
