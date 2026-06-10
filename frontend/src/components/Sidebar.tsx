import type { ConversationMeta } from '../types'
import styles from './Sidebar.module.css'

interface Props {
  conversations: ConversationMeta[]
  activeId: string | null
  onNewChat: () => void
  onSelect: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  isOpen,
  onClose,
}: Props) {
  const handleNewChat = () => {
    onNewChat()
    onClose()
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.top}>
          <button type="button" className={styles.newChatBtn} onClick={handleNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New chat
          </button>
        </div>

        <div className={styles.listSection}>
          <p className={styles.sectionLabel}>Recent</p>
          <nav className={styles.list} aria-label="Chat history">
            {conversations.length === 0 ? (
              <p className={styles.empty}>No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className={`${styles.item} ${conv.id === activeId ? styles.active : ''}`}
                  onClick={() => handleSelect(conv.id)}
                  title={conv.title}
                >
                  <svg className={styles.itemIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className={styles.itemTitle}>{conv.title}</span>
                </button>
              ))
            )}
          </nav>
        </div>

        <div className={styles.footer}>
          <div className={styles.brand}>
            <span className={styles.brandDot} />
            Customer Chat Support
          </div>
        </div>
      </aside>
    </>
  )
}
