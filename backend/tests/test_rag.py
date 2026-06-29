"""Unit tests for RAG pipeline nodes — pure logic, no external services."""
import pytest
from app.services.rag.nodes import reranker, confidence_evaluator, route_after_confidence
from app.services.rag.state import RAGState, RetrievedChunk


def _make_chunk(content: str, score: float, doc_id: str = "doc1") -> RetrievedChunk:
    return RetrievedChunk(
        content=content,
        document_id=doc_id,
        filename="test.pdf",
        page_number=1,
        score=score,
        qdrant_point_id="point-1",
    )


def _base_state(**overrides) -> RAGState:
    state: RAGState = {
        "query": "what is RAG?",
        "user_id": "user-1",
        "conversation_id": None,
        "document_ids": None,
        "conversation_history": [],
        "rewritten_query": "what is retrieval augmented generation",
        "retrieved_chunks": [],
        "reranked_chunks": [],
        "attempt": 1,
        "answer": "",
        "citations": [],
        "confidence": 0.0,
    }
    state.update(overrides)
    return state


# ── Reranker ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_reranker_sorts_by_combined_score():
    # rewritten_query = "what is retrieval augmented generation" (5 words, no punctuation)
    # chunk B overlaps on "retrieval", "augmented", "generation" → 3/5 = 0.6 keyword score
    # chunk A (score=0.61): 0.61*0.8 + 0.0*0.2 = 0.488
    # chunk B (score=0.60): 0.60*0.8 + 0.6*0.2 = 0.480 + 0.12 = 0.600  → B wins
    chunks = [
        _make_chunk("unrelated stuff here", score=0.61),
        _make_chunk("retrieval augmented generation explained", score=0.60),
    ]
    state = _base_state(retrieved_chunks=chunks)
    result = await reranker(state)
    reranked = result["reranked_chunks"]
    assert reranked[0]["content"] == "retrieval augmented generation explained"


@pytest.mark.asyncio
async def test_reranker_empty_returns_empty():
    state = _base_state(retrieved_chunks=[])
    result = await reranker(state)
    assert result["reranked_chunks"] == []


@pytest.mark.asyncio
async def test_reranker_preserves_all_chunks():
    chunks = [_make_chunk(f"chunk {i}", score=0.5) for i in range(5)]
    state = _base_state(retrieved_chunks=chunks)
    result = await reranker(state)
    assert len(result["reranked_chunks"]) == 5


# ── Confidence Evaluator ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_confidence_high_score_and_citations():
    chunks = [_make_chunk("relevant content", score=0.9)]
    citations = [{"document_id": "doc1", "filename": "test.pdf", "chunk_text": "...", "relevance_score": 0.9}]
    state = _base_state(reranked_chunks=chunks, answer="The answer is [1].", citations=citations)
    result = await confidence_evaluator(state)
    assert result["confidence"] > 0.5


@pytest.mark.asyncio
async def test_confidence_penalized_by_uncertainty():
    chunks = [_make_chunk("some content", score=0.8)]
    state = _base_state(
        reranked_chunks=chunks,
        answer="I don't know the answer to this question.",
        citations=[],
    )
    result = await confidence_evaluator(state)
    assert result["confidence"] < 0.4


@pytest.mark.asyncio
async def test_confidence_zero_when_no_chunks():
    state = _base_state(reranked_chunks=[], answer="some answer", citations=[])
    result = await confidence_evaluator(state)
    assert result["confidence"] == 0.0


@pytest.mark.asyncio
async def test_confidence_clamped_between_0_and_1():
    chunks = [_make_chunk("content", score=1.0)]
    citations = [{"document_id": "doc1", "filename": "test.pdf", "chunk_text": "...", "relevance_score": 1.0}]
    state = _base_state(reranked_chunks=chunks, answer="Great answer [1].", citations=citations)
    result = await confidence_evaluator(state)
    assert 0.0 <= result["confidence"] <= 1.0


# ── Router ────────────────────────────────────────────────────────────────────

def test_route_high_confidence_goes_to_end():
    state = _base_state(confidence=0.8, attempt=1)
    assert route_after_confidence(state) == "end"


def test_route_low_confidence_first_attempt_retries():
    state = _base_state(confidence=0.3, attempt=1)
    assert route_after_confidence(state) == "retry"


def test_route_low_confidence_max_attempts_falls_back():
    state = _base_state(confidence=0.3, attempt=2)
    assert route_after_confidence(state) == "fallback"


def test_route_exact_threshold_passes():
    state = _base_state(confidence=0.5, attempt=1)
    assert route_after_confidence(state) == "end"
