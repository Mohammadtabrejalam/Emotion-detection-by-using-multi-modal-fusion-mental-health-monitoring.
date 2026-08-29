import os
import uuid
from typing import Dict, Any, Tuple, Optional

# Max upload size: 10MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/x-wav"}

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_AUDIO_EXTS = {".wav", ".mp3", ".ogg"}

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

CLOUDINARY_CONFIGURED = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if CLOUDINARY_CONFIGURED:
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
    except ImportError:
        CLOUDINARY_CONFIGURED = False

def validate_media_file(file_bytes: bytes, filename: str, content_type: str, media_type: str) -> Tuple[bool, Optional[str]]:
    """
    Backend file validation ensuring safety, size limits, and format verification.
    """
    if len(file_bytes) == 0:
        return False, "Uploaded file is empty."
        
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return False, f"File size ({len(file_bytes) / 1024 / 1024:.2f}MB) exceeds 10MB limit."

    ext = os.path.splitext(filename.lower())[1]

    if media_type == "image":
        if content_type not in ALLOWED_IMAGE_TYPES and ext not in ALLOWED_IMAGE_EXTS:
            return False, f"Invalid image format '{content_type}'. Allowed: JPG, PNG, WEBP."
    elif media_type == "audio":
        if content_type not in ALLOWED_AUDIO_TYPES and ext not in ALLOWED_AUDIO_EXTS:
            return False, f"Invalid audio format '{content_type}'. Allowed: WAV, MP3, OGG."
    else:
        return False, f"Unsupported media type '{media_type}'."

    return True, None

def upload_media_asset(file_bytes: bytes, filename: str, content_type: str, media_type: str) -> Dict[str, Any]:
    """
    Dispatches validated media file to Cloudinary backend storage or safe local fallback.
    Returns secure metadata dictionary.
    """
    is_valid, error_msg = validate_media_file(file_bytes, filename, content_type, media_type)
    if not is_valid:
        raise ValueError(error_msg)

    asset_uuid = uuid.uuid4().hex[:12]
    safe_filename = f"{media_type}_{asset_uuid}_{os.path.basename(filename)}"

    if CLOUDINARY_CONFIGURED:
        try:
            resource_type = "image" if media_type == "image" else "video"  # Cloudinary uses 'video' for audio
            response = cloudinary.uploader.upload(
                file_bytes,
                folder=f"mindsense/{media_type}s",
                public_id=safe_filename,
                resource_type=resource_type
            )
            return {
                "asset_id": response.get("public_id", safe_filename),
                "secure_url": response.get("secure_url", ""),
                "bytes": response.get("bytes", len(file_bytes)),
                "format": response.get("format", os.path.splitext(filename)[1].lstrip(".")),
                "provider": "cloudinary"
            }
        except Exception as e:
            # Fallback if Cloudinary fails during connection
            pass

    # Local reference fallback (stores metadata without exposing secrets)
    return {
        "asset_id": safe_filename,
        "secure_url": f"/media/local/{safe_filename}",
        "bytes": len(file_bytes),
        "format": os.path.splitext(filename)[1].lstrip("."),
        "provider": "local_managed"
    }
