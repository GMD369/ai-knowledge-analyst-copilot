from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "AI Knowledge Analyst Copilot"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str

    # OpenAI
    OPENAI_API_KEY: str

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "knowledge_chunks"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Embeddings
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536

    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Retrieval
    TOP_K_RESULTS: int = 5


settings = Settings()
