import os
import json
import tempfile
from datetime import datetime
from threading import Lock

from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from models.protocol import Protocol
from models.quality_check import QualityCheck
from services.iec_member_service import load_study_reviews
from services.ai_review_summary_service import generate_ai_review_summary
from services.iec_secretariat_service import calculate_study_readiness, get_study_verification_checklist

# ------------------------------------------------------------------------------
# THREAD-SAFE PERSISTENT DECISION STORAGE (Zero Database Migrations)
# ------------------------------------------------------------------------------
_decision_storage_lock = Lock()


def _get_decisions_storage_dir() -> str:
    """Return absolute path to directory storing official IEC decision records."""
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    storage_dir = os.path.join(backend_dir, "data", "iec_decisions")
    os.makedirs(storage_dir, exist_ok=True)
    return storage_dir


def _get_study_decision_file_path(study_id_str: str) -> str:
    """Isolate decision records per study to prevent cross-study exposure."""
    safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in str(study_id_str))
    storage_dir = _get_decisions_storage_dir()
    return os.path.join(storage_dir, f"study_{safe_name}.json")


def load_study_decision(study_id_str: str) -> dict | None:
    """
    Safely load historical IEC decision record for a given study.
    Thread-safe and survives server restarts.
    """
    file_path = _get_study_decision_file_path(study_id_str)
    with _decision_storage_lock:
        if not os.path.isfile(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, dict) else None
        except Exception as err:
            print(f"[IEC Decision Storage] Error reading {file_path}: {err}")
            return None


def save_study_decision(study_id_str: str, decision_record: dict) -> dict:
    """
    Save an official IEC decision record using atomic file writing under thread lock.
    """
    file_path = _get_study_decision_file_path(study_id_str)
    storage_dir = _get_decisions_storage_dir()

    with _decision_storage_lock:
        temp_fd, temp_path = tempfile.mkstemp(dir=storage_dir, prefix="dec_", suffix=".tmp")
        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as tf:
                json.dump(decision_record, tf, indent=2, ensure_ascii=False)
            os.replace(temp_path, file_path)
        except Exception as err:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise IOError(f"Failed to persist IEC decision safely: {err}")

        return decision_record


# ------------------------------------------------------------------------------
# DECISION DOSSIER & SUBMISSION BUSINESS LOGIC
# ------------------------------------------------------------------------------

VALID_DECISION_MAPPING = {
    "approved": {
        "label": "Approved",
        "study_status": "approved",
        "description": "Full ethical clearance approved for clinical trial initiation and CTRI registration.",
    },
    "modify": {
        "label": "Modify / Revision Required",
        "study_status": "modification_required",
        "description": "Modifications required prior to ethical approval. Returned to researcher for amendment.",
    },
    "modification_required": {
        "label": "Modify / Revision Required",
        "study_status": "modification_required",
        "description": "Modifications required prior to ethical approval. Returned to researcher for amendment.",
    },
    "not_approved": {
        "label": "Not Approved",
        "study_status": "not_approved",
        "description": "Ethical committee disapproval. Study cannot proceed in current formulation.",
    },
}


def get_study_decision_dossier(identifier: str | int) -> tuple[bool, str, int, dict | None]:
    """
    Retrieve comprehensive decision dossier for a study:
    - Study Core Metadata & PI Info
    - Protocol Summary
    - Document Verification Status & Checklist
    - AI Quality Gate Results
    - AI Review Summary (synthesized analysis)
    - IEC Member Review & Recommendations
    - Existing IEC Decision (if already recorded)
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    # Load historical member reviews
    member_reviews = load_study_reviews(study.study_id)
    has_member_reviews = len(member_reviews) > 0

    # Load existing decision if any
    existing_decision = load_study_decision(study.study_id)

    # Check if IEC Member review has been completed
    # Eligible if status is iec_recommendation_submitted or reviews exist or decision already recorded
    if not has_member_reviews and not existing_decision and study.status not in {"iec_recommendation_submitted", "under_iec_review"}:
        return (
            False,
            "IEC Member Review is incomplete. The study must be reviewed by an IEC Member before an official IEC Decision can be convened.",
            409,
            None,
        )

    # Researcher metadata
    researcher_info = {
        "id": study.researcher.id if study.researcher else None,
        "full_name": study.researcher.full_name if study.researcher else "Unknown",
        "email": study.researcher.email if study.researcher else None,
        "institution": "AYUSH Clinical Research Center",
    }

    # Protocol summary
    protocol = Protocol.query.filter_by(study_id=study.id).first()
    protocol_data = protocol.to_dict() if protocol else None

    # Documents
    documents = Document.query.filter_by(study_id=study.id, is_deleted=False).all()
    docs_list = [d.to_dict(include_versions=True) for d in documents]
    checklist = get_study_verification_checklist(study.id, documents)

    # Quality Gate
    qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )
    qc_data = qc.to_dict() if qc else {
        "status": "not_checked",
        "score": None,
        "summary": "Quality Gate has not been executed yet.",
        "completeness": {"status": "not_checked", "issues": []},
        "consistency": {"status": "not_checked", "issues": []},
        "cross_document": {"status": "not_checked", "issues": []},
        "risk_flags": [],
    }

    # Synthesized AI Review Summary if available
    ai_summary_data = None
    if has_member_reviews:
        ok_sum, _, _, sum_payload = generate_ai_review_summary(study.study_id)
        if ok_sum:
            ai_summary_data = sum_payload

    # Readiness
    readiness = calculate_study_readiness(study)

    dossier = {
        "study": study.to_dict(),
        "researcher": researcher_info,
        "protocol": protocol_data,
        "documents": docs_list,
        "verification_checklist": checklist,
        "quality_gate": qc_data,
        "ai_review_summary": ai_summary_data,
        "iec_member_reviews": member_reviews,
        "latest_member_review": member_reviews[-1] if member_reviews else None,
        "existing_decision": existing_decision,
        "is_decision_finalized": existing_decision is not None,
        "readiness": readiness,
    }

    return True, "IEC Decision dossier retrieved successfully", 200, dossier


def record_study_decision(
    identifier: str | int,
    decision_user: User,
    payload: dict,
) -> tuple[bool, str, int, dict | None]:
    """
    Record an official, binding IEC Decision on a clinical study:
    Supported outcomes:
      - 'approved' -> Study.status = 'approved'
      - 'modify' / 'modification_required' -> Study.status = 'modification_required'
      - 'not_approved' -> Study.status = 'not_approved'

    Validates:
      1. Study existence & completion of IEC review stage
      2. Valid decision outcome selection
      3. Decision remarks presence
      4. Overwrite guard (final decision cannot be accidentally overwritten)
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    if payload is None or not isinstance(payload, dict):
        return False, "Request body must be a valid JSON object", 400, None

    # Decision validation
    raw_decision = str(payload.get("decision", "")).strip().lower()
    if not raw_decision:
        return False, "Decision outcome is mandatory. Choose 'approved', 'modify', or 'not_approved'.", 400, None

    if raw_decision not in VALID_DECISION_MAPPING:
        allowed = list(VALID_DECISION_MAPPING.keys())
        return False, f"Invalid decision '{raw_decision}'. Allowed outcomes: {', '.join(allowed)}", 400, None

    decision_config = VALID_DECISION_MAPPING[raw_decision]
    target_status = decision_config["study_status"]
    decision_label = decision_config["label"]

    # Remarks validation
    remarks = str(payload.get("comments") or payload.get("remarks") or "").strip()
    if not remarks:
        return False, "Decision remarks / rationale are mandatory to ensure regulatory audit compliance.", 400, None

    conditions = str(payload.get("conditions") or "").strip()

    # Pre-condition check: Study must have completed IEC member review
    member_reviews = load_study_reviews(study.study_id)
    if not member_reviews and study.status not in {"iec_recommendation_submitted", "under_iec_review"}:
        return (
            False,
            f"Cannot issue IEC Decision: Study '{study.study_id}' has not completed the required IEC Member Review stage (current status: '{study.status}').",
            400,
            None,
        )

    # Overwrite guard: Check if an official decision is already recorded
    existing = load_study_decision(study.study_id)
    if existing and existing.get("decision"):
        return (
            False,
            f"An official IEC Decision ('{existing.get('decision_label')}') has already been finalized on {existing.get('decision_date')} and cannot be overwritten.",
            409,
            existing,
        )

    # Update Study Status in Database
    previous_status = study.status
    study.status = target_status
    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error updating study status: {str(exc)}", 500, None

    now_iso = datetime.utcnow().isoformat() + "Z"
    decision_id = f"dec_{study.id}_{decision_user.id}_{int(datetime.utcnow().timestamp())}"

    decision_record = {
        "decision_id": decision_id,
        "study_id": study.study_id,
        "study_db_id": study.id,
        "study_title": study.title,
        "decision": target_status,
        "decision_label": decision_label,
        "remarks": remarks,
        "comments": remarks,
        "conditions": conditions if conditions else None,
        "decision_date": now_iso,
        "decided_by": {
            "id": decision_user.id,
            "full_name": decision_user.full_name,
            "email": decision_user.email,
            "role": decision_user.role,
        },
        "previous_status": previous_status,
        "study_status": target_status,
    }

    try:
        save_study_decision(study.study_id, decision_record)
    except Exception as exc:
        return False, f"Failed to persist decision audit record: {str(exc)}", 500, None

    return True, f"Official IEC Decision recorded: {decision_label}. Study status updated to '{target_status}'.", 200, {
        "decision": decision_record,
        "study": study.to_dict(),
    }
