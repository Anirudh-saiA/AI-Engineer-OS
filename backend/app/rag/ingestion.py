import io
import pypdf
import logging

logger = logging.getLogger("uvicorn.error")

def extract_text_from_txt_or_md(file_bytes: bytes) -> str:
    """
    Decodes raw bytes into a clean text string.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return file_bytes.decode("latin-1")
        except Exception as e:
            logger.error(f"Error decoding text file: {e}")
            raise ValueError("Unable to decode text file. Ensure it is encoded in UTF-8 or Latin-1.")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text content from a PDF file using the pypdf library.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text_parts = []
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def clean_extracted_text(text: str) -> str:
    """
    Cleans raw text content by stripping extra whitespaces and consolidating newlines.
    """
    if not text:
        return ""
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        cleaned_line = " ".join(line.split())
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
    return "\n".join(cleaned_lines)
