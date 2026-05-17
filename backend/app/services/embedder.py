import asyncio
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from app.core.config import settings


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer(settings.EMBEDDING_MODEL)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    loop = asyncio.get_event_loop()
    model = _get_model()
    # Run in thread pool so it doesn't block the async event loop
    embeddings = await loop.run_in_executor(
        None, lambda: model.encode(texts, show_progress_bar=False).tolist()
    )
    return embeddings


async def embed_query(text: str) -> list[float]:
    embeddings = await embed_texts([text])
    return embeddings[0]
