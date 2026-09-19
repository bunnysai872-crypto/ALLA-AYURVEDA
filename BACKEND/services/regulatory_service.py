from datetime import datetime
from extensions import db
from models.user import User
from models.study import Study
from models.regulatory import RegulatoryTracking
from services.iec_decision_service import load_study_decision

VALID_REGULATORY_STATUSES = {
    "Not Started",
    "In Progress",
    "Submitted",
    "Under Review",
    "Approved/Registered",
    "Returned / Requires Update",
}

VALID_CTRI_STATUSES = {
    "Not Started",
    "In Progress",
    "Submitted",
    "Under Review",
    "Approved/Registered",
    "Returned / Requires Update",
}


def _lookup_study(identifier: str | int) -> Study | None:
    """Resolve Study by integer database ID or unique study_id string."""
    if not identifier:
        return None
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()
    return study


def get_or_create_regulatory_tracking(study: Study) -> RegulatoryTracking:
    """Retrieve existing RegulatoryTracking or initialize new record for an IEC-approved study."""
    tracking = RegulatoryTracking.query.filter_by(study_id=study.id).first()
    if not tracking:
        tracking = RegulatoryTracking(
            study_id=study.id,
            regulatory_status="Not Started",
            ctri_status="Not Started",
            audit_trail=[],
        )
        db.session.add(tracking)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            tracking = RegulatoryTracking.query.filter_by(study_id=study.id).first()
    return tracking


def list_regulatory_studies(
    user: User,
    search: str = None,
    status_filter: str = None,
    sort_by: str = "newest",
) -> list[dict]:
    """
    List clinical studies for Regulatory & CTRI Tracking.
    Eligibility: Studies that have completed IEC and received 'approved' status,
    or have an official approved IEC decision, or have entered activation.
    """
    query = Study.query

    # Researchers can only see their own approved studies
    if user.role == "researcher":
        query = query.filter_by(researcher_id=user.id)

    # Filter studies that have reached IEC approval or later
    # Eligible workflow statuses: approved, activated
    query = query.filter(Study.status.in_(["approved", "activated"]))

    if search:
        s_term = f"%{search.strip()}%"
        query = query.join(User, Study.researcher_id == User.id).filter(
            (Study.title.ilike(s_term))
            | (Study.study_id.ilike(s_term))
            | (User.full_name.ilike(s_term))
        )

    if sort_by == "oldest":
        query = query.order_by(Study.created_at.asc())
    elif sort_by == "title":
        query = query.order_by(Study.title.asc())
    else:
        query = query.order_by(Study.updated_at.desc())

    studies = query.all()
    results = []

    for study in studies:
        tracking = get_or_create_regulatory_tracking(study)
        decision = load_study_decision(study.study_id) or load_study_decision(str(study.id))

        reg_status = tracking.regulatory_status or "Not Started"
        ctri_status = tracking.ctri_status or "Not Started"

        if status_filter and status_filter != "all":
            if (
                status_filter.lower() != reg_status.lower()
                and status_filter.lower() != ctri_status.lower()
                and status_filter.lower() != study.status.lower()
            ):
                continue

        results.append({
            "id": study.id,
            "study_id": study.study_id,
            "protocol_number": study.protocol_number,
            "title": study.title,
            "short_title": study.short_title,
            "study_type": study.study_type,
            "study_design": study.study_design,
            "condition": study.condition,
            "workflow_status": study.status,
            "researcher": {
                "id": study.researcher.id if study.researcher else None,
                "full_name": study.researcher.full_name if study.researcher else "Unknown",
                "email": study.researcher.email if study.researcher else None,
            },
            "iec_decision": {
                "decision": decision.get("decision") if decision else study.status,
                "decision_label": decision.get("decision_label") if decision else "Approved",
                "decision_date": decision.get("decision_date") if decision else None,
                "decided_by": decision.get("decided_by") if decision else None,
            },
            "regulatory": tracking.to_dict()["regulatory"],
            "ctri": tracking.to_dict()["ctri"],
            "is_activated": study.status == "activated",
            "updated_at": study.updated_at.isoformat() if study.updated_at else None,
            "created_at": study.created_at.isoformat() if study.created_at else None,
        })

    return results


def get_regulatory_dossier(identifier: str | int, user: User) -> tuple[bool, str, int, dict | None]:
    """
    Retrieve comprehensive regulatory & CTRI dossier for a study.
    Accessible to Regulatory Admin, and Researchers (for their own studies).
    """
    study = _lookup_study(identifier)
    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    if user.role == "researcher" and study.researcher_id != user.id:
        return False, "You do not have permission to access regulatory information for this study", 403, None

    tracking = get_or_create_regulatory_tracking(study)
    decision = load_study_decision(study.study_id) or load_study_decision(str(study.id))

    dossier = {
        "study": study.to_dict(),
        "researcher": {
            "id": study.researcher.id if study.researcher else None,
            "full_name": study.researcher.full_name if study.researcher else "Unknown",
            "email": study.researcher.email if study.researcher else None,
        },
        "iec_decision": decision,
        "regulatory_tracking": tracking.to_dict(),
        "is_activated": study.status == "activated",
    }

    return True, "Regulatory dossier retrieved successfully", 200, dossier


def update_regulatory_tracking(
    identifier: str | int,
    user: User,
    payload: dict,
) -> tuple[bool, str, int, dict | None]:
    """
    Update regulatory submission details and CTRI registration tracking.
    Enforces Regulatory Admin role permission and maintains audit history.
    """
    if user.role != "regulatory_admin":
        return False, "Only Regulatory Admins can update regulatory and CTRI tracking information", 403, None

    study = _lookup_study(identifier)
    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    if not isinstance(payload, dict):
        return False, "Request body must be a valid JSON object", 400, None

    tracking = get_or_create_regulatory_tracking(study)

    # Validate Regulatory fields
    new_reg_status = payload.get("regulatory_status")
    if new_reg_status is not None:
        new_reg_status = str(new_reg_status).strip()
        if new_reg_status and new_reg_status not in VALID_REGULATORY_STATUSES:
            return (
                False,
                f"Invalid regulatory status '{new_reg_status}'. Allowed: {', '.join(sorted(VALID_REGULATORY_STATUSES))}",
                400,
                None,
            )
        if new_reg_status:
            tracking.regulatory_status = new_reg_status

    if "regulatory_submission_date" in payload:
        tracking.regulatory_submission_date = payload.get("regulatory_submission_date") or None
    if "regulatory_reference_number" in payload:
        tracking.regulatory_reference_number = payload.get("regulatory_reference_number") or None
    if "regulatory_approval_date" in payload:
        tracking.regulatory_approval_date = payload.get("regulatory_approval_date") or None
    if "regulatory_remarks" in payload:
        tracking.regulatory_remarks = payload.get("regulatory_remarks") or None

    # Validate CTRI fields
    new_ctri_status = payload.get("ctri_status")
    if new_ctri_status is not None:
        new_ctri_status = str(new_ctri_status).strip()
        if new_ctri_status and new_ctri_status not in VALID_CTRI_STATUSES:
            return (
                False,
                f"Invalid CTRI status '{new_ctri_status}'. Allowed: {', '.join(sorted(VALID_CTRI_STATUSES))}",
                400,
                None,
            )
        if new_ctri_status:
            tracking.ctri_status = new_ctri_status

    if "ctri_submission_date" in payload:
        tracking.ctri_submission_date = payload.get("ctri_submission_date") or None
    if "ctri_reg_number" in payload:
        tracking.ctri_reg_number = payload.get("ctri_reg_number") or None
    if "ctri_registration_date" in payload:
        tracking.ctri_registration_date = payload.get("ctri_registration_date") or None
    if "ctri_remarks" in payload:
        tracking.ctri_remarks = payload.get("ctri_remarks") or None

    # Record audit trail entry
    now_iso = datetime.utcnow().isoformat() + "Z"
    trail = list(tracking.audit_trail or [])
    trail.append({
        "timestamp": now_iso,
        "updated_by": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "regulatory_status": tracking.regulatory_status,
        "ctri_status": tracking.ctri_status,
        "regulatory_reference": tracking.regulatory_reference_number,
        "ctri_number": tracking.ctri_reg_number,
        "notes": payload.get("remarks") or payload.get("audit_note") or "Regulatory/CTRI record updated",
    })
    tracking.audit_trail = trail
    tracking.updated_by_id = user.id
    tracking.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error updating regulatory tracking: {str(exc)}", 500, None

    return True, "Regulatory & CTRI tracking updated successfully", 200, tracking.to_dict()
