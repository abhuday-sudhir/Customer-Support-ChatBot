import { RobotIcon } from './RobotIcon'
import styles from './TypingIndicator.module.css'

export function TypingIndicator() {
  return (
    <div className={styles.row} role="status" aria-label="Agent is typing">
      <div className={styles.avatar}>
        <RobotIcon size={16} />
      </div>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}
