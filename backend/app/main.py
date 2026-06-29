from collections import defaultdict
from time import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import router

RATE_LIMIT_ENDPOINTS = {"/api/v1/chat/", "/api/v1/documents/upload"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 30, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self._log: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path not in RATE_LIMIT_ENDPOINTS:
            return await call_next(request)
        client = request.client.host if request.client else "unknown"
        now = time()
        self._log[client] = [t for t in self._log[client] if now - t < self.window]
        if len(self._log[client]) >= self.max_requests:
            return Response("Rate limit exceeded. Try again in a minute.", status_code=429)
        self._log[client].append(now)
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(RateLimitMiddleware, max_requests=30, window=60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
