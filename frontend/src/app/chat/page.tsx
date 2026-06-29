"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/layout/Header"
import { DocumentSidebar } from "@/components/documents/DocumentSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default function ChatPage() {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleToggle = useCallback((id: string) => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden relative">
        <DocumentSidebar
          selectedIds={selectedDocumentIds}
          onToggle={handleToggle}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <ChatWindow selectedDocumentIds={selectedDocumentIds} />
      </div>
    </div>
  )
}
