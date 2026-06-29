"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Files, RefreshCw } from "lucide-react"
import { fetchDocuments } from "@/lib/api"
import { UploadZone } from "./UploadZone"
import { DocumentCard } from "./DocumentCard"
import type { Document } from "@/lib/types"

interface Props {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  open?: boolean
  onClose?: () => void
}

export function DocumentSidebar({ selectedIds, onToggle, open = false, onClose }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
    } catch (e: any) {
      setError(e.message ?? "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Poll every 8s to reflect processing status changes
  useEffect(() => {
    const hasPending = documents.some((d) => d.status === "pending" || d.status === "processing")
    if (!hasPending) return
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [documents, load])

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    <aside className={`
      w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full
      fixed md:relative inset-y-0 left-0 z-40
      transition-transform duration-200
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Files className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Documents</span>
          <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
            {documents.length}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        <button onClick={load} className="text-slate-500 hover:text-slate-300 transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-3 border-b border-slate-800">
        <UploadZone onUploaded={load} />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && documents.length === 0 ? (
          <div className="flex flex-col gap-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500 text-xs text-center mt-8 px-2">{error}</p>
        ) : documents.length === 0 ? (
          <p className="text-slate-600 text-xs text-center mt-8">No documents yet. Upload one above.</p>
        ) : (
          <motion.div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                selected={selectedIds.has(doc.id)}
                onToggle={onToggle}
                onDeleted={load}
              />
            ))}
          </motion.div>
        )}
      </div>
      {documents.some(d => d.status === "ready") && (
        <p className="text-slate-600 text-xs text-center py-2 px-3 border-t border-slate-800">
          Check docs to filter chat
        </p>
      )}
    </aside>
    </>
  )
}
