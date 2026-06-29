"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Brain, User, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { submitFeedback } from "@/lib/api"
import type { Message } from "@/lib/types"

interface Props {
  message: Message
  onShowCitations: (message: Message) => void
}

export function MessageBubble({ message, onShowCitations }: Props) {
  const isUser = message.role === "user"
  const [feedback, setFeedback] = useState<1 | -1 | null>(message.feedback ?? null)

  async function handleFeedback(rating: 1 | -1) {
    if (!message.message_id || feedback !== null) return
    setFeedback(rating)
    try {
      await submitFeedback(message.message_id, rating)
    } catch {
      setFeedback(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser ? "bg-violet-600" : "bg-slate-800 border border-slate-700"
      )}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Brain className="h-4 w-4 text-violet-400" />
        }
      </div>

      <div className={cn("max-w-[75%] flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-violet-600 text-white rounded-tr-sm"
            : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm"
        )}>
          {message.content}
        </div>

        {!isUser && (
          <div className="flex items-center gap-3">
            {message.citations && message.citations.length > 0 && (
              <button
                onClick={() => onShowCitations(message)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <BookOpen className="h-3 w-3" />
                {message.citations.length} source{message.citations.length > 1 ? "s" : ""}
                {message.confidence !== undefined && (
                  <Badge variant="outline" className="ml-1 text-xs bg-slate-800 text-slate-400 border-slate-700 px-1.5 py-0">
                    {Math.round(message.confidence * 100)}% confidence
                  </Badge>
                )}
              </button>
            )}

            {message.message_id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(1)}
                  disabled={feedback !== null}
                  className={cn(
                    "p-1 rounded transition-colors",
                    feedback === 1
                      ? "text-green-400"
                      : "text-slate-600 hover:text-green-400 disabled:cursor-default"
                  )}
                  title="Good answer"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback(-1)}
                  disabled={feedback !== null}
                  className={cn(
                    "p-1 rounded transition-colors",
                    feedback === -1
                      ? "text-red-400"
                      : "text-slate-600 hover:text-red-400 disabled:cursor-default"
                  )}
                  title="Bad answer"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
