import type { ConversationMeta } from '../types'
import { RobotIcon } from './RobotIcon'
import styles from './Sidebar.module.css'

interface Props {
  conversations: ConversationMeta[]
  activeId: string | null
  onNewChat: () => void
  onSelect: (id: string) => void
  historyOpen: boolean
  onToggleHistory: () => void
  onCloseHistory: () => void
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  historyOpen,
  onToggleHistory,
  onCloseHistory,
}: Props) {
  const handleNewChat = () => {
    onNewChat()
    onCloseHistory()
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    onCloseHistory()
  }

  return (
    <>
      {historyOpen && (
        <div className={styles.overlay} onClick={onCloseHistory} aria-hidden="true" />
      )}

      <div className={styles.shell}>
        <nav className={styles.rail} aria-label="Main navigation">
          <div className={styles.railLogo} aria-hidden="true">
            <RobotIcon size={20} />
          </div>

          <button
            type="button"
            className={styles.railBtn}
            onClick={handleNewChat}
            title="New chat"
            aria-label="New chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <button
            type="button"
            className={`${styles.railBtn} ${historyOpen ? styles.railBtnActive : ''}`}
            onClick={onToggleHistory}
            title="Chat history"
            aria-label="Chat history"
            aria-expanded={historyOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

        </nav>

        <aside className={`${styles.drawer} ${historyOpen ? styles.drawerOpen : ''}`}>
          <div className={styles.drawerHeader}>
            <p className={styles.drawerTitle}>Recent chats</p>
            <button
              type="button"
              className={styles.drawerClose}
              onClick={onCloseHistory}
              aria-label="Close history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

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
                  <svg className={styles.itemIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className={styles.itemTitle}>{conv.title}</span>
                </button>
              ))
            )}
          </nav>
        </aside>
      </div>
    </>
  )
}
