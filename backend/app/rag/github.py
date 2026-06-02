import re
import zipfile
import io
import urllib.request
import logging
from typing import List, Dict

logger = logging.getLogger("uvicorn.error")

def parse_github_url(url: str) -> tuple:
    """
    Parses a GitHub URL into organization and repository names.
    Handles standard formats:
    - https://github.com/org/repo
    - https://github.com/org/repo.git
    - https://github.com/org/repo/tree/branch
    """
    clean_url = url.strip()
    match = re.search(r"github\.com/([\w.-]+)/([\w.-]+)", clean_url)
    if not match:
        raise ValueError("Invalid GitHub repository URL. Expected format: https://github.com/org/repo")
    
    org = match.group(1)
    repo = match.group(2)
    
    # Strip git suffix if present
    if repo.endswith(".git"):
        repo = repo[:-4]
        
    # Handle tree/branch parts (e.g. /tree/main) by picking only the repository name
    repo = repo.split("/")[0]
    
    return org, repo

def ingest_github_documentation(url: str, token: str = None) -> List[Dict[str, str]]:
    """
    Downloads the repository zip archive, decompresses in-memory,
    and extracts README and other relevant markdown documentation files.
    """
    org, repo = parse_github_url(url)
    
    import os
    github_token = token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_PAT")
    
    # We prioritize the authenticated API route if a token is set, otherwise we use direct public routes
    download_urls = []
    if github_token:
        download_urls.append(f"https://api.github.com/repos/{org}/{repo}/zipball")
        
    download_urls.extend([
        f"https://github.com/{org}/{repo}/archive/refs/heads/main.zip",
        f"https://github.com/{org}/{repo}/archive/refs/heads/master.zip",
    ])
    
    if not github_token:
        download_urls.append(f"https://api.github.com/repos/{org}/{repo}/zipball")
    
    zip_data = None
    for dl_url in download_urls:
        try:
            logger.info(f"[GITHUB] Requesting zipball from: {dl_url}")
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            
            # Inject authorization header if using API route and token is configured
            if "api.github.com" in dl_url and github_token:
                headers["Authorization"] = f"token {github_token}"
                logger.info("[GITHUB] Injected Authorization PAT header into request.")
                
            req = urllib.request.Request(dl_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                zip_data = response.read()
                logger.info(f"[GITHUB] Zipball successfully retrieved from: {dl_url}")
                break
        except Exception as e:
            logger.warning(f"[GITHUB] Download from '{dl_url}' failed: {e}")
            continue
                
    if not zip_data:
        raise ValueError(
            f"Could not connect to GitHub or download ZIP archive for repository '{org}/{repo}'. "
            "If this is a private repository, please configure your GITHUB_TOKEN / GITHUB_PAT environment variables."
        )

    # 2. Decompress ZIP archive in memory
    try:
        z = zipfile.ZipFile(io.BytesIO(zip_data))
    except Exception as zip_err:
        raise ValueError(f"Failed to decompress repository ZIP file: {zip_err}")

    doc_files = []
    
    # Filter for documentation paths and README
    for file_info in z.infolist():
        filename = file_info.filename
        
        # Skip directory entries
        if file_info.is_dir():
            continue
            
        # Get path inside the repository by stripping root folder name
        parts = filename.split("/", 1)
        if len(parts) < 2:
            continue
        repo_path = parts[1]
        
        # Focus purely on Markdown documentation files
        if repo_path.lower().endswith(".md"):
            # Skip ignored directories to avoid noise
            ignored_patterns = ["node_modules", "vendor", "test", "tests", ".github", "changelog", "license", "contrib"]
            if any(ignored in repo_path.lower() for ignored in ignored_patterns):
                continue
                
            try:
                content = z.read(file_info).decode("utf-8", errors="ignore")
                if content.strip():
                    doc_files.append({
                        "path": repo_path,
                        "content": content
                    })
            except Exception as read_err:
                logger.warning(f"[GITHUB] Skipped reading file '{repo_path}': {read_err}")
                continue

    # 3. Sort files to prioritize README and documentation directories
    def get_priority_weight(file_item):
        path = file_item["path"].lower()
        if "readme.md" in path:
            return 0
        if path.startswith("docs/") or path.startswith("doc/"):
            return 1
        return 2

    doc_files.sort(key=get_priority_weight)
    
    # Cap files count to top 40 to prevent indexing latency and database bloat
    logger.info(f"[GITHUB] Selected {len(doc_files[:40])} documents from '{org}/{repo}' to index.")
    return doc_files[:40]
