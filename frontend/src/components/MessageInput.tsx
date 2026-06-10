import { useState, type KeyboardEvent, type ChangeEvent } from 'react'
import styles from './MessageInput.module.css'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  maxLength: number
}

export function MessageInput({ onSend, disabled, maxLength }: Props) {
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
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
