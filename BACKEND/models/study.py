from datetime import datetime

from extensions import db


class Study(db.Model):
    __tablename__ = "studies"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    protocol_number = db.Column(db.String(100), unique=True, nullable=True)
    description = db.Column(db.Text, nullable=True)
    principal_investigator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    status = db.Column(db.String(50), default="draft", nullable=False)
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
    principal_investigator = db.relationship(
        "User",
        backref=db.backref("studies", lazy=True)
    )
    documents = db.relationship(
        "Document",
        backref="study",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        """Serialize Study model to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "protocol_number": self.protocol_number,
            "description": self.description,
            "principal_investigator_id": self.principal_investigator_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Study {self.id}: {self.title}>"

