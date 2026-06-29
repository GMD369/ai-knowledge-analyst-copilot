"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/chat")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <Brain className="h-8 w-8 text-violet-400" />
          <span className="text-xl font-bold text-white">Knowledge Copilot</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
          <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">New Password</label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Confirm Password</label>
              <Input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
