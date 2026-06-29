import asyncio
import logging
from uuid import uuid4
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, BackgroundTasks

from app.core.security import get_current_user
from app.core.supabase import get_supabase
from app.models.document import DocumentListResponse, DocumentResponse, DocumentStatus
from app.models.common import MessageResponse
from app.services.ingestion import ingest_document

logger = logging.getLogger(__name__)


def _write_analytics(user_id: str, event_type: str, document_id: str = None, metadata: dict = {}) -> None:
    try:
        row = {"user_id": user_id, "event_type": event_type, "metadata": metadata}
        if document_id:
            row["document_id"] = document_id
        get_supabase().table("analytics").insert(row).execute()
    except Exception as e:
        logger.warning(f"Analytics write failed: {e}")

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".md"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _parse_doc(row: dict) -> DocumentResponse:
    return DocumentResponse(
        id=row["id"],
        user_id=row["user_id"],
        filename=row["filename"],
        file_type=row["file_type"],
        file_size=row["file_size"],
        status=DocumentStatus(row["status"]),
        chunk_count=row.get("chunk_count", 0),
        created_at=row["created_at"],
        updated_at=row.get("updated_at"),
    )


@router.post("/upload", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    from pathlib import Path
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{suffix}' is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 50 MB limit.",
        )

    supabase = get_supabase()
    document_id = str(uuid4())
    user_id = current_user["id"]

    # Upload raw file to Supabase Storage
    storage_path = f"{user_id}/{document_id}/{file.filename}"
    supabase.storage.from_("documents").upload(storage_path, content)

    # Insert document record
    supabase.table("documents").insert({
        "id": document_id,
        "user_id": user_id,
        "filename": file.filename,
        "file_type": suffix,
        "file_size": len(content),
        "storage_path": storage_path,
        "status": "pending",
    }).execute()

    # Run ingestion pipeline in background
    background_tasks.add_task(ingest_document, document_id, user_id, file.filename, content)

    _write_analytics(user_id, "upload", document_id=document_id,
                     metadata={"filename": file.filename, "file_size": len(content)})

    return MessageResponse(message=f"'{file.filename}' uploaded and queued for processing.")


@router.get("/", response_model=DocumentListResponse)
async def list_documents(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    docs = [_parse_doc(row) for row in response.data]
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return _parse_doc(response.data)


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    from app.services.vector_store import delete_by_document

    supabase = get_supabase()

    # Verify ownership
    response = (
        supabase.table("documents")
        .select("id, storage_path")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    storage_path = response.data.get("storage_path")

    # Delete from Qdrant
    await delete_by_document(document_id)

    # Delete from Supabase Storage
    if storage_path:
        supabase.storage.from_("documents").remove([storage_path])

    # Delete DB record (cascades to chunks)
    supabase.table("documents").delete().eq("id", document_id).execute()

    _write_analytics(current_user["id"], "delete", document_id=document_id)

    return MessageResponse(message=f"Document {document_id} deleted.")
