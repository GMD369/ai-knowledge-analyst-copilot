from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    created_at: Optional[datetime] = None


class Citation(BaseModel):
    document_id: str
    filename: str
    page_number: Optional[int] = None
    chunk_text: str
    relevance_score: float


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    document_ids: Optional[list[str]] = None  # filter to specific docs


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    citations: list[Citation] = []
    confidence: float = Field(ge=0.0, le=1.0)
    tokens_used: Optional[int] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    messages: list[ChatMessage] = []
    created_at: datetime
