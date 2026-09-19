from datetime import datetime
from extensions import db


class RegulatoryTracking(db.Model):
    __tablename__ = "regulatory_trackings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Regulatory Submission & Approval Tracking
    regulatory_status = db.Column(
        db.String(50),
        default="Not Started",
        nullable=False,
    )  # Not Started, In Progress, Submitted, Under Review, Approved/Registered, Returned / Requires Update
    regulatory_submission_date = db.Column(db.String(50), nullable=True)
    regulatory_reference_number = db.Column(db.String(100), nullable=True)
    regulatory_approval_date = db.Column(db.String(50), nullable=True)
    regulatory_remarks = db.Column(db.Text, nullable=True)

    # CTRI Registration Tracking
    ctri_status = db.Column(
        db.String(50),
        default="Not Started",
        nullable=False,
    )  # Not Started, In Progress, Submitted, Under Review, Approved/Registered, Returned / Requires Update
    ctri_submission_date = db.Column(db.String(50), nullable=True)
    ctri_reg_number = db.Column(db.String(100), nullable=True)
    ctri_registration_date = db.Column(db.String(50), nullable=True)
    ctri_remarks = db.Column(db.Text, nullable=True)

    # Audit & User Metadata
    updated_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
    )
    audit_trail = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    study = db.relationship(
        "Study",
        backref=db.backref("regulatory_tracking", uselist=False, cascade="all, delete-orphan"),
    )
    updated_by = db.relationship("User", foreign_keys=[updated_by_id])

    def to_dict(self) -> dict:
        """Serialize RegulatoryTracking record to dictionary."""
        return {
            "id": self.id,
            "study_id": self.study_id,
            "regulatory": {
                "status": self.regulatory_status or "Not Started",
                "submission_date": self.regulatory_submission_date,
                "reference_number": self.regulatory_reference_number,
                "approval_date": self.regulatory_approval_date,
                "remarks": self.regulatory_remarks,
            },
            "ctri": {
                "status": self.ctri_status or "Not Started",
                "submission_date": self.ctri_submission_date,
                "reg_number": self.ctri_reg_number,
                "registration_date": self.ctri_registration_date,
                "remarks": self.ctri_remarks,
            },
            "audit_trail": self.audit_trail or [],
            "updated_by": {
                "id": self.updated_by.id if self.updated_by else None,
                "full_name": self.updated_by.full_name if self.updated_by else "System",
                "role": self.updated_by.role if self.updated_by else None,
            } if self.updated_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<RegulatoryTracking Study {self.study_id}: Reg={self.regulatory_status}, CTRI={self.ctri_status}>"
