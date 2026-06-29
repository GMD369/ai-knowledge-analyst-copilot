"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Trash2, Loader2, Plus } from "lucide-react"
import { fetchConversations, deleteConversation } from "@/lib/api"
import type { Conversation } from "@/lib/types"

interface Props {
  activeId?: string
  onSelect: (conversation: Conversation) => void
  onNew: () => void
}

export function ConversationList({ activeId, onSelect, onNew }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConversations(data)
    } catch {
      // silently fail — sidebar still usable
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) onNew()
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  return (
    <div className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">History</span>
        </div>
        <button
          onClick={onNew}
          className="text-slate-500 hover:text-violet-400 transition-colors"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {loading ? (
          <div className="flex justify-center mt-6">
            <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-slate-600 text-xs text-center mt-8 px-2">No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => onSelect(conv)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(conv)}
              className={`group w-full text-left px-2.5 py-2 rounded-lg transition-colors flex flex-col gap-0.5 cursor-pointer ${
                activeId === conv.id
                  ? "bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-slate-800 border border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className={`text-xs font-medium truncate flex-1 leading-snug ${
                  activeId === conv.id ? "text-violet-300" : "text-slate-300"
                }`}>
                  {conv.title || "Untitled"}
                </p>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-slate-600 hover:text-red-400 mt-0.5"
                >
                  {deletingId === conv.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" />
                  }
                </button>
              </div>
              <p className="text-slate-600 text-xs">{formatDate(conv.created_at)}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
