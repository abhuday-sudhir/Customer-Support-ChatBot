import type { ChatResponse, ConversationHistory } from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`
    try {
      const err = await res.json()
      if (err?.detail) detail = err.detail
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

/**
 * POST /chat/message
 * Send a user message; optionally pass an existing sessionId.
 */
export async function sendMessage(
  message: string,
  sessionId: string | null,
): Promise<ChatResponse> {
  const body: Record<string, string> = { message }
  if (sessionId) body.session_id = sessionId

  const res = await fetch(`${BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<ChatResponse>(res)
}

/**
 * GET /chat/history/:sessionId
 * Load past messages for a session (used on page reload).
 */
export async function fetchHistory(
  sessionId: string,
): Promise<ConversationHistory> {
  const res = await fetch(`${BASE}/chat/history/${sessionId}`)
  return handleResponse<ConversationHistory>(res)
}
