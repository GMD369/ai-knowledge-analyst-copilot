"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, MessageSquarePlus } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"
import { CitationPanel } from "./CitationPanel"
import { sendMessage } from "@/lib/api"
import type { Message, Citation } from "@/lib/types"

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [activeCitations, setActiveCitations] = useState<Citation[] | null>(null)
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)

    try {
      const result = await sendMessage(text, conversationId)
      if (!conversationId) setConversationId(result.conversation_id)

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        citations: result.citations,
        confidence: result.confidence,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${e.message}`,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setThinking(false)
    }
  }, [conversationId])

  function newChat() {
    setMessages([])
    setConversationId(undefined)
    setActiveCitations(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">
              {conversationId ? "Active conversation" : "New conversation"}
            </span>
          </div>
          <button
            onClick={newChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {messages.length === 0 && !thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-3 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Brain className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">AI Knowledge Analyst</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                Upload documents in the sidebar, then ask questions to get AI-powered answers with citations.
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onShowCitations={(m) => setActiveCitations(m.citations ?? null)}
            />
          ))}

          {/* Thinking indicator */}
          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-violet-400" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 bg-violet-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={thinking} />
      </div>

      {/* Citation panel */}
      {activeCitations && activeCitations.length > 0 && (
        <CitationPanel
          citations={activeCitations}
          onClose={() => setActiveCitations(null)}
        />
      )}
    </div>
  )
}
