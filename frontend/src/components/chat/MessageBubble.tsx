"use client"

import { motion } from "framer-motion"
import { Brain, User, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"

interface Props {
  message: Message
  onShowCitations: (message: Message) => void
}

export function MessageBubble({ message, onShowCitations }: Props) {
  const isUser = message.role === "user"

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

        {!isUser && message.citations && message.citations.length > 0 && (
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
      </div>
    </motion.div>
  )
}
