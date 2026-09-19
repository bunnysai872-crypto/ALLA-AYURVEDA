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
from services.iec_secretariat_service import (
    calculate_study_readiness,
    get_study_verification_checklist,
)

# ------------------------------------------------------------------------------
# REVIEW DOMAINS SPECIFICATION (10 CLINICALLY & ETHICALLY MEANINGFUL DOMAINS)
# ------------------------------------------------------------------------------
IEC_REVIEW_DOMAINS = [
    {
        "key": "scientific_validity",
        "label": "1. Scientific Validity & Rationale",
        "description": "Soundness of scientific hypothesis, justification in Ayurvedic classical literature & modern science, and trial rationale.",
    },
    {
        "key": "study_design",
        "label": "2. Study Design & Methodology",
        "description": "Appropriateness of trial design (RCT, observational), control/comparator choice, blinding, randomization, and duration.",
    },
    {
        "key": "participant_eligibility",
        "label": "3. Participant Eligibility & Selection",
        "description": "Fairness, equity, and scientific clarity of inclusion and exclusion criteria; protection of vulnerable populations.",
    },
    {
        "key": "risk_benefit",
        "label": "4. Risk-Benefit Assessment & Mitigation",
        "description": "Anticipated clinical risks and formulation toxicities vs therapeutic benefits; comprehensive risk-minimization strategy.",
    },
    {
        "key": "intervention_regimen",
        "label": "5. Ayurvedic Intervention & Regimen",
        "description": "Quality standardization (GMP, pharmacopeial specs), dosage safety, route/Anupana, and drug-herb interaction profile.",
    },
    {
        "key": "safety_monitoring",
        "label": "6. Safety Monitoring & AE Reporting",
        "description": "Periodic safety monitoring schedule, clinical laboratory assessments, stopping rules, and expedited SAE reporting protocols.",
    },
    {
        "key": "informed_consent",
        "label": "7. Informed Consent Process & Documentation",
        "description": "Completeness and vernacular clarity of Patient Information Sheet (PIS) and Informed Consent Form (ICF); voluntary consent.",
    },
    {
        "key": "confidentiality_data",
        "label": "8. Confidentiality & Data Protection",
        "description": "Participant de-identification, secure CRF/electronic data storage, access controls, and compliance with data governance.",
    },
    {
        "key": "ethical_considerations",
        "label": "9. Ethical Considerations & Community Value",
        "description": "Cultural sensitivity in Ayurveda trials, conflict of interest declarations, fair recruitment, and post-trial care provisions.",
    },
    {
        "key": "overall_recommendation",
        "label": "10. Overall Assessment & Decision Rationale",
        "description": "Synthesis of ethical and clinical scrutiny justifying the recommendation (Approval, Modification, or Rejection).",
    },
]

VALID_RECOMMENDATIONS = {
    "recommend_approval",
    "recommend_modification",
    "recommend_rejection",
}

# ------------------------------------------------------------------------------
# THREAD-SAFE PERSISTENT REVIEW STORAGE (Zero Database Migrations)
# ------------------------------------------------------------------------------
_storage_lock = Lock()


def _get_reviews_storage_dir() -> str:
    """Return absolute path to directory storing IEC review audit records."""
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    storage_dir = os.path.join(backend_dir, "data", "iec_reviews")
    os.makedirs(storage_dir, exist_ok=True)
    return storage_dir


def _get_study_review_file_path(study_id_str: str) -> str:
    """Isolate review records per study to prevent cross-study exposure."""
    safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in str(study_id_str))
    storage_dir = _get_reviews_storage_dir()
    return os.path.join(storage_dir, f"study_{safe_name}.json")


def load_study_reviews(study_id_str: str) -> list[dict]:
    """
    Safely load historical IEC review records for a given study.
    Thread-safe and survives server restarts.
    """
    file_path = _get_study_review_file_path(study_id_str)
    with _storage_lock:
        if not os.path.isfile(file_path):
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("reviews", []) if isinstance(data, dict) else []
        except Exception as err:
            print(f"[IEC Review Storage] Error reading {file_path}: {err}")
            return []


def save_study_review(study_id_str: str, review_record: dict) -> list[dict]:
    """
    Append an IEC review record to the study's review history.
    Uses atomic file writing (write to temporary file then atomic replace)
    under thread lock to guarantee crash-safe persistence.
    """
    file_path = _get_study_review_file_path(study_id_str)
    storage_dir = _get_reviews_storage_dir()

    with _storage_lock:
        existing_reviews = []
        if os.path.isfile(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        existing_reviews = data.get("reviews", [])
            except Exception as err:
                print(f"[IEC Review Storage] Error loading existing reviews from {file_path}: {err}")
                existing_reviews = []

        existing_reviews.append(review_record)
        payload = {
            "study_id": study_id_str,
            "total_reviews": len(existing_reviews),
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "reviews": existing_reviews,
        }

        # Atomic write
        temp_fd, temp_path = tempfile.mkstemp(dir=storage_dir, prefix="rev_", suffix=".tmp")
        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as tf:
                json.dump(payload, tf, indent=2, ensure_ascii=False)
            os.replace(temp_path, file_path)
        except Exception as err:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise IOError(f"Failed to persist IEC review safely: {err}")

        return existing_reviews


# ------------------------------------------------------------------------------
# IEC MEMBER BUSINESS LOGIC
# ------------------------------------------------------------------------------

def get_member_dashboard_metrics() -> dict:
    """
    Aggregate live KPI statistics for the IEC Member dashboard.
    Counts real studies across the IEC review lifecycle.
    """
    all_studies = Study.query.all()

    ready_count = 0
    under_review_count = 0
    rec_submitted_count = 0

    for s in all_studies:
        st = (s.status or "").lower().strip()
        if st == "ready_for_iec_review":
            ready_count += 1
        elif st == "under_iec_review":
            under_review_count += 1
        elif st == "iec_recommendation_submitted":
            rec_submitted_count += 1

    total_available = ready_count + under_review_count + rec_submitted_count

    # Fetch recent studies eligible for IEC review
    recent_query = (
        Study.query.filter(
            Study.status.in_([
                "ready_for_iec_review",
                "under_iec_review",
                "iec_recommendation_submitted",
            ])
        )
        .order_by(Study.updated_at.desc(), Study.created_at.desc())
        .limit(6)
        .all()
    )

    recent_studies = []
    for r in recent_query:
        docs = Document.query.filter_by(study_id=r.id, is_deleted=False).all()
        qc = (
            QualityCheck.query.filter_by(study_id=r.id)
            .order_by(QualityCheck.created_at.desc())
            .first()
        )
        reviews = load_study_reviews(r.study_id)
        latest_review = reviews[-1] if reviews else None

        recent_studies.append({
            "id": r.id,
            "study_id": r.study_id,
            "protocol_number": r.protocol_number,
            "title": r.title,
            "study_type": r.study_type,
            "study_design": r.study_design,
            "researcher_name": r.researcher.full_name if r.researcher else "Unknown",
            "status": r.status,
            "documents_count": len(docs),
            "verified_documents_count": sum(1 for d in docs if d.status == "verified"),
            "quality_score": qc.score if qc else None,
            "quality_status": qc.status if qc else "not_checked",
            "has_recommendation": latest_review is not None,
            "latest_recommendation": latest_review.get("recommendation") if latest_review else None,
            "updated_at": (r.updated_at or r.created_at).isoformat() if (r.updated_at or r.created_at) else None,
        })

    return {
        "total_available": total_available,
        "ready_for_review": ready_count,
        "under_review": under_review_count,
        "recommendations_submitted": rec_submitted_count,
        "recent_studies": recent_studies,
    }


def list_member_reviews(
    search: str = None,
    status_filter: str = None,
    sort_by: str = "newest",
) -> list[dict]:
    """
    List studies in the IEC Member review queue with search, filtering, and sorting.
    Exposes studies that are in:
      - ready_for_iec_review
      - under_iec_review
      - iec_recommendation_submitted
    """
    iec_lifecycle_statuses = [
        "ready_for_iec_review",
        "under_iec_review",
        "iec_recommendation_submitted",
    ]

    query = Study.query.filter(Study.status.in_(iec_lifecycle_statuses))

    if search:
        s_term = f"%{search.strip()}%"
        query = query.join(User, Study.researcher_id == User.id).filter(
            (Study.title.ilike(s_term))
            | (Study.study_id.ilike(s_term))
            | (User.full_name.ilike(s_term))
            | (User.email.ilike(s_term))
        )

    if status_filter and status_filter != "all":
        query = query.filter(Study.status == status_filter.strip().lower())

    if sort_by == "oldest":
        query = query.order_by(Study.created_at.asc())
    elif sort_by == "title":
        query = query.order_by(Study.title.asc())
    else:
        query = query.order_by(Study.updated_at.desc(), Study.created_at.desc())

    studies = query.all()
    results = []

    for s in studies:
        docs = Document.query.filter_by(study_id=s.id, is_deleted=False).all()
        qc = (
            QualityCheck.query.filter_by(study_id=s.id)
            .order_by(QualityCheck.created_at.desc())
            .first()
        )
        readiness = calculate_study_readiness(s)
        reviews = load_study_reviews(s.study_id)
        latest_review = reviews[-1] if reviews else None

        results.append({
            "id": s.id,
            "study_id": s.study_id,
            "protocol_number": s.protocol_number,
            "title": s.title,
            "short_title": s.short_title,
            "study_type": s.study_type,
            "study_design": s.study_design,
            "condition": s.condition,
            "ayurveda_intervention": s.ayurveda_intervention,
            "researcher": {
                "id": s.researcher.id if s.researcher else None,
                "full_name": s.researcher.full_name if s.researcher else "Unknown",
                "email": s.researcher.email if s.researcher else None,
            },
            "status": s.status,
            "documents_count": len(docs),
            "verified_documents_count": sum(1 for d in docs if d.status == "verified"),
            "quality_score": qc.score if qc else None,
            "quality_status": qc.status if qc else "not_checked",
            "readiness": readiness,
            "total_reviews": len(reviews),
            "latest_recommendation": latest_review.get("recommendation") if latest_review else None,
            "latest_review_date": latest_review.get("review_timestamp") if latest_review else None,
            "submission_date": (s.updated_at or s.created_at).isoformat() if (s.updated_at or s.created_at) else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    return results


def get_study_member_view(identifier: str | int, current_user: User = None) -> dict | None:
    """
    Fetch comprehensive IEC Member review dossier for a study:
      - Study Information & Core Metadata
      - Researcher Information
      - Full Structured Protocol
      - Submitted Research Documents with Verification Status
      - AI Quality Gate Analysis & Warnings
      - Readiness Assessment
      - Verification Checklist
      - Review History and Current Member's Existing Review
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return None

    # Protocol
    protocol = Protocol.query.filter_by(study_id=study.id).first()
    protocol_data = protocol.to_dict() if protocol else None

    # Documents
    documents = (
        Document.query.filter_by(study_id=study.id, is_deleted=False)
        .order_by(Document.created_at.desc())
        .all()
    )
    docs_list = [d.to_dict(include_versions=True) for d in documents]

    # Quality Gate
    qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )
    qc_data = qc.to_dict() if qc else {
        "status": "not_checked",
        "score": None,
        "summary": "AI Quality Gate evaluation has not been performed.",
        "risk_flags": [],
        "recommendations": [],
    }

    # Readiness & Checklist
    readiness = calculate_study_readiness(study)
    checklist = get_study_verification_checklist(study.id, documents)

    # Reviews from persistent JSON storage
    all_reviews = load_study_reviews(study.study_id)
    my_review = None
    if current_user:
        for rev in reversed(all_reviews):
            if rev.get("reviewer_id") == current_user.id:
                my_review = rev
                break

    latest_review = all_reviews[-1] if all_reviews else None

    return {
        "study": study.to_dict(),
        "researcher": {
            "id": study.researcher.id if study.researcher else None,
            "full_name": study.researcher.full_name if study.researcher else "Unknown",
            "email": study.researcher.email if study.researcher else None,
            "institution": "AYUSH Clinical Research Center",
        },
        "protocol": protocol_data,
        "documents": docs_list,
        "quality_gate": qc_data,
        "readiness": readiness,
        "verification_checklist": checklist,
        "review_domains": IEC_REVIEW_DOMAINS,
        "reviews": all_reviews,
        "my_review": my_review,
        "latest_review": latest_review,
    }


def start_study_member_review(identifier: str | int, member_user: User) -> tuple[bool, str, dict | None]:
    """
    Transition study from 'ready_for_iec_review' to 'under_iec_review'.
    Safe and idempotent: if already in 'under_iec_review' or 'iec_recommendation_submitted',
    succeeds without error.
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", None

    current_st = (study.status or "").lower().strip()

    # If it's already under review or recommendation submitted, keep state
    if current_st in {"under_iec_review", "iec_recommendation_submitted"}:
        return True, f"Study is currently in '{current_st}' status", study.to_dict()

    if current_st != "ready_for_iec_review":
        return False, f"Study status '{study.status}' is not ready for IEC review", None

    study.status = "under_iec_review"
    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error starting IEC review: {str(exc)}", None

    return True, "Study transitioned to 'under_iec_review' successfully", study.to_dict()


def submit_member_recommendation(
    identifier: str | int,
    member_user: User,
    payload: dict,
) -> tuple[bool, str, dict | None]:
    """
    Process and persist the IEC Member's review recommendation.
    Validates:
      - recommendation is one of ['recommend_approval', 'recommend_modification', 'recommend_rejection']
      - comments/summary is provided
    Transitions:
      - under_iec_review (or ready_for_iec_review) -> iec_recommendation_submitted
    Safety:
      - Does NOT approve, reject, or activate the study.
      - Preserves reviewer identity, study id, timestamp, sections, and notes.
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", None

    if not isinstance(payload, dict):
        return False, "Request payload must be a JSON object", None

    rec = payload.get("recommendation", "").strip().lower()
    if rec not in VALID_RECOMMENDATIONS:
        return (
            False,
            f"Invalid recommendation '{rec}'. Must be one of: {', '.join(sorted(VALID_RECOMMENDATIONS))}",
            None,
        )

    comments = (payload.get("comments") or payload.get("overall_comments") or "").strip()
    if not comments:
        return False, "Reviewer overall comments and observations are mandatory", None

    sections = payload.get("sections") or {}
    reviewer_notes = (payload.get("reviewer_notes") or "").strip()

    now_iso = datetime.utcnow().isoformat() + "Z"
    prev_status = study.status

    review_record = {
        "review_id": f"rev_{study.id}_{member_user.id}_{int(datetime.utcnow().timestamp())}",
        "study_id": study.study_id,
        "study_db_id": study.id,
        "reviewer_id": member_user.id,
        "reviewer_name": member_user.full_name,
        "reviewer_email": member_user.email,
        "recommendation": rec,
        "recommendation_label": {
            "recommend_approval": "Recommend Approval",
            "recommend_modification": "Recommend Modification",
            "recommend_rejection": "Recommend Rejection",
        }.get(rec, rec),
        "comments": comments,
        "sections": sections,
        "reviewer_notes": reviewer_notes,
        "review_timestamp": now_iso,
        "previous_status": prev_status,
        "resulting_status": "iec_recommendation_submitted",
    }

    # Persist in thread-safe JSON store
    try:
        updated_reviews = save_study_review(study.study_id, review_record)
    except Exception as exc:
        return False, f"Error persisting review record: {str(exc)}", None

    # Update Study workflow status to iec_recommendation_submitted
    study.status = "iec_recommendation_submitted"
    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error updating study status: {str(exc)}", None

    return True, "IEC Member recommendation submitted successfully", {
        "study": study.to_dict(),
        "review": review_record,
        "total_reviews": len(updated_reviews),
    }
