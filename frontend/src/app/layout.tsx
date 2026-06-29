import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Knowledge Analyst Copilot",
  description: "AI-powered document analysis with RAG",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.className} bg-slate-950 text-white antialiased h-full`}>
        {children}
      </body>
    </html>
  )
}
