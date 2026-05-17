from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
