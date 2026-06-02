import io
import logging
import fitz  # PyMuPDF

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

def extract_pdf_text(pdf_file) -> str:
    """
    Opens a PDF file (which can be a file path, bytes, or file-like object),
    reads all pages, extracts and combines text, and returns the cleaned text.
    Uses PyMuPDF (fitz) for speed and accuracy.
    """
    doc = None
    try:
        if isinstance(pdf_file, str):
            doc = fitz.open(pdf_file)
        elif isinstance(pdf_file, bytes):
            doc = fitz.open(stream=pdf_file, filetype="pdf")
        elif hasattr(pdf_file, "read"):
            content = pdf_file.read()
            if isinstance(content, str):
                content = content.encode("utf-8")
            doc = fitz.open(stream=content, filetype="pdf")
        else:
            raise ValueError("Unsupported pdf_file type. Must be file path, bytes, or file-like object.")

        text_parts = []
        for page in doc:
            page_text = page.get_text()
            if page_text:
                text_parts.append(page_text)
        
        raw_text = "\n".join(text_parts)
        return clean_extracted_text(raw_text)
    except Exception as e:
        logger.error(f"Error extracting text from PDF using PyMuPDF: {e}")
        raise ValueError(f"Failed to parse PDF document: {str(e)}")
    finally:
        if doc is not None:
            doc.close()

def extract_pdf_metadata_and_text(pdf_file, filename: str = None) -> dict:
    """
    Opens a PDF file (file path, bytes, or file-like object), extracts raw text,
    page count, and returns a dictionary with document_name, page_count,
    raw_text, and cleaned_text.
    """
    doc = None
    try:
        if isinstance(pdf_file, str):
            doc = fitz.open(pdf_file)
            if not filename:
                import os
                filename = os.path.basename(pdf_file)
        elif isinstance(pdf_file, bytes):
            doc = fitz.open(stream=pdf_file, filetype="pdf")
        elif hasattr(pdf_file, "read"):
            content = pdf_file.read()
            if isinstance(content, str):
                content = content.encode("utf-8")
            doc = fitz.open(stream=content, filetype="pdf")
        else:
            raise ValueError("Unsupported pdf_file type. Must be file path, bytes, or file-like object.")

        page_count = doc.page_count
        text_parts = []
        for page in doc:
            page_text = page.get_text()
            if page_text:
                text_parts.append(page_text)
        
        raw_text = "\n".join(text_parts)
        cleaned_text = clean_extracted_text(raw_text)

        # Standardize document name from filename
        doc_name = "Unknown"
        if filename:
            import os
            # strip extension
            base_name = os.path.splitext(filename)[0]
            # Replace underscores and hyphens with spaces for a premium name presentation
            doc_name = base_name.replace("_", " ").replace("-", " ")

        return {
            "document_name": doc_name,
            "page_count": page_count,
            "raw_text": raw_text,
            "cleaned_text": cleaned_text
        }
    except Exception as e:
        logger.error(f"Error generating PDF metadata and text: {e}")
        raise ValueError(f"Failed to parse PDF document: {str(e)}")
    finally:
        if doc is not None:
            doc.close()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Legacy wrapper to maintain backwards compatibility. Delegates to extract_pdf_text.
    """
    return extract_pdf_text(file_bytes)

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
