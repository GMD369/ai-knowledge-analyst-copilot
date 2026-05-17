from fastapi import APIRouter
from app.models.common import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        service=settings.APP_NAME,
    )
