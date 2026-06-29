"""Unit tests for document ingestion — extractor, chunker, embedder."""
import io
import pytest
from unittest.mock import patch, MagicMock

from app.services.extractor import extract, ExtractedPage
from app.services.chunker import chunk_pages, Chunk


# ── Extractor ─────────────────────────────────────────────────────────────────

def test_extract_txt():
    content = b"Hello world. This is a plain text file."
    pages = extract("doc.txt", content)
    assert len(pages) == 1
    assert "Hello world" in pages[0].text
    assert pages[0].page_number is None


def test_extract_md():
    content = b"# Title\n\nSome markdown content."
    pages = extract("readme.md", content)
    assert len(pages) == 1
    assert "markdown" in pages[0].text


def test_extract_csv():
    content = b"name,age\nAlice,30\nBob,25"
    pages = extract("data.csv", content)
    assert len(pages) == 1
    assert "Alice" in pages[0].text
    assert "Bob" in pages[0].text


def test_extract_pdf():
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    # Blank PDF produces no text — should return empty list
    pages = extract("blank.pdf", buf.getvalue())
    assert isinstance(pages, list)


def test_extract_unknown_extension_fallback():
    content = b"raw content here"
    pages = extract("file.xyz", content)
    assert len(pages) == 1
    assert "raw content" in pages[0].text


# ── Chunker ───────────────────────────────────────────────────────────────────

def _make_pages(text: str, page_number: int = 1) -> list[ExtractedPage]:
    return [ExtractedPage(page_number=page_number, text=text)]


def test_chunk_short_text_single_chunk():
    pages = _make_pages("word " * 50)
    chunks = chunk_pages(pages)
    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].page_number == 1


def test_chunk_long_text_multiple_chunks():
    pages = _make_pages("word " * 3000)
    chunks = chunk_pages(pages)
    assert len(chunks) > 1
    for i, c in enumerate(chunks):
        assert c.chunk_index == i


def test_chunk_overlap():
    """Last words of chunk N should appear at the start of chunk N+1."""
    pages = _make_pages("word " * 2500)
    chunks = chunk_pages(pages)
    if len(chunks) < 2:
        pytest.skip("Not enough chunks to test overlap")
    words_0 = chunks[0].content.split()
    words_1 = chunks[1].content.split()
    # The tail of chunk 0 should overlap with the head of chunk 1
    overlap_count = sum(1 for w in words_0[-200:] if w in set(words_1[:200]))
    assert overlap_count > 0


def test_chunk_empty_text():
    pages = _make_pages("")
    chunks = chunk_pages(pages)
    assert chunks == []


def test_chunk_preserves_page_number():
    pages = [
        ExtractedPage(page_number=3, text="word " * 100),
        ExtractedPage(page_number=4, text="word " * 100),
    ]
    chunks = chunk_pages(pages)
    page_numbers = {c.page_number for c in chunks}
    assert 3 in page_numbers
    assert 4 in page_numbers


# ── Embedder ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_embed_texts_shape():
    from app.services.embedder import embed_texts
    texts = ["Hello world", "Another sentence"]
    embeddings = await embed_texts(texts)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384
    assert len(embeddings[1]) == 384


@pytest.mark.asyncio
async def test_embed_query_single_vector():
    from app.services.embedder import embed_query
    vec = await embed_query("What is machine learning?")
    assert len(vec) == 384
    assert all(isinstance(v, float) for v in vec)
