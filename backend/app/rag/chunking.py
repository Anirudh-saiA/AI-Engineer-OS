from typing import List

class RecursiveCharacterTextSplitter:
    """
    Standard pre-trained text splitter that divides text recursively
    by matching dynamic separators: double newlines, single newlines,
    spaces, and characters, targeting chunk_size and chunk_overlap bounds.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, separators: List[str] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", " ", ""]

    def split_text(self, text: str) -> List[str]:
        if not text:
            return []
        
        # Recursive splitting logic
        return self._split(text, self.separators)

    def _split(self, text: str, separators: List[str]) -> List[str]:
        # If text is already under chunk_size, return it immediately
        if len(text) <= self.chunk_size:
            return [text]

        if not separators:
            # Fallback to character split if we have no separators left
            chunks = []
            start = 0
            while start < len(text):
                end = min(start + self.chunk_size, len(text))
                chunks.append(text[start:end])
                if end == len(text):
                    break
                start += (self.chunk_size - self.chunk_overlap)
            return chunks

        separator = separators[0]
        splits = text.split(separator)
        
        chunks = []
        current_chunk = []
        current_len = 0
        
        for part in splits:
            part_len = len(part)
            
            # If a single part is larger than chunk_size, split it recursively using remaining separators
            if part_len > self.chunk_size:
                # Flush current chunk first
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                    current_chunk = []
                    current_len = 0
                
                sub_chunks = self._split(part, separators[1:])
                chunks.extend(sub_chunks)
                continue
            
            # If adding this part exceeds chunk_size, flush current chunk and step back for overlap
            if current_len + part_len + (len(separator) if current_chunk else 0) > self.chunk_size:
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                
                # Formulate the overlapping chunk starting point
                # We retain as many elements from the end of the current chunk as fit in the overlap window
                overlap_chunk = []
                overlap_len = 0
                for item in reversed(current_chunk):
                    item_len = len(item)
                    if overlap_len + item_len + (len(separator) if overlap_chunk else 0) <= self.chunk_overlap:
                        overlap_chunk.insert(0, item)
                        overlap_len += item_len + (len(separator) if len(overlap_chunk) > 1 else 0)
                    else:
                        break
                current_chunk = overlap_chunk
                current_len = overlap_len
            
            current_chunk.append(part)
            current_len += part_len + (len(separator) if len(current_chunk) > 1 else 0)
            
        if current_chunk:
            chunks.append(separator.join(current_chunk))
            
        return chunks

def chunk_document_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """
    Convenience method to split text into chunks using configured Recursive splitter.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_text(text)
