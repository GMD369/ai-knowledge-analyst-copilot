import io
import csv
from pathlib import Path
from typing import NamedTuple

from pypdf import PdfReader
from docx import Document


class ExtractedPage(NamedTuple):
    page_number: int | None
    text: str


def extract(filename: str, content: bytes) -> list[ExtractedPage]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(content)
    if suffix == ".docx":
        return _extract_docx(content)
    if suffix == ".csv":
        return _extract_csv(content)
    return [ExtractedPage(page_number=None, text=content.decode("utf-8", errors="replace"))]


def _extract_pdf(content: bytes) -> list[ExtractedPage]:
    reader = PdfReader(io.BytesIO(content))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(ExtractedPage(page_number=i, text=text))
    return pages


def _extract_docx(content: bytes) -> list[ExtractedPage]:
    doc = Document(io.BytesIO(content))
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [ExtractedPage(page_number=None, text=text)]


def _extract_csv(content: bytes) -> list[ExtractedPage]:
    text_io = io.StringIO(content.decode("utf-8", errors="replace"))
    reader = csv.reader(text_io)
    rows = [", ".join(row) for row in reader]
    return [ExtractedPage(page_number=None, text="\n".join(rows))]
