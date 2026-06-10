import { useState, useEffect, useCallback, useRef } from 'react'
import type { ConversationMeta, Message } from '../types'
import { sendMessage, fetchHistory } from '../services/api'

const SESSION_KEY = 'spur_session_id'
const CONVERSATIONS_KEY = 'spur_conversations'
const sessionStore = sessionStorage
const conversationsStore = localStorage

const MAX_TITLE_LENGTH = 42

function loadConversations(): ConversationMeta[] {
  try {
    const raw = conversationsStore.getItem(CONVERSATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ConversationMeta[]
    return parsed.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch {
    return []
  }
}

function saveConversations(list: ConversationMeta[]) {
  conversationsStore.setItem(CONVERSATIONS_KEY, JSON.stringify(list))
}

function makeTitle(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed
  return `${trimmed.slice(0, MAX_TITLE_LENGTH)}…`
}

function upsertConversation(
  list: ConversationMeta[],
  id: string,
  title: string,
): ConversationMeta[] {
  const now = new Date().toISOString()
  const existing = list.find((c) => c.id === id)
  const entry: ConversationMeta = {
    id,
    title: existing?.title ?? title,
    updatedAt: now,
  }
  const rest = list.filter((c) => c.id !== id)
  return [entry, ...rest]
}

interface UseChatReturn {
  messages: Message[]
  isSending: boolean
  isLoadingHistory: boolean
  error: string | null
  sessionId: string | null
  conversations: ConversationMeta[]
  send: (text: string) => Promise<void>
  startNewChat: () => void
  selectConversation: (id: string) => void
  clearError: () => void
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationMeta[]>(loadConversations)
  const initialized = useRef(false)

  const loadSession = useCallback(async (id: string) => {
    setIsLoadingHistory(true)
    setError(null)
    try {
      const conv = await fetchHistory(id)
      setMessages(conv.messages)
      setSessionId(id)
      sessionStore.setItem(SESSION_KEY, id)
    } catch {
      sessionStore.removeItem(SESSION_KEY)
      setSessionId(null)
      setMessages([])
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveConversations(next)
        return next
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Restore active tab session on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const stored = sessionStore.getItem(SESSION_KEY)
    if (stored) {
      loadSession(stored)
    }
  }, [loadSession])

  const startNewChat = useCallback(() => {
    sessionStore.removeItem(SESSION_KEY)
    setSessionId(null)
    setMessages([])
    setError(null)
  }, [])

  const selectConversation = useCallback(
    (id: string) => {
      if (id === sessionId) return
      setMessages([])
      loadSession(id)
    },
    [sessionId, loadSession],
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const optimisticUserMsg: Message = {
        id: `local-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticUserMsg])
      setIsSending(true)
      setError(null)

      try {
        const data = await sendMessage(trimmed, sessionId)

        setSessionId(data.session_id)
        sessionStore.setItem(SESSION_KEY, data.session_id)

        setConversations((prev) => {
          const next = upsertConversation(prev, data.session_id, makeTitle(trimmed))
          saveConversations(next)
          return next
        })

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
      } finally {
        setIsSending(false)
      }
    },
    [sessionId],
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    messages,
    isSending,
    isLoadingHistory,
    error,
    sessionId,
    conversations,
    send,
    startNewChat,
    selectConversation,
    clearError,
  }
}
