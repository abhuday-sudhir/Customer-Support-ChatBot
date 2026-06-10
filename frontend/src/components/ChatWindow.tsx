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
  onOpenHistory: () => void
}

export function ChatWindow({
  messages,
  isSending,
  isLoadingHistory,
  error,
  send,
  clearError,
  onOpenHistory,
}: Props) {
  const isBusy = isSending || isLoadingHistory
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const isEmpty = messages.length === 0

  return (
    <div className={styles.window}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onOpenHistory}
          aria-label="Open chat history"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {isEmpty && !isLoadingHistory ? (
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>What can I help with?</h1>

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

            {error && <ErrorBanner message={error} onDismiss={clearError} />}

            <MessageInput
              onSend={send}
              disabled={isBusy}
              maxLength={MAX_MESSAGE_LENGTH}
              variant="hero"
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.messages} role="log" aria-live="polite" aria-label="Chat messages">
            <div className={styles.messagesInner}>
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
          </footer>
        </>
      )}
    </div>
  )
}
