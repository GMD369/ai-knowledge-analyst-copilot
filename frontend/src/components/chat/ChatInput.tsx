"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Send, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Props {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const text = value.trim()
    if (!text || loading || disabled) return
    setValue("")
    setLoading(true)
    try {
      await onSend(text)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-4">
      <div className="flex items-end gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-violet-500 transition-colors">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          rows={1}
          disabled={loading || disabled}
          className="flex-1 bg-transparent border-0 resize-none text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 p-0 text-sm"
          style={{ maxHeight: "140px" }}
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!value.trim() || loading || disabled}
          className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
            value.trim() && !loading
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          )}
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </motion.button>
      </div>
      <p className="text-slate-600 text-xs text-center mt-2">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
