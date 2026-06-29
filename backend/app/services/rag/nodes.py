import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.llm import get_llm
from app.core.supabase import get_supabase
from app.services.vector_store import search
from app.services.rag.state import RAGState, RetrievedChunk

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.5
MAX_ATTEMPTS = 2


# ── Node 1: Query Rewriter ────────────────────────────────────────────────────

async def query_rewriter(state: RAGState) -> dict:
    llm = get_llm()
    history_text = ""
    if state.get("conversation_history"):
        lines = [f"{m['role'].upper()}: {m['content']}" for m in state["conversation_history"][-4:]]
        history_text = "\n".join(lines)

    prompt = f"""You are a query optimization assistant. Rewrite the user query to be more specific and retrieval-friendly.
- Expand abbreviations
- Add relevant context from conversation history if needed
- Keep it concise (1-2 sentences)
- Return ONLY the rewritten query, nothing else

Conversation history:
{history_text or "None"}

Original query: {state["query"]}

Rewritten query:"""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    rewritten = response.content.strip()
    logger.info(f"Query rewritten: '{state['query']}' → '{rewritten}'")
    return {"rewritten_query": rewritten, "attempt": state.get("attempt", 0) + 1}


# ── Node 2: Retriever ─────────────────────────────────────────────────────────

async def retriever(state: RAGState) -> dict:
    from app.services.embedder import embed_query
    query_text = state.get("rewritten_query") or state["query"]
    query_vector = await embed_query(query_text)

    scored_points = await search(
        query_vector=query_vector,
        user_id=state["user_id"],
        document_ids=state.get("document_ids"),
    )

    if not scored_points:
        logger.warning("No chunks retrieved from Qdrant.")
        return {"retrieved_chunks": []}

    # Fetch filenames from Supabase for all unique document_ids
    doc_ids = list({p.payload["document_id"] for p in scored_points})
    supabase = get_supabase()
    docs_resp = supabase.table("documents").select("id, filename").in_("id", doc_ids).execute()
    filename_map = {d["id"]: d["filename"] for d in docs_resp.data}

    chunks: list[RetrievedChunk] = [
        {
            "content": p.payload["content"],
            "document_id": p.payload["document_id"],
            "filename": filename_map.get(p.payload["document_id"], "Unknown"),
            "page_number": p.payload.get("page_number"),
            "score": p.score,
            "qdrant_point_id": str(p.id),
        }
        for p in scored_points
    ]
    logger.info(f"Retrieved {len(chunks)} chunks.")
    return {"retrieved_chunks": chunks}


# ── Node 3: Reranker ──────────────────────────────────────────────────────────

async def reranker(state: RAGState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        return {"reranked_chunks": []}

    query = state.get("rewritten_query") or state["query"]
    query_words = set(query.lower().split())

    def score(chunk: RetrievedChunk) -> float:
        # Combine Qdrant cosine score with keyword overlap boost
        text_words = set(chunk["content"].lower().split())
        overlap = len(query_words & text_words) / max(len(query_words), 1)
        return chunk["score"] * 0.8 + overlap * 0.2

    reranked = sorted(chunks, key=score, reverse=True)
    logger.info(f"Reranked {len(reranked)} chunks.")
    return {"reranked_chunks": reranked}


# ── Node 4: Answer Generator ──────────────────────────────────────────────────

async def answer_generator(state: RAGState) -> dict:
    chunks = state.get("reranked_chunks") or state.get("retrieved_chunks", [])

    if not chunks:
        return {
            "answer": "I could not find relevant information in your documents to answer this question.",
            "citations": [],
            "confidence": 0.0,
        }

    context_parts = []
    for i, chunk in enumerate(chunks[:5], start=1):
        page_info = f", page {chunk['page_number']}" if chunk.get("page_number") else ""
        context_parts.append(f"[{i}] Source: {chunk['filename']}{page_info}\n{chunk['content']}")
    context = "\n\n---\n\n".join(context_parts)

    # Build message history for multi-turn context
    messages = [
        SystemMessage(content="""You are an expert knowledge analyst. Answer questions using ONLY the provided document context.
Rules:
- Cite sources using [1], [2], etc. matching the numbered context chunks
- If the answer is not in the context, say so clearly
- Be precise, structured, and helpful
- Do not hallucinate facts not present in the context"""),
    ]

    for msg in (state.get("conversation_history") or [])[-4:]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=f"""Context documents:
{context}

Question: {state["query"]}

Answer (cite sources using [1], [2], etc.):"""))

    llm = get_llm()
    response = await llm.ainvoke(messages)
    answer = response.content.strip()

    # Build citations for chunks actually referenced in the answer
    citations = []
    for i, chunk in enumerate(chunks[:5], start=1):
        if f"[{i}]" in answer:
            citations.append({
                "document_id": chunk["document_id"],
                "filename": chunk["filename"],
                "page_number": chunk.get("page_number"),
                "chunk_text": chunk["content"][:300],
                "relevance_score": round(chunk["score"], 4),
            })

    usage = response.response_metadata.get("token_usage", {})
    tokens_used = usage.get("total_tokens")
    logger.info(f"Generated answer with {len(citations)} citations, {tokens_used} tokens.")
    return {"answer": answer, "citations": citations, "tokens_used": tokens_used}


# ── Node 5: Confidence Evaluator ─────────────────────────────────────────────

async def confidence_evaluator(state: RAGState) -> dict:
    chunks = state.get("reranked_chunks") or state.get("retrieved_chunks", [])
    answer = state.get("answer", "")
    citations = state.get("citations", [])

    if not chunks or not answer:
        return {"confidence": 0.0}

    top_score = chunks[0]["score"] if chunks else 0.0
    citation_ratio = len(citations) / max(len(chunks[:5]), 1)
    has_uncertainty = any(
        phrase in answer.lower()
        for phrase in ["i don't know", "not found", "cannot find", "no information", "not in the context"]
    )

    confidence = (top_score * 0.6 + citation_ratio * 0.4)
    if has_uncertainty:
        confidence *= 0.4

    confidence = round(min(max(confidence, 0.0), 1.0), 4)
    logger.info(f"Confidence score: {confidence}")
    return {"confidence": confidence}


# ── Node 6: Fallback Handler ──────────────────────────────────────────────────

async def fallback_handler(state: RAGState) -> dict:
    logger.warning(f"Fallback triggered. Attempt: {state.get('attempt')}, Confidence: {state.get('confidence')}")
    fallback_answer = (
        "I was unable to find a confident answer in your documents. "
        "Please try rephrasing your question or upload more relevant documents."
    )
    return {"answer": fallback_answer, "citations": [], "confidence": 0.0}


# ── Routing Logic ─────────────────────────────────────────────────────────────

def route_after_confidence(state: RAGState) -> str:
    confidence = state.get("confidence", 0.0)
    attempt = state.get("attempt", 1)

    if confidence >= CONFIDENCE_THRESHOLD:
        return "end"
    if attempt < MAX_ATTEMPTS:
        return "retry"
    return "fallback"
