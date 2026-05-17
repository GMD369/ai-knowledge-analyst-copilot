"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, Trash2, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { deleteDocument } from "@/lib/api"
import type { Document } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  doc: Document
  onDeleted: () => void
}

const statusConfig = {
  pending:    { icon: Clock,        color: "text-yellow-400", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { icon: Loader2,      color: "text-blue-400 animate-spin", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ready:      { icon: CheckCircle,  color: "text-green-400", badge: "bg-green-500/10 text-green-400 border-green-500/20" },
  failed:     { icon: AlertCircle,  color: "text-red-400",   badge: "bg-red-500/10 text-red-400 border-red-500/20" },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentCard({ doc, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const config = statusConfig[doc.status]
  const StatusIcon = config.icon

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    await deleteDocument(doc.id)
    onDeleted()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/60 transition-colors"
    >
      <FileText className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm truncate font-medium">{doc.filename}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn("text-xs px-1.5 py-0", config.badge)}>
            <StatusIcon className={cn("h-3 w-3 mr-1", config.color)} />
            {doc.status}
          </Badge>
          <span className="text-slate-600 text-xs">{formatSize(doc.file_size)}</span>
          {doc.status === "ready" && (
            <span className="text-slate-600 text-xs">{doc.chunk_count} chunks</span>
          )}
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-600 hover:text-red-400"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </motion.div>
  )
}
