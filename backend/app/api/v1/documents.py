from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from app.core.security import get_current_user
from app.models.document import DocumentListResponse, DocumentResponse
from app.models.common import MessageResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "text/markdown",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file.content_type}' is not supported.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 50 MB limit.",
        )

    # TODO: enqueue document processing task
    return MessageResponse(message=f"File '{file.filename}' received and queued for processing.")


@router.get("/", response_model=DocumentListResponse)
async def list_documents(current_user: dict = Depends(get_current_user)):
    # TODO: query Supabase for user's documents
    return DocumentListResponse(documents=[], total=0)


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    # TODO: delete from Supabase + Qdrant
    return MessageResponse(message=f"Document {document_id} deleted.")
