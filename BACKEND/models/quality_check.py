from datetime import datetime
from extensions import db


class QualityCheck(db.Model):
    __tablename__ = "quality_checks"

    id = db.Column(db.Integer, primary_key=True)
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id"),
        nullable=False,
        index=True
    )
    document_id = db.Column(
        db.Integer,
        db.ForeignKey("documents.id"),
        nullable=True,
        index=True
    )
    status = db.Column(db.String(50), nullable=False, default="not_checked")
    score = db.Column(db.Integer, nullable=True)
    summary = db.Column(db.Text, nullable=True)
    completeness_data = db.Column(db.JSON, nullable=True)
    consistency_data = db.Column(db.JSON, nullable=True)
    cross_document_data = db.Column(db.JSON, nullable=True)
    risk_flags = db.Column(db.JSON, nullable=True)
    recommendations = db.Column(db.JSON, nullable=True)
    checked_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    checker = db.relationship("User", foreign_keys=[checked_by])
    study = db.relationship("Study", backref=db.backref("quality_checks", lazy=True, cascade="all, delete-orphan"))
    document = db.relationship("Document", backref=db.backref("quality_checks", lazy=True))

    def to_dict(self) -> dict:
        """Serialize QualityCheck record safely."""
        return {
            "id": self.id,
            "study_id": self.study_id,
            "document_id": self.document_id,
            "status": self.status,
            "score": self.score,
            "summary": self.summary,
            "completeness": self.completeness_data or {"status": "not_checked", "issues": []},
            "consistency": self.consistency_data or {"status": "not_checked", "issues": []},
            "cross_document": self.cross_document_data or {"status": "not_checked", "issues": []},
            "risk_flags": self.risk_flags or [],
            "recommendations": self.recommendations or [],
            "checked_by": self.checked_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<QualityCheck {self.id}: Study {self.study_id} [{self.status}] score={self.score}>"
