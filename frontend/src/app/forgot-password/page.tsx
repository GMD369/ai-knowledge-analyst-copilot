"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Loader2, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm">
            We sent a password reset link to <span className="text-white">{email}</span>
          </p>
          <Link href="/login">
            <Button className="mt-6 bg-violet-600 hover:bg-violet-500 w-full">Back to Login</Button>
          </Link>
        </motion.div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
          <p className="text-slate-400 text-sm mb-6">Enter your email and we'll send a reset link</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
