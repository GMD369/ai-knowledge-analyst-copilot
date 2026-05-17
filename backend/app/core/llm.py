from functools import lru_cache
from langchain_groq import ChatGroq
from app.core.config import settings


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.2,
        max_tokens=2048,
    )
