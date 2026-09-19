from datetime import datetime
from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from models.participant import Participant, InformedConsent

VALID_PARTICIPANT_STATUSES = {
    "Screened",
    "Eligible",
    "Enrolled",
    "Active",
    "Withdrawn",
    "Completed",
}

VALID_CONSENT_STATUSES = {
    "Not Started",
    "Consent Pending",
    "Consented",
    "Declined",
    "Withdrawn",
}


def _lookup_study(identifier: str | int) -> Study | None:
    """Resolve Study by integer database ID or study_id string."""
    if not identifier:
        return None
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()
    return study


def _generate_next_participant_id(study_id: int) -> str:
    """Generate study-scoped de-identified participant ID (e.g., 'SUBJ-001')."""
    count = Participant.query.filter_by(study_id=study_id).count()
    candidate_num = count + 1
    candidate_id = f"SUBJ-{candidate_num:03d}"

    while Participant.query.filter_by(study_id=study_id, participant_id=candidate_id).first() is not None:
        candidate_num += 1
        candidate_id = f"SUBJ-{candidate_num:03d}"

    return candidate_id


def list_participants(
    study_identifier: str | int,
    user: User,
    search: str = None,
    status_filter: str = None,
    consent_filter: str = None,
) -> tuple[bool, str, int, dict | None]:
    """
    List participants for a clinical study with study-level isolation and permission checks.
    """
    study = _lookup_study(study_identifier)
    if not study:
        return False, f"Study '{study_identifier}' not found", 404, None

    # Role & Ownership check: Researcher must own the study; Regulatory Admin has oversight
    if user.role == "researcher" and study.researcher_id != user.id:
        return False, "You do not have permission to view participants for this study", 403, None

    if user.role not in {"researcher", "regulatory_admin"}:
        return False, "Access Denied: Role not authorized for Participant Management", 403, None

    query = Participant.query.filter_by(study_id=study.id)

    if status_filter and status_filter != "all":
        query = query.filter(Participant.status == status_filter.strip())

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Participant.participant_id.ilike(s_term))
            | (Participant.screening_number.ilike(s_term))
            | (Participant.initials.ilike(s_term))
            | (Participant.prakriti.ilike(s_term))
        )

    participants = query.order_by(Participant.id.asc()).all()
    results = []

    # Filter by consent status if requested
    for p in participants:
        p_dict = p.to_dict()
        if consent_filter and consent_filter != "all":
            if (p_dict["consent"]["status"] or "").lower() != consent_filter.lower():
                continue
        results.append(p_dict)

    # Get summary statistics
    all_study_participants = Participant.query.filter_by(study_id=study.id).all()
    stats = {
        "total": len(all_study_participants),
        "screened": sum(1 for p in all_study_participants if p.status == "Screened"),
        "eligible": sum(1 for p in all_study_participants if p.status == "Eligible"),
        "enrolled": sum(1 for p in all_study_participants if p.status == "Enrolled"),
        "active": sum(1 for p in all_study_participants if p.status == "Active"),
        "completed": sum(1 for p in all_study_participants if p.status == "Completed"),
        "withdrawn": sum(1 for p in all_study_participants if p.status == "Withdrawn"),
        "consented": sum(1 for p in all_study_participants if p.consent and p.consent.status == "Consented"),
        "target_sample_size": study.estimated_sample_size,
    }

    return True, "Participants retrieved successfully", 200, {
        "study": {
            "id": study.id,
            "study_id": study.study_id,
            "title": study.title,
            "status": study.status,
            "is_activated": study.status == "activated",
        },
        "stats": stats,
        "participants": results,
    }


def create_participant(
    study_identifier: str | int,
    user: User,
    payload: dict,
) -> tuple[bool, str, int, dict | None]:
    """
    Add a new de-identified participant to an activated clinical study.
    Enforces:
      1. Study must be in 'activated' status
      2. Researcher must own the study (or regulatory_admin)
      3. Automatic de-identified code generation (SUBJ-xxx)
      4. Auto-initializes InformedConsent record to 'Not Started'
    """
    study = _lookup_study(study_identifier)
    if not study:
        return False, f"Study '{study_identifier}' not found", 404, None

    if user.role == "researcher" and study.researcher_id != user.id:
        return False, "You do not have permission to add participants to this study", 403, None

    if user.role not in {"researcher", "regulatory_admin"}:
        return False, "Unauthorized role for participant enrollment", 403, None

    # Enforce Activation prerequisite
    if study.status != "activated":
        return (
            False,
            f"Participant registration is blocked. Study must be in 'activated' status before recruiting participants. Current status: '{study.status}'.",
            400,
            None,
        )

    if not isinstance(payload, dict):
        return False, "Request body must be a valid JSON object", 400, None

    custom_id = (payload.get("participant_id") or "").strip()
    if custom_id:
        existing = Participant.query.filter_by(study_id=study.id, participant_id=custom_id).first()
        if existing:
            return False, f"Participant ID '{custom_id}' already exists in this study.", 409, None
        participant_id = custom_id
    else:
        participant_id = _generate_next_participant_id(study.id)

    initials = (payload.get("initials") or "").strip().upper() or None
    if initials and len(initials) > 10:
        initials = initials[:10]

    age_val = payload.get("age")
    age = None
    if age_val is not None and age_val != "":
        try:
            age = int(age_val)
            if age < 0 or age > 125:
                return False, "Participant age must be between 0 and 125", 400, None
        except (ValueError, TypeError):
            return False, "Age must be a valid integer number", 400, None

    gender = (payload.get("gender") or "Other").strip()
    prakriti = (payload.get("prakriti") or "").strip() or None
    screening_number = (payload.get("screening_number") or "").strip() or None
    screening_date = payload.get("screening_date") or datetime.utcnow().strftime("%Y-%m-%d")

    participant = Participant(
        study_id=study.id,
        participant_id=participant_id,
        screening_number=screening_number,
        initials=initials,
        age=age,
        gender=gender,
        prakriti=prakriti,
        inclusion_criteria_met=bool(payload.get("inclusion_criteria_met", True)),
        exclusion_criteria_met=bool(payload.get("exclusion_criteria_met", False)),
        screening_date=screening_date,
        status="Screened",
        notes=(payload.get("notes") or "").strip() or None,
        registered_by_id=user.id,
    )

    db.session.add(participant)
    db.session.flush()

    # Find the active Informed Consent document from study documents if available
    icf_doc = (
        Document.query.filter_by(study_id=study.id, document_type="informed_consent", is_deleted=False)
        .order_by(Document.id.desc())
        .first()
    )

    # Auto-initialize Informed Consent record in 'Not Started' state
    consent = InformedConsent(
        participant_id=participant.id,
        study_id=study.id,
        status="Not Started",
        consent_document_id=icf_doc.id if icf_doc else None,
        consent_document_version=f"v{icf_doc.current_version}" if icf_doc else "v1.0",
        consent_document_name=icf_doc.original_filename if icf_doc else "Approved Informed Consent Form",
        consented_by_user_id=user.id,
        audit_trail=[{
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": "CONSENT_INITIALIZED",
            "status": "Not Started",
            "user_id": user.id,
            "user_name": user.full_name,
        }],
    )

    db.session.add(consent)

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error creating participant: {str(exc)}", 500, None

    return True, f"Participant '{participant.participant_id}' registered successfully in study '{study.study_id}'.", 201, participant.to_dict()


def update_participant_status(
    study_identifier: str | int,
    participant_ref: str | int,
    user: User,
    payload: dict,
) -> tuple[bool, str, int, dict | None]:
    """
    Update participant lifecycle status.
    
    CRITICAL SAFETY GUARD:
    Enrollment or Active status requires that participant's Informed Consent
    has been confirmed in 'Consented' status.
    """
    study = _lookup_study(study_identifier)
    if not study:
        return False, f"Study '{study_identifier}' not found", 404, None

    if user.role == "researcher" and study.researcher_id != user.id:
        return False, "You do not have permission to modify participants for this study", 403, None

    # Resolve participant by integer ID or participant_id string
    participant = None
    if str(participant_ref).isdigit():
        participant = db.session.get(Participant, int(participant_ref))
    if not participant:
        participant = Participant.query.filter_by(study_id=study.id, participant_id=str(participant_ref)).first()

    if not participant or participant.study_id != study.id:
        return False, f"Participant '{participant_ref}' not found in study '{study.study_id}'", 404, None

    new_status = (payload.get("status") or "").strip()
    if not new_status or new_status not in VALID_PARTICIPANT_STATUSES:
        return (
            False,
            f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(VALID_PARTICIPANT_STATUSES))}",
            400,
            None,
        )

    # CRITICAL INFORMED CONSENT GUARD:
    # A participant CANNOT proceed to 'Enrolled' or 'Active' without an approved informed consent!
    if new_status in {"Enrolled", "Active"}:
        consent = participant.consent
        if not consent or consent.status != "Consented":
            consent_curr = consent.status if consent else "Not Started"
            return (
                False,
                f"Protocol Safety Violation: Participant '{participant.participant_id}' cannot be enrolled. Informed Consent must be in 'Consented' status prior to enrollment (current consent status: '{consent_curr}').",
                400,
                {
                    "participant": participant.to_dict(),
                    "consent_required": True,
                    "current_consent_status": consent_curr,
                },
            )

    participant.status = new_status
    if "withdrawal_reason" in payload:
        participant.withdrawal_reason = payload.get("withdrawal_reason")
    if "notes" in payload:
        participant.notes = payload.get("notes")
    participant.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error updating participant status: {str(exc)}", 500, None

    return True, f"Participant status updated to '{new_status}'.", 200, participant.to_dict()


def record_informed_consent(
    study_identifier: str | int,
    participant_ref: str | int,
    user: User,
    payload: dict,
) -> tuple[bool, str, int, dict | None]:
    """
    Record or update an official Informed Consent record for a participant.
    Supported states:
      - 'Consented': Full patient consent given.
      - 'Consent Pending': Consent discussion ongoing.
      - 'Declined': Patient declined trial participation.
      - 'Withdrawn': Previously given consent withdrawn.
    Preserves consent document version reference and immutable audit trail.
    """
    study = _lookup_study(study_identifier)
    if not study:
        return False, f"Study '{study_identifier}' not found", 404, None

    if user.role == "researcher" and study.researcher_id != user.id:
        return False, "You do not have permission to administer consent for this study", 403, None

    participant = None
    if str(participant_ref).isdigit():
        participant = db.session.get(Participant, int(participant_ref))
    if not participant:
        participant = Participant.query.filter_by(study_id=study.id, participant_id=str(participant_ref)).first()

    if not participant or participant.study_id != study.id:
        return False, f"Participant '{participant_ref}' not found in study '{study.study_id}'", 404, None

    new_status = (payload.get("status") or "").strip()
    if not new_status or new_status not in VALID_CONSENT_STATUSES:
        return (
            False,
            f"Invalid consent status '{new_status}'. Allowed: {', '.join(sorted(VALID_CONSENT_STATUSES))}",
            400,
            None,
        )

    consent = participant.consent
    if not consent:
        consent = InformedConsent(
            participant_id=participant.id,
            study_id=study.id,
            status="Not Started",
            consented_by_user_id=user.id,
        )
        db.session.add(consent)

    prev_status = consent.status
    consent.status = new_status
    consent.consented_by_user_id = user.id

    if "consent_date" in payload and payload["consent_date"]:
        consent.consent_date = str(payload["consent_date"]).strip()
    elif new_status == "Consented":
        consent.consent_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    if "witness_name" in payload:
        consent.witness_name = (payload.get("witness_name") or "").strip() or None
    if "language" in payload:
        consent.language = (payload.get("language") or "English").strip()
    if "remarks" in payload:
        consent.remarks = (payload.get("remarks") or "").strip() or None

    # Link approved consent document
    if "consent_document_id" in payload and payload["consent_document_id"]:
        doc_id = payload["consent_document_id"]
        doc = db.session.get(Document, int(doc_id))
        if doc and doc.study_id == study.id:
            consent.consent_document_id = doc.id
            consent.consent_document_name = doc.original_filename
            consent.consent_document_version = f"v{doc.current_version}"
    elif not consent.consent_document_id:
        # Default to study's uploaded ICF document
        icf = (
            Document.query.filter_by(study_id=study.id, document_type="informed_consent", is_deleted=False)
            .order_by(Document.id.desc())
            .first()
        )
        if icf:
            consent.consent_document_id = icf.id
            consent.consent_document_name = icf.original_filename
            consent.consent_document_version = f"v{icf.current_version}"

    # Append audit trail entry
    now_iso = datetime.utcnow().isoformat() + "Z"
    trail = list(consent.audit_trail or [])
    trail.append({
        "timestamp": now_iso,
        "from_status": prev_status,
        "to_status": new_status,
        "consented_by": {
            "id": user.id,
            "full_name": user.full_name,
            "role": user.role,
        },
        "witness_name": consent.witness_name,
        "language": consent.language,
        "document_version": consent.consent_document_version,
        "remarks": consent.remarks,
    })
    consent.audit_trail = trail
    consent.updated_at = datetime.utcnow()

    # If consent is declined or withdrawn and participant was enrolled, update participant status
    if new_status in {"Declined", "Withdrawn"} and participant.status in {"Enrolled", "Active"}:
        participant.status = "Withdrawn"
        participant.withdrawal_reason = f"Informed consent {new_status.lower()} on {now_iso}"
        participant.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error saving informed consent: {str(exc)}", 500, None

    return True, f"Informed Consent status updated to '{new_status}'.", 200, {
        "participant": participant.to_dict(),
        "consent": consent.to_dict(),
    }
