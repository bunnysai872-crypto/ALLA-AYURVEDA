from datetime import datetime
from extensions import db


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # De-identified study-specific identifier (e.g., "SUBJ-001")
    participant_id = db.Column(db.String(50), nullable=False, index=True)
    screening_number = db.Column(db.String(50), nullable=True)
    # Non-sensitive initials (e.g. "R.K.")
    initials = db.Column(db.String(10), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)  # Male, Female, Other
    # Ayurveda clinical constitution
    prakriti = db.Column(db.String(50), nullable=True)  # Vata, Pitta, Kapha, Vata-Pitta, etc.
    inclusion_criteria_met = db.Column(db.Boolean, default=True, nullable=False)
    exclusion_criteria_met = db.Column(db.Boolean, default=False, nullable=False)
    screening_date = db.Column(db.String(50), nullable=True)

    # Participant lifecycle status: Screened, Eligible, Enrolled, Active, Withdrawn, Completed
    status = db.Column(db.String(50), default="Screened", nullable=False)
    withdrawal_reason = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    registered_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    study = db.relationship("Study", backref=db.backref("participants", lazy=True, cascade="all, delete-orphan"))
    registered_by = db.relationship("User", foreign_keys=[registered_by_id])
    consent = db.relationship(
        "InformedConsent",
        backref=db.backref("participant", uselist=False),
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        """Serialize participant record without exposing any sensitive PII."""
        return {
            "id": self.id,
            "study_id": self.study_id,
            "participant_id": self.participant_id,
            "screening_number": self.screening_number,
            "initials": self.initials,
            "age": self.age,
            "gender": self.gender,
            "prakriti": self.prakriti,
            "inclusion_criteria_met": self.inclusion_criteria_met,
            "exclusion_criteria_met": self.exclusion_criteria_met,
            "screening_date": self.screening_date,
            "status": self.status,
            "withdrawal_reason": self.withdrawal_reason,
            "notes": self.notes,
            "registered_by": {
                "id": self.registered_by.id if self.registered_by else None,
                "full_name": self.registered_by.full_name if self.registered_by else "Unknown",
            } if self.registered_by else None,
            "consent": self.consent.to_dict() if self.consent else {
                "status": "Not Started",
                "is_consented": False,
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Participant {self.participant_id} (Study {self.study_id}): {self.status}>"


class InformedConsent(db.Model):
    __tablename__ = "informed_consents"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    participant_id = db.Column(
        db.Integer,
        db.ForeignKey("participants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Consent lifecycle: Not Started, Consent Pending, Consented, Declined, Withdrawn
    status = db.Column(db.String(50), default="Not Started", nullable=False)
    consent_document_id = db.Column(
        db.Integer,
        db.ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    consent_document_version = db.Column(db.String(50), nullable=True)
    consent_document_name = db.Column(db.String(255), nullable=True)
    consent_date = db.Column(db.String(50), nullable=True)

    consented_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )
    witness_name = db.Column(db.String(150), nullable=True)
    language = db.Column(db.String(50), default="English", nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    audit_trail = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    consented_by_user = db.relationship("User", foreign_keys=[consented_by_user_id])
    consent_document = db.relationship("Document", foreign_keys=[consent_document_id])

    def to_dict(self) -> dict:
        """Serialize InformedConsent record safely."""
        return {
            "id": self.id,
            "participant_id": self.participant_id,
            "study_id": self.study_id,
            "status": self.status or "Not Started",
            "is_consented": (self.status or "").lower() == "consented",
            "consent_document": {
                "id": self.consent_document_id,
                "name": self.consent_document_name or (self.consent_document.original_filename if self.consent_document else "Informed Consent Form"),
                "version": self.consent_document_version or (f"v{self.consent_document.current_version}" if self.consent_document else "v1.0"),
            } if self.consent_document_id or self.consent_document_name else None,
            "consent_date": self.consent_date,
            "witness_name": self.witness_name,
            "language": self.language or "English",
            "remarks": self.remarks,
            "consented_by": {
                "id": self.consented_by_user.id if self.consented_by_user else None,
                "full_name": self.consented_by_user.full_name if self.consented_by_user else "Researcher",
            } if self.consented_by_user else None,
            "audit_trail": self.audit_trail or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<InformedConsent Part={self.participant_id} (Study {self.study_id}): {self.status}>"
