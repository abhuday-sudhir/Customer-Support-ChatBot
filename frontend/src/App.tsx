import { useState } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { Sidebar } from './components/Sidebar'
import { useChat } from './hooks/useChat'
import './App.css'

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const chat = useChat()

  return (
    <div className="app-shell">
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.sessionId}
        onNewChat={chat.startNewChat}
        onSelect={chat.selectConversation}
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen((open) => !open)}
        onCloseHistory={() => setHistoryOpen(false)}
      />
      <main className="main">
        <ChatWindow
          messages={chat.messages}
          isSending={chat.isSending}
          isLoadingHistory={chat.isLoadingHistory}
          error={chat.error}
          send={chat.send}
          clearError={chat.clearError}
          onOpenHistory={() => setHistoryOpen(true)}
        />
      </main>
    </div>
  )
}
