from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.chat import ChatRequest, ChatResponse, ConversationResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    # TODO: invoke LangGraph RAG workflow
    return ChatResponse(
        conversation_id=request.conversation_id or "new",
        answer="RAG workflow not yet implemented.",
        citations=[],
        confidence=0.0,
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    # TODO: fetch from Supabase
    return []


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    # TODO: fetch from Supabase
    pass
