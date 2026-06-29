import logging
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.core.supabase import get_supabase
from app.models.chat import ChatRequest, ChatResponse, ConversationResponse, ChatMessage, Citation, FeedbackRequest
from app.services.rag.graph import run_rag

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


def _load_history(conversation_id: str, user_id: str) -> list[dict]:
    supabase = get_supabase()
    resp = (
        supabase.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user_id)
        .order("created_at")
        .limit(20)
        .execute()
    )
    return resp.data or []


def _save_message(conversation_id: str, user_id: str, role: str, content: str, extra: dict = {}) -> str:
    supabase = get_supabase()
    result = supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        **extra,
    }).execute()
    return result.data[0]["id"]


def _write_analytics(user_id: str, event_type: str, metadata: dict = {}, **ids) -> None:
    try:
        get_supabase().table("analytics").insert({
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
            **ids,
        }).execute()
    except Exception as e:
        logger.warning(f"Analytics write failed: {e}")


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    user_id = current_user["id"]

    # Create or reuse conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = str(uuid4())
        title = request.message[:60]
        supabase.table("conversations").insert({
            "id": conversation_id,
            "user_id": user_id,
            "title": title,
        }).execute()
    else:
        # Verify ownership
        existing = (
            supabase.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # Load conversation history
    history = _load_history(conversation_id, user_id)

    # Save user message
    _save_message(conversation_id, user_id, "user", request.message)

    # Run LangGraph RAG workflow
    result = await run_rag(
        query=request.message,
        user_id=user_id,
        conversation_history=history,
        conversation_id=conversation_id,
        document_ids=request.document_ids,
    )

    # Save assistant message and capture its ID for feedback
    assistant_message_id = _save_message(
        conversation_id, user_id, "assistant", result["answer"],
        extra={
            "citations": result["citations"],
            "confidence": result["confidence"],
        },
    )

    _write_analytics(user_id, "query", conversation_id=conversation_id,
                     metadata={"confidence": result["confidence"], "doc_count": len(request.document_ids or [])})

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_message_id,
        answer=result["answer"],
        citations=[Citation(**c) for c in result["citations"]],
        confidence=result["confidence"],
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    resp = (
        supabase.table("conversations")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("updated_at", desc=True)
        .execute()
    )
    return [
        ConversationResponse(
            id=c["id"],
            user_id=c["user_id"],
            title=c.get("title"),
            messages=[],
            created_at=c["created_at"],
        )
        for c in resp.data
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    conv = (
        supabase.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    messages_resp = (
        supabase.table("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )

    return ConversationResponse(
        id=conv.data["id"],
        user_id=conv.data["user_id"],
        title=conv.data.get("title"),
        messages=[ChatMessage(**m) for m in messages_resp.data],
        created_at=conv.data["created_at"],
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    existing = (
        supabase.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    supabase.table("conversations").delete().eq("id", conversation_id).execute()
    return {"message": "Conversation deleted."}


@router.post("/messages/{message_id}/feedback", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    message_id: str,
    body: FeedbackRequest,
    current_user: dict = Depends(get_current_user),
):
    if body.rating not in (1, -1):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Rating must be 1 or -1.")

    supabase = get_supabase()
    user_id = current_user["id"]

    msg = supabase.table("messages").select("id").eq("id", message_id).eq("user_id", user_id).execute()
    if not msg.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    # Upsert so re-voting updates rather than duplicates
    supabase.table("feedback").upsert({
        "user_id": user_id,
        "message_id": message_id,
        "rating": body.rating,
        "comment": body.comment,
    }, on_conflict="user_id,message_id").execute()

    _write_analytics(user_id, "feedback", metadata={"rating": body.rating, "message_id": message_id})
    return {"message": "Feedback recorded."}
