import { createClient } from "@/lib/supabase"
import type { Document, ChatResponse, Conversation } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL!

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export async function uploadDocument(file: File): Promise<{ message: string }> {
  const headers = await getAuthHeaders()
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API_URL}/api/v1/documents/upload`, {
    method: "POST",
    headers,
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchDocuments(): Promise<Document[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/v1/documents/`, { headers })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.documents
}

export async function deleteDocument(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_URL}/api/v1/documents/${id}`, { method: "DELETE", headers })
}

export async function sendMessage(
  message: string,
  conversationId?: string,
  documentIds?: string[]
): Promise<ChatResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/v1/chat/`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId, document_ids: documentIds }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchConversations(): Promise<Conversation[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/v1/chat/conversations`, { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/v1/chat/conversations/${id}`, { headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_URL}/api/v1/chat/conversations/${id}`, { method: "DELETE", headers })
}

export async function reIngestDocument(id: string): Promise<{ message: string }> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/v1/documents/${id}/reingest`, { method: "POST", headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_URL}/api/v1/chat/conversations/${id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
}

export async function submitFeedback(messageId: string, rating: 1 | -1): Promise<void> {
  const headers = await getAuthHeaders()
  await fetch(`${API_URL}/api/v1/chat/messages/${messageId}/feedback`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  })
}
