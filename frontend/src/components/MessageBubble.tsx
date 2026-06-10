import type { Message } from '../types'
import { RobotIcon } from './RobotIcon'
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
          <RobotIcon size={16} />
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
