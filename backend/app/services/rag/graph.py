from functools import lru_cache
from langgraph.graph import StateGraph, END
from app.services.rag.state import RAGState
from app.services.rag.nodes import (
    query_rewriter,
    retriever,
    reranker,
    answer_generator,
    confidence_evaluator,
    fallback_handler,
    route_after_confidence,
)


@lru_cache(maxsize=1)
def build_rag_graph():
    graph = StateGraph(RAGState)

    graph.add_node("query_rewriter", query_rewriter)
    graph.add_node("retriever", retriever)
    graph.add_node("reranker", reranker)
    graph.add_node("answer_generator", answer_generator)
    graph.add_node("confidence_evaluator", confidence_evaluator)
    graph.add_node("fallback_handler", fallback_handler)

    # Entry point
    graph.set_entry_point("query_rewriter")

    # Linear flow
    graph.add_edge("query_rewriter", "retriever")
    graph.add_edge("retriever", "reranker")
    graph.add_edge("reranker", "answer_generator")
    graph.add_edge("answer_generator", "confidence_evaluator")

    # Conditional routing after confidence check
    graph.add_conditional_edges(
        "confidence_evaluator",
        route_after_confidence,
        {
            "end": END,
            "retry": "query_rewriter",   # loop back with a new rewrite attempt
            "fallback": "fallback_handler",
        },
    )

    graph.add_edge("fallback_handler", END)

    return graph.compile()


async def run_rag(
    query: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
    conversation_id: str | None = None,
    document_ids: list[str] | None = None,
) -> dict:
    compiled = build_rag_graph()

    initial_state: RAGState = {
        "query": query,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "document_ids": document_ids,
        "conversation_history": conversation_history or [],
        "rewritten_query": "",
        "retrieved_chunks": [],
        "reranked_chunks": [],
        "attempt": 0,
        "answer": "",
        "citations": [],
        "confidence": 0.0,
    }

    final_state = await compiled.ainvoke(initial_state)

    return {
        "answer": final_state["answer"],
        "citations": final_state["citations"],
        "confidence": final_state["confidence"],
    }
