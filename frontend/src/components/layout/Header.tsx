"use client"

import { useRouter } from "next/navigation"
import { Brain, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase"

export function Header() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-violet-400" />
        <span className="text-sm font-bold text-white">Knowledge Copilot</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </header>
  )
}
