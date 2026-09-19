import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    _raw_db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost/alla_ayurveda")
    if _raw_db_url and _raw_db_url.startswith("mysql://"):
        _raw_db_url = _raw_db_url.replace("mysql://", "mysql+pymysql://", 1)

    SQLALCHEMY_DATABASE_URI = _raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-to-a-long-random-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24))
    )

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # Document Upload & Storage Settings
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = int(
        os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )  # 16 MB limit
    ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt"}
    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/octet-stream",
    }