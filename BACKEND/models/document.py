from datetime import datetime

from extensions import db

VALID_DOCUMENT_TYPES = {
    "study_protocol",
    "protocol",
    "patient_information_sheet",
    "informed_consent_form",
    "informed_consent",
    "investigator_brochure",
    "case_report_form",
    "statistical_analysis_plan",
    "other_supporting_documents",
    "other",
    "study_plan",
}

# The canonical 7 document categories specified for ALLA Ayurveda
DOCUMENT_CATEGORIES = [
    {"key": "study_protocol", "label": "Study Protocol", "required": True},
    {"key": "patient_information_sheet", "label": "Patient Information Sheet", "required": True},
    {"key": "informed_consent_form", "label": "Informed Consent Form", "required": True},
    {"key": "investigator_brochure", "label": "Investigator Brochure", "required": True},
    {"key": "case_report_form", "label": "Case Report Form", "required": True},
    {"key": "statistical_analysis_plan", "label": "Statistical Analysis Plan", "required": True},
    {"key": "other_supporting_documents", "label": "Other Supporting Documents", "required": False},
]

VALID_DOCUMENT_STATUSES = {
    "UPLOADED",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
    "REPLACEMENT_REQUIRED",
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
    document_type = db.Column(db.String(100), default="other_supporting_documents", nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="UPLOADED", nullable=False)
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
            "status": (self.status.upper() if self.status else "UPLOADED"),
            "version": self.current_version,
            "uploaded_by": self.uploaded_by,
            "uploaded_by_name": self.uploader.full_name if self.uploader else None,
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
            "uploaded_by_name": self.uploader.full_name if self.uploader else None,
            "change_summary": self.change_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<DocumentVersion {self.id}: Doc {self.document_id} v{self.version_number}>"

