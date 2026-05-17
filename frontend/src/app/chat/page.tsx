import { Header } from "@/components/layout/Header"
import { DocumentSidebar } from "@/components/documents/DocumentSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <DocumentSidebar />
        <ChatWindow />
      </div>
    </div>
  )
}
