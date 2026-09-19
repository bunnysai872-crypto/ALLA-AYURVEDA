from datetime import datetime

from extensions import db


class Protocol(db.Model):
    __tablename__ = "protocols"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    study_id = db.Column(
        db.Integer,
        db.ForeignKey("studies.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    protocol_title = db.Column(db.String(255), nullable=True)
    protocol_version = db.Column(db.String(50), nullable=False, default="1.0")
    protocol_date = db.Column(db.String(50), nullable=True)
    principal_investigator = db.Column(db.String(150), nullable=True)
    sponsor = db.Column(db.String(150), nullable=True)
    background = db.Column(db.Text, nullable=True)
    rationale = db.Column(db.Text, nullable=True)
    research_question = db.Column(db.Text, nullable=True)
    primary_objective = db.Column(db.Text, nullable=True)
    secondary_objectives = db.Column(db.Text, nullable=True)
    study_type = db.Column(db.String(100), nullable=True)
    study_design = db.Column(db.String(100), nullable=True)
    study_phase = db.Column(db.String(100), nullable=True)
    randomization = db.Column(db.String(100), nullable=True)
    blinding = db.Column(db.String(100), nullable=True)
    control_type = db.Column(db.String(100), nullable=True)
    study_duration = db.Column(db.String(100), nullable=True)
    target_population = db.Column(db.String(255), nullable=True)
    sample_size = db.Column(db.Integer, nullable=True)
    minimum_age = db.Column(db.Integer, nullable=True)
    maximum_age = db.Column(db.Integer, nullable=True)
    gender_criteria = db.Column(db.String(50), nullable=True)
    inclusion_criteria = db.Column(db.Text, nullable=True)
    exclusion_criteria = db.Column(db.Text, nullable=True)
    intervention_name = db.Column(db.String(255), nullable=True)
    intervention_description = db.Column(db.Text, nullable=True)
    dosage = db.Column(db.String(255), nullable=True)
    route = db.Column(db.String(100), nullable=True)
    frequency = db.Column(db.String(100), nullable=True)
    intervention_duration = db.Column(db.String(100), nullable=True)
    primary_outcomes = db.Column(db.Text, nullable=True)
    secondary_outcomes = db.Column(db.Text, nullable=True)
    safety_monitoring = db.Column(db.Text, nullable=True)
    adverse_event_reporting = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def to_dict(self) -> dict:
        """Serialize Protocol model to dictionary."""
        return {
            "id": self.id,
            "study_id": self.study_id,
            "protocol_title": self.protocol_title,
            "protocol_version": self.protocol_version,
            "protocol_date": self.protocol_date,
            "principal_investigator": self.principal_investigator,
            "sponsor": self.sponsor,
            "background": self.background,
            "rationale": self.rationale,
            "research_question": self.research_question,
            "primary_objective": self.primary_objective,
            "secondary_objectives": self.secondary_objectives,
            "study_type": self.study_type,
            "study_design": self.study_design,
            "study_phase": self.study_phase,
            "randomization": self.randomization,
            "blinding": self.blinding,
            "control_type": self.control_type,
            "study_duration": self.study_duration,
            "target_population": self.target_population,
            "sample_size": self.sample_size,
            "minimum_age": self.minimum_age,
            "maximum_age": self.maximum_age,
            "gender_criteria": self.gender_criteria,
            "inclusion_criteria": self.inclusion_criteria,
            "exclusion_criteria": self.exclusion_criteria,
            "intervention_name": self.intervention_name,
            "intervention_description": self.intervention_description,
            "dosage": self.dosage,
            "route": self.route,
            "frequency": self.frequency,
            "intervention_duration": self.intervention_duration,
            "primary_outcomes": self.primary_outcomes,
            "secondary_outcomes": self.secondary_outcomes,
            "safety_monitoring": self.safety_monitoring,
            "adverse_event_reporting": self.adverse_event_reporting,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Protocol {self.id}: Study {self.study_id} (v{self.protocol_version})>"
