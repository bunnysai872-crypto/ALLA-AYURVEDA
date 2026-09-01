import os
import uuid
import mimetypes
from werkzeug.utils import secure_filename
from config import Config


def get_allowed_extensions() -> set:
    """Return configured allowed file extensions."""
    return getattr(Config, "ALLOWED_EXTENSIONS", {"pdf", "doc", "docx", "txt"})


def get_allowed_mimetypes() -> set:
    """Return configured allowed MIME types."""
    return getattr(
        Config,
        "ALLOWED_MIME_TYPES",
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/octet-stream",
        },
    )


def validate_file_upload(file_storage) -> tuple[bool, str | None, dict | None]:
    """
    Validate uploaded file's existence, filename, extension, MIME type, and size.
    
    Returns:
        (is_valid, error_message, metadata_dict)
    """
    if not file_storage or not file_storage.filename or file_storage.filename.strip() == "":
        return False, "No file uploaded or file is empty", None

    original_filename = file_storage.filename.strip()
    if "." not in original_filename:
        return False, "File must have a valid extension", None

    ext = original_filename.rsplit(".", 1)[1].lower()
    allowed_exts = get_allowed_extensions()
    if ext not in allowed_exts:
        return (
            False,
            f"Invalid file type '.{ext}'. Allowed types: {', '.join(sorted(allowed_exts))}",
            None,
        )

    # Check file size by seeking
    file_storage.seek(0, os.SEEK_END)
    file_size = file_storage.tell()
    file_storage.seek(0)

    if file_size == 0:
        return False, "Uploaded file is empty (0 bytes)", None

    max_size = getattr(Config, "MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    if file_size > max_size:
        return (
            False,
            f"File size exceeds maximum allowed limit ({max_size // (1024 * 1024)}MB)",
            None,
        )

    # Determine / verify MIME type
    mime_type = file_storage.mimetype
    if not mime_type or mime_type == "application/octet-stream":
        guessed_type, _ = mimetypes.guess_type(original_filename)
        if guessed_type:
            mime_type = guessed_type

    allowed_mimes = get_allowed_mimetypes()
    if mime_type not in allowed_mimes:
        # Fallback check against known extensions
        guessed_type, _ = mimetypes.guess_type(original_filename)
        if guessed_type not in allowed_mimes:
            return False, f"Unsupported MIME type: {mime_type}", None

    return (
        True,
        None,
        {
            "original_filename": original_filename,
            "extension": ext,
            "file_size": file_size,
            "mime_type": mime_type,
        },
    )


def save_file(
    file_storage,
    study_id: int,
    document_id: int | str,
    version_number: int = 1,
) -> tuple[str, str, int, str]:
    """
    Save uploaded file locally inside structured directory hierarchy:
    uploads/studies/<study_id>/<document_id>/v<version>_<uuid>_<filename>
    
    Returns:
        (relative_storage_path, original_filename, file_size, mime_type)
    """
    upload_root = getattr(
        Config,
        "UPLOAD_FOLDER",
        os.path.join(Config.BASE_DIR, "uploads"),
    )
    study_dir = os.path.join(upload_root, "studies", str(study_id), str(document_id))
    os.makedirs(study_dir, exist_ok=True)

    original_filename = file_storage.filename.strip()
    safe_name = secure_filename(original_filename)
    if not safe_name:
        safe_name = f"document_{uuid.uuid4().hex[:6]}"

    unique_token = uuid.uuid4().hex[:8]
    stored_filename = f"v{version_number}_{unique_token}_{safe_name}"
    absolute_path = os.path.join(study_dir, stored_filename)

    file_storage.seek(0)
    file_storage.save(absolute_path)

    file_size = os.path.getsize(absolute_path)
    mime_type = file_storage.mimetype
    if not mime_type or mime_type == "application/octet-stream":
        guessed_type, _ = mimetypes.guess_type(original_filename)
        if guessed_type:
            mime_type = guessed_type
        else:
            mime_type = "application/octet-stream"

    # Store relative path for portability
    relative_storage_path = os.path.relpath(absolute_path, upload_root)

    return relative_storage_path, original_filename, file_size, mime_type


def get_absolute_file_path(relative_storage_path: str) -> str | None:
    """
    Resolve relative storage path to absolute path safely.
    Prevents path traversal attacks.
    """
    if not relative_storage_path:
        return None

    upload_root = getattr(
        Config,
        "UPLOAD_FOLDER",
        os.path.join(Config.BASE_DIR, "uploads"),
    )
    upload_root = os.path.abspath(upload_root)

    # Normalize target path
    target_path = os.path.abspath(os.path.join(upload_root, relative_storage_path))

    # Security check: must reside inside upload_root
    if not target_path.startswith(upload_root):
        return None

    if not os.path.isfile(target_path):
        return None

    return target_path


def delete_file_safely(relative_storage_path: str) -> bool:
    """Safely remove a physical file from storage."""
    abs_path = get_absolute_file_path(relative_storage_path)
    if abs_path and os.path.isfile(abs_path):
        try:
            os.remove(abs_path)
            return True
        except OSError:
            return False
    return False

