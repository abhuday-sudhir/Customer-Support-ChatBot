import { useState, type KeyboardEvent, type ChangeEvent } from 'react'
import styles from './MessageInput.module.css'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  maxLength: number
  variant?: 'default' | 'hero'
}

export function MessageInput({ onSend, disabled, maxLength, variant = 'default' }: Props) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const remaining = maxLength - value.length
  const nearLimit = remaining < 200

  return (
    <div className={`${styles.wrapper} ${variant === 'hero' ? styles.wrapperHero : ''}`}>
      <div className={styles.card}>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          aria-label="Message input"
        />

        <button
          type="button"
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          {disabled ? (
            <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {nearLimit && (
        <span className={styles.counter} aria-live="polite">
          {remaining} characters remaining
        </span>
      )}
    </div>
  )
}
