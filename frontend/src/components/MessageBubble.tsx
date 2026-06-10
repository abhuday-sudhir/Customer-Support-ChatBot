import type { Message } from '../types'
import styles from './MessageBubble.module.css'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.sender === 'user'

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
      {!isUser && (
        <div className={styles.avatar} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}
      <div className={styles.content}>
        {isUser ? (
          <div className={styles.userBubble}>
            <p className={styles.text}>{message.text}</p>
          </div>
        ) : (
          <p className={styles.aiText}>{message.text}</p>
        )}
      </div>
    </div>
  )
}
