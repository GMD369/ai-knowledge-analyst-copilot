from dataclasses import dataclass
from app.services.extractor import ExtractedPage
from app.core.config import settings


@dataclass
class Chunk:
    content: str
    chunk_index: int
    page_number: int | None


def chunk_pages(pages: list[ExtractedPage]) -> list[Chunk]:
    chunks: list[Chunk] = []
    index = 0

    for page in pages:
        page_chunks = _split_text(page.text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        for text in page_chunks:
            chunks.append(Chunk(content=text, chunk_index=index, page_number=page.page_number))
            index += 1

    return chunks


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    if not text.strip():
        return []

    words = text.split()
    result = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        result.append(chunk)
        if end >= len(words):
            break
        start = end - overlap

    return result
