import os, re, tempfile, zipfile
from pathlib import Path
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp

app = FastAPI(title="InstaSave API", version="1.0.0")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])

class DownloadRequest(BaseModel):
    url: HttpUrl

def validate_instagram_url(value: str):
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.hostname not in {
        "instagram.com", "www.instagram.com", "m.instagram.com"
    }:
        raise HTTPException(status_code=400, detail="Only HTTPS Instagram post or Reel URLs are accepted.")
    if not re.match(r"^/(p|reel|tv)/[A-Za-z0-9_-]+/?$", parsed.path):
        raise HTTPException(status_code=400, detail="Use a public Instagram post, Reel or video URL.")
    return value

@app.get("/")
def health():
    return {"service": "InstaSave API", "status": "ok"}

@app.post("/api/download")
def download_media(payload: DownloadRequest):
    url = validate_instagram_url(str(payload.url))
    temp_dir = tempfile.mkdtemp(prefix="instasave_")
    output = os.path.join(temp_dir, "%(title).60B_%(id)s.%(ext)s")
    opts = {
        "outtmpl": output,
        "format": "best",
        "noplaylist": False,
        "ignoreerrors": False,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
        "max_filesize": 80 * 1024 * 1024,
        "socket_timeout": 20,
        "retries": 1,
        "extractor_args": {"instagram": {"include_ads": ["false"]}},
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
        files = [p for p in Path(temp_dir).iterdir() if p.is_file() and p.suffix.lower() not in {".part", ".json"}]
        if not files:
            raise RuntimeError("No downloadable public media was found.")
        archive = os.path.join(temp_dir, "instasave-download.zip")
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
            for path in files:
                zf.write(path, arcname=path.name)
        return FileResponse(archive, media_type="application/zip", filename="instasave-media.zip",
                            background=None)
    except Exception as exc:
        # Avoid exposing extractor internals or server paths to visitors.
        detail = str(exc)
        if "login" in detail.lower() or "private" in detail.lower() or "cookies" in detail.lower():
            message = "Instagram requires access this server does not have. Private or login-protected content is not supported."
        else:
            message = "Media could not be fetched. The post may be unavailable, restricted, or unsupported by the current extractor."
        raise HTTPException(status_code=422, detail=message)
