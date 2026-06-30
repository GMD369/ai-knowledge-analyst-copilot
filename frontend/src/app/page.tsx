"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Brain, FileText, Search, MessageSquare, ShieldCheck, Zap, ArrowRight } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Upload Any Document",
    description: "PDF, DOCX, and TXT — ingest your knowledge base in seconds.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "384-dim embeddings and Qdrant vector search surface the most relevant chunks instantly.",
  },
  {
    icon: MessageSquare,
    title: "Context-Aware Chat",
    description: "LangGraph pipeline rewrites queries, reranks results, and generates cited answers.",
  },
  {
    icon: ShieldCheck,
    title: "Confidence Evaluation",
    description: "Low-confidence answers trigger an automatic retry loop before reaching you.",
  },
  {
    icon: Zap,
    title: "Groq-Powered Speed",
    description: "Llama 3.3 70B via Groq delivers near-instant LLM responses at scale.",
  },
  {
    icon: Brain,
    title: "Full Conversation Memory",
    description: "Multi-turn history with title editing, filtering by document, and feedback.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-violet-400" />
          <span className="font-bold text-white">Knowledge Copilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 pt-24 pb-20 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="h-3 w-3" />
            Powered by LangGraph + Groq
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Chat with your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              documents
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload PDFs, Word files, or text documents and ask anything. A six-node RAG pipeline
            retrieves, reranks, and generates confident answers — with citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Pipeline diagram */}
      <section className="px-4 pb-20 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-5 text-center font-medium">RAG Pipeline</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {["Query Rewriter", "Retriever", "Reranker", "Answer Generator", "Confidence Evaluator", "Fallback Handler"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-slate-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                <f.icon className="h-4 w-4 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 max-w-2xl mx-auto w-full text-center">
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-slate-400 text-sm mb-6">Create a free account and start chatting with your documents in minutes.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Create account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Brain className="h-4 w-4 text-violet-400" />
            <span>Knowledge Copilot</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-slate-400 transition-colors">Sign up</Link>
            <a
              href="https://github.com/GMD369"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
