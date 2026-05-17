from uuid import uuid4, UUID
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    ScoredPoint,
)
from app.core.config import settings

_client: AsyncQdrantClient | None = None


def _get_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
        )
    return _client


async def ensure_collection() -> None:
    client = _get_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    if settings.QDRANT_COLLECTION not in names:
        await client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=settings.EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )


async def upsert_chunks(
    chunks_with_embeddings: list[dict],
) -> list[str]:
    """
    Each item: {content, chunk_index, page_number, document_id, user_id, embedding}
    Returns list of Qdrant point IDs (as strings).
    """
    client = _get_client()
    await ensure_collection()

    points = []
    point_ids = []

    for item in chunks_with_embeddings:
        point_id = str(uuid4())
        point_ids.append(point_id)
        points.append(
            PointStruct(
                id=point_id,
                vector=item["embedding"],
                payload={
                    "content": item["content"],
                    "document_id": item["document_id"],
                    "user_id": item["user_id"],
                    "chunk_index": item["chunk_index"],
                    "page_number": item["page_number"],
                },
            )
        )

    await client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
    return point_ids


async def search(
    query_vector: list[float],
    user_id: str,
    document_ids: list[str] | None = None,
    top_k: int | None = None,
) -> list[ScoredPoint]:
    client = _get_client()
    k = top_k or settings.TOP_K_RESULTS

    must = [FieldCondition(key="user_id", match=MatchValue(value=user_id))]
    if document_ids:
        must.append(FieldCondition(key="document_id", match=MatchValue(value=document_ids)))

    results = await client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        query_filter=Filter(must=must),
        limit=k,
        with_payload=True,
    )
    return results


async def delete_by_document(document_id: str) -> None:
    client = _get_client()
    await client.delete(
        collection_name=settings.QDRANT_COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        ),
    )
