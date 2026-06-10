import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { MessageInput } from './MessageInput'
import { ErrorBanner } from './ErrorBanner'
import type { Message } from '../types'
import styles from './ChatWindow.module.css'

const MAX_MESSAGE_LENGTH = 2000

const SUGGESTED_QUESTIONS = [
  'What is your return policy?',
  'Do you ship to the USA?',
  'How do I track my order?',
  'What payment methods do you accept?',
]

interface Props {
  messages: Message[]
  isSending: boolean
  isLoadingHistory: boolean
  error: string | null
  send: (text: string) => Promise<void>
  clearError: () => void
  onOpenSidebar: () => void
}

export function ChatWindow({
  messages,
  isSending,
  isLoadingHistory,
  error,
  send,
  clearError,
  onOpenSidebar,
}: Props) {
  const isBusy = isSending || isLoadingHistory
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const isEmpty = messages.length === 0

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className={styles.title}>Customer Chat Support</h1>
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.messages} role="log" aria-live="polite" aria-label="Chat messages">
        <div className={styles.messagesInner}>
          {isEmpty && !isLoadingHistory && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>How can I help you today?</p>
              <div className={styles.suggestions}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => send(q)}
                    disabled={isBusy}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isSending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className={styles.footer}>
        {error && <ErrorBanner message={error} onDismiss={clearError} />}
        <MessageInput
          onSend={send}
          disabled={isBusy}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <p className={styles.disclaimer}>
          AI can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  )
}
