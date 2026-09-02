from datetime import datetime

from extensions import db

VALID_DOCUMENT_TYPES = {
    "protocol",
    "informed_consent",
    "case_report_form",
    "investigator_brochure",
    "study_plan",
    "statistical_analysis_plan",
    "other",
}


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id"),
        nullable=False,
        index=True
    )
    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    original_filename = db.Column(db.String(255), nullable=False)
    storage_path = db.Column(db.String(500), nullable=False)
    document_type = db.Column(db.String(100), default="other", nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="uploaded", nullable=False)
    current_version = db.Column(db.Integer, default=1, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    uploader = db.relationship("User", foreign_keys=[uploaded_by])
    versions = db.relationship(
        "DocumentVersion",
        backref="document",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="DocumentVersion.version_number"
    )

    def to_dict(self, include_versions: bool = False) -> dict:
        """Serialize Document model safely without exposing internal storage paths."""
        data = {
            "id": self.id,
            "study_id": self.study_id,
            "document_name": self.original_filename,
            "original_filename": self.original_filename,
            "document_type": self.document_type,
            "mime_type": self.mime_type,
            "file_size": self.file_size,
            "description": self.description,
            "status": self.status or "uploaded",
            "version": self.current_version,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_versions:
            data["versions"] = [v.to_dict() for v in self.versions]
        return data


    def __repr__(self):
        return f"<Document {self.id}: {self.original_filename} (v{self.current_version})>"


class DocumentVersion(db.Model):
    __tablename__ = "document_versions"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(
        db.Integer,
        db.ForeignKey("documents.id"),
        nullable=False,
        index=True
    )
    version_number = db.Column(db.Integer, nullable=False)
    storage_path = db.Column(db.String(500), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    change_summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    uploader = db.relationship("User", foreign_keys=[uploaded_by])

    def to_dict(self) -> dict:
        """Serialize DocumentVersion model safely."""
        return {
            "id": self.id,
            "document_id": self.document_id,
            "version_number": self.version_number,
            "original_filename": self.original_filename,
            "mime_type": self.mime_type,
            "file_size": self.file_size,
            "uploaded_by": self.uploaded_by,
            "change_summary": self.change_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<DocumentVersion {self.id}: Doc {self.document_id} v{self.version_number}>"

