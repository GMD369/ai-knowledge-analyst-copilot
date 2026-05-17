import logging
from app.core.supabase import get_supabase
from app.services.extractor import extract
from app.services.chunker import chunk_pages
from app.services.embedder import embed_texts
from app.services.vector_store import upsert_chunks

logger = logging.getLogger(__name__)


async def ingest_document(
    document_id: str,
    user_id: str,
    filename: str,
    content: bytes,
) -> None:
    supabase = get_supabase()

    try:
        # Mark as processing
        supabase.table("documents").update({"status": "processing"}).eq("id", document_id).execute()

        # 1. Extract text
        pages = extract(filename, content)
        if not pages:
            raise ValueError("No text could be extracted from the document.")

        # 2. Chunk
        chunks = chunk_pages(pages)
        if not chunks:
            raise ValueError("Document produced no chunks after splitting.")

        # 3. Embed
        texts = [c.content for c in chunks]
        embeddings = await embed_texts(texts)

        # 4. Build payload for Qdrant
        chunks_payload = [
            {
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "document_id": document_id,
                "user_id": user_id,
                "embedding": embedding,
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]

        # 5. Upsert into Qdrant
        point_ids = await upsert_chunks(chunks_payload)

        # 6. Save chunks to Supabase
        chunk_rows = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "page_number": chunk.page_number,
                "token_count": len(chunk.content.split()),
                "qdrant_point_id": point_id,
            }
            for chunk, point_id in zip(chunks, point_ids)
        ]
        supabase.table("chunks").insert(chunk_rows).execute()

        # 7. Mark document as ready
        supabase.table("documents").update({
            "status": "ready",
            "chunk_count": len(chunks),
        }).eq("id", document_id).execute()

        logger.info(f"Ingested document {document_id}: {len(chunks)} chunks.")

    except Exception as e:
        logger.error(f"Ingestion failed for document {document_id}: {e}")
        supabase.table("documents").update({
            "status": "failed",
            "error_msg": str(e),
        }).eq("id", document_id).execute()
        raise
