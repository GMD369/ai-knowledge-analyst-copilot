"use client"

import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, X, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Citation } from "@/lib/types"

interface Props {
  citations: Citation[]
  onClose: () => void
}

export function CitationPanel({ citations, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.2 }}
        className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full"
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">Sources</span>
            <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
              {citations.length}
            </Badge>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {citations.map((citation, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-3"
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-1.5 py-0.5">
                  [{i + 1}]
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <p className="text-slate-300 text-xs font-medium truncate">{citation.filename}</p>
                  </div>
                  {citation.page_number && (
                    <p className="text-slate-500 text-xs mt-0.5">Page {citation.page_number}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {Math.round(citation.relevance_score * 100)}%
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-4">
                {citation.chunk_text}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
