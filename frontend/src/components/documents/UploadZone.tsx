"use client"

import { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react"
import { uploadDocument } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Props {
  onUploaded: () => void
}

export function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setStatus("uploading")
    try {
      await Promise.all(Array.from(files).map((f) => uploadDocument(f)))
      setStatus("success")
      setMessage(`${files.length} file(s) queued for processing`)
      setTimeout(() => { setStatus("idle"); onUploaded() }, 2000)
    } catch (e: any) {
      setStatus("error")
      setMessage(e.message || "Upload failed")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }, [onUploaded])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
        dragging ? "border-violet-500 bg-violet-500/10" : "border-slate-700 hover:border-slate-600",
      )}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.csv,.md"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Drop files here or click to upload</p>
            <p className="text-slate-600 text-xs mt-1">PDF, DOCX, TXT, CSV, MD · Max 50MB</p>
          </motion.div>
        )}
        {status === "uploading" && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="h-8 w-8 text-violet-400 mx-auto mb-2 animate-spin" />
            <p className="text-slate-400 text-sm">Uploading...</p>
          </motion.div>
        )}
        {status === "success" && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 text-sm">{message}</p>
          </motion.div>
        )}
        {status === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
