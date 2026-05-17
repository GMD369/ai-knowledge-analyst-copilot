from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class DocumentStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int


class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    status: DocumentStatus
    chunk_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
