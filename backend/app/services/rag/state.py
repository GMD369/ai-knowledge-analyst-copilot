from typing import TypedDict, Optional


class RetrievedChunk(TypedDict):
    content: str
    document_id: str
    filename: str
    page_number: Optional[int]
    score: float
    qdrant_point_id: str


class CitationDict(TypedDict):
    document_id: str
    filename: str
    page_number: Optional[int]
    chunk_text: str
    relevance_score: float


class RAGState(TypedDict):
    # Input
    query: str
    user_id: str
    conversation_id: Optional[str]
    document_ids: Optional[list[str]]
    conversation_history: list[dict]  # [{"role": "user"|"assistant", "content": str}]

    # Intermediate
    rewritten_query: str
    retrieved_chunks: list[RetrievedChunk]
    reranked_chunks: list[RetrievedChunk]
    attempt: int

    # Output
    answer: str
    citations: list[CitationDict]
    confidence: float
    tokens_used: Optional[int]
