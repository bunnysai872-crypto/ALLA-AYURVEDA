from datetime import datetime

from extensions import db


class Study(db.Model):
    __tablename__ = "studies"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    study_id = db.Column(db.String(50), unique=True, nullable=False)
    researcher_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    title = db.Column(db.String(255), nullable=False)
    short_title = db.Column(db.String(150), nullable=True)
    study_type = db.Column(db.String(100), nullable=False)
    study_design = db.Column(db.String(100), nullable=False)
    condition = db.Column(db.String(255), nullable=True)
    ayurveda_intervention = db.Column(db.Text, nullable=True)
    research_objective = db.Column(db.Text, nullable=False)
    primary_objective = db.Column(db.Text, nullable=True)
    secondary_objectives = db.Column(db.Text, nullable=True)
    study_duration = db.Column(db.String(100), nullable=True)
    target_population = db.Column(db.String(255), nullable=True)
    estimated_sample_size = db.Column(db.Integer, nullable=True)
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
    researcher = db.relationship(
        "User",
        backref=db.backref("studies", lazy=True)
    )
    documents = db.relationship(
        "Document",
        backref="study",
        lazy=True,
        cascade="all, delete-orphan"
    )
    protocol = db.relationship(
        "Protocol",
        backref=db.backref("study", uselist=False),
        uselist=False,
        cascade="all, delete-orphan",
    )

    # Backward compatibility aliases for permissions and documents logic
    @property
    def principal_investigator_id(self):
        return self.researcher_id

    @principal_investigator_id.setter
    def principal_investigator_id(self, val):
        self.researcher_id = val

    @property
    def principal_investigator(self):
        return self.researcher

    @property
    def protocol_number(self):
        return self.study_id

    @protocol_number.setter
    def protocol_number(self, val):
        self.study_id = val

    @property
    def description(self):
        return self.research_objective

    @description.setter
    def description(self, val):
        self.research_objective = val

    def to_dict(self) -> dict:
        """Serialize Study model to dictionary."""
        return {
            "id": self.id,
            "study_id": self.study_id,
            "protocol_number": self.study_id,
            "researcher_id": self.researcher_id,
            "principal_investigator_id": self.researcher_id,
            "title": self.title,
            "short_title": self.short_title,
            "study_type": self.study_type,
            "study_design": self.study_design,
            "condition": self.condition,
            "ayurveda_intervention": self.ayurveda_intervention,
            "research_objective": self.research_objective,
            "description": self.research_objective,
            "primary_objective": self.primary_objective,
            "secondary_objectives": self.secondary_objectives,
            "study_duration": self.study_duration,
            "target_population": self.target_population,
            "estimated_sample_size": self.estimated_sample_size,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Study {self.id}: {self.title} ({self.study_id})>"

