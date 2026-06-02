import re
import logging
import json
import urllib.request
import urllib.error
from typing import List, Optional

logger = logging.getLogger("uvicorn.error")


def extract_video_id(url: str) -> str:
    """
    Extracts the YouTube video ID from various URL formats:
      - https://www.youtube.com/watch?v=VIDEO_ID
      - https://youtu.be/VIDEO_ID
      - https://www.youtube.com/embed/VIDEO_ID
      - https://m.youtube.com/watch?v=VIDEO_ID
      - https://youtube.com/shorts/VIDEO_ID
    Raises ValueError if the URL format is unrecognized.
    """
    if not url or not isinstance(url, str):
        raise ValueError("YouTube URL is required.")

    url = url.strip()

    # Pattern 1: Standard watch URLs (youtube.com/watch?v=...)
    match = re.search(r'(?:youtube\.com/watch\?.*v=)([\w-]{11})', url)
    if match:
        return match.group(1)

    # Pattern 2: Short URLs (youtu.be/...)
    match = re.search(r'(?:youtu\.be/)([\w-]{11})', url)
    if match:
        return match.group(1)

    # Pattern 3: Embed URLs (youtube.com/embed/...)
    match = re.search(r'(?:youtube\.com/embed/)([\w-]{11})', url)
    if match:
        return match.group(1)

    # Pattern 4: Shorts URLs (youtube.com/shorts/...)
    match = re.search(r'(?:youtube\.com/shorts/)([\w-]{11})', url)
    if match:
        return match.group(1)

    # Pattern 5: Raw 11-character video ID string
    if re.match(r'^[\w-]{11}$', url):
        return url

    raise ValueError(
        f"Could not extract video ID from URL: '{url}'. "
        "Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/..."
    )


def fetch_transcript(video_id: str, languages: Optional[List[str]] = None) -> list:
    """
    Fetches the transcript (captions) for a YouTube video using youtube-transcript-api.
    Returns a list of segment objects with .text, .start, .duration attributes.

    Tries the requested languages first, then falls back to any available transcript.
    Compatible with youtube-transcript-api v1.x (instance-based API).
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        raise ImportError(
            "youtube-transcript-api is not installed. "
            "Run: pip install youtube-transcript-api"
        )

    api = YouTubeTranscriptApi()
    preferred_languages = languages or ["en"]

    try:
        # v1.x API: instance method .fetch() returns a FetchedTranscript (iterable of snippets)
        transcript_result = api.fetch(video_id, languages=preferred_languages)
        return list(transcript_result)
    except Exception as first_error:
        logger.warning(f"Primary transcript fetch failed for {video_id}: {first_error}")

        # Fallback: try fetching any available transcript
        try:
            transcript_list = api.list(video_id)

            # Try manually created transcripts first
            for transcript in transcript_list:
                if not transcript.is_generated:
                    return list(transcript.fetch())

            # Then try auto-generated transcripts
            for transcript in transcript_list:
                if transcript.is_generated:
                    return list(transcript.fetch())

        except Exception as fallback_error:
            logger.error(f"All transcript fetch attempts failed for {video_id}: {fallback_error}")
            raise ValueError(
                f"Could not retrieve transcript for video '{video_id}'. "
                f"The video may not have captions enabled, or it may be private/restricted. "
                f"Error: {str(first_error)}"
            )

    raise ValueError(f"No transcripts available for video '{video_id}'.")


def fetch_video_metadata(video_id: str) -> dict:
    """
    Fetches video metadata (title, channel name) using YouTube's public oEmbed endpoint.
    No API key required. Falls back to sensible defaults if the request fails.
    """
    metadata = {
        "title": f"YouTube Video ({video_id})",
        "channel": "Unknown Channel",
        "video_url": f"https://www.youtube.com/watch?v={video_id}"
    }

    try:
        oembed_url = (
            f"https://www.youtube.com/oembed"
            f"?url=https://www.youtube.com/watch?v={video_id}"
            f"&format=json"
        )
        req = urllib.request.Request(
            oembed_url,
            method="GET",
            headers={"User-Agent": "AIOS/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            metadata["title"] = data.get("title", metadata["title"])
            metadata["channel"] = data.get("author_name", metadata["channel"])
    except Exception as e:
        logger.warning(f"oEmbed metadata fetch failed for {video_id}, using defaults: {e}")

    return metadata


def clean_transcript(segments: list) -> str:
    """
    Joins transcript segments into clean paragraph text.
    - Removes common noise tags like [Music], [Applause], [Laughter], etc.
    - Normalizes whitespace and removes excessive blank lines.
    - Deduplicates consecutive identical lines (common in auto-generated captions).
    """
    if not segments:
        return ""

    # Extract text from each segment (handles both v1.x snippet objects and legacy dicts)
    raw_lines = []
    for segment in segments:
        if isinstance(segment, str):
            text = segment
        elif hasattr(segment, 'text'):
            # v1.x FetchedTranscriptSnippet objects
            text = segment.text
        elif isinstance(segment, dict):
            text = segment.get("text", "")
        else:
            text = str(segment)
        raw_lines.append(text)

    # Join all segment texts
    raw_text = " ".join(raw_lines)

    # Remove common noise tags
    noise_patterns = [
        r'\[Music\]', r'\[Applause\]', r'\[Laughter\]',
        r'\[music\]', r'\[applause\]', r'\[laughter\]',
        r'\[MUSIC\]', r'\[APPLAUSE\]', r'\[LAUGHTER\]',
        r'\[Music Playing\]', r'\[Background Music\]',
        r'\[Inaudible\]', r'\[inaudible\]',
        r'♪', r'♫', r'♬',
    ]
    for pattern in noise_patterns:
        raw_text = re.sub(pattern, '', raw_text)

    # Normalize whitespace
    raw_text = re.sub(r'\s+', ' ', raw_text).strip()

    # Split into sentences for better readability and deduplication
    sentences = re.split(r'(?<=[.!?])\s+', raw_text)

    # Deduplicate consecutive identical sentences
    cleaned_sentences = []
    prev_sentence = None
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence and sentence != prev_sentence:
            cleaned_sentences.append(sentence)
            prev_sentence = sentence

    # Rejoin into paragraph blocks (group ~5 sentences per paragraph for readability)
    paragraphs = []
    for i in range(0, len(cleaned_sentences), 5):
        paragraph = " ".join(cleaned_sentences[i:i + 5])
        if paragraph:
            paragraphs.append(paragraph)

    return "\n\n".join(paragraphs)


def ingest_youtube_video(url: str) -> dict:
    """
    Complete orchestrator: extracts video ID, fetches transcript and metadata,
    cleans the transcript text, and returns all results in a structured dictionary.

    Returns:
        {
            "title": "Video Title",
            "channel": "Channel Name",
            "video_url": "https://youtube.com/watch?v=...",
            "video_id": "abc123xyz",
            "transcript_text": "Cleaned full transcript...",
            "word_count": 5200,
            "segment_count": 342
        }
    """
    # 1. Extract video ID from URL
    video_id = extract_video_id(url)
    logger.info(f"Extracted YouTube video ID: {video_id}")

    # 2. Fetch video metadata (title, channel)
    metadata = fetch_video_metadata(video_id)
    logger.info(f"Video metadata: title='{metadata['title']}', channel='{metadata['channel']}'")

    # 3. Fetch transcript segments
    segments = fetch_transcript(video_id)
    segment_count = len(segments)
    logger.info(f"Fetched {segment_count} transcript segments for video {video_id}")

    # 4. Clean and format transcript text
    transcript_text = clean_transcript(segments)
    word_count = len(transcript_text.split())
    logger.info(f"Cleaned transcript: {word_count} words")

    if not transcript_text.strip():
        raise ValueError(
            f"Transcript for video '{video_id}' was empty after cleaning. "
            "The video may only contain music or non-speech audio."
        )

    return {
        "title": metadata["title"],
        "channel": metadata["channel"],
        "video_url": metadata["video_url"],
        "video_id": video_id,
        "transcript_text": transcript_text,
        "word_count": word_count,
        "segment_count": segment_count
    }
