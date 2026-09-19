from datetime import datetime
from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from models.protocol import Protocol
from models.quality_check import QualityCheck
from models.regulatory import RegulatoryTracking
from services.iec_member_service import load_study_reviews
from services.iec_decision_service import load_study_decision
from services.regulatory_service import get_or_create_regulatory_tracking


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


def evaluate_activation_readiness(identifier: str | int) -> tuple[bool, str, int, dict | None]:
    """
    Perform rigorous multi-stage audit verification to determine if a study is:
      - 'activated': Already activated.
      - 'ready_for_activation': All 9 prerequisites pass.
      - 'activation_blocked': One or more prerequisite conditions fail.
    
    Verifies:
      1. Study Core Information: Metadata is complete.
      2. Protocol Completeness: Structured protocol exists with rationale & objectives.
      3. Required Documents: Mandatory protocol & informed consent documents are uploaded.
      4. Document Verification: All uploaded study documents have been verified by IEC Secretariat.
      5. AI Quality Gate: Quality Gate evaluated with score >= 70 and no blocking risk flags.
      6. IEC Member Review: Ethics committee member review completed.
      7. IEC Decision: Official binding IEC decision is recorded as 'Approved'.
      8. Regulatory & CTRI: CTRI registration recorded/approved and Regulatory clearance recorded.
      9. Risk & Safety: No blocking quality/risk conditions.
    """
    study = _lookup_study(identifier)
    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    if study.status == "activated":
        tracking = get_or_create_regulatory_tracking(study)
        return True, "Study is already activated.", 200, {
            "overall_status": "activated",
            "is_activated": True,
            "is_ready": False,
            "blocking_reasons": [],
            "study": study.to_dict(),
            "checklist": [],
        }

    checks = []
    blocking_reasons = []

    # 1. Study Core Information
    meta_ok = bool(
        study.title
        and study.study_type
        and study.study_design
        and study.research_objective
    )
    if meta_ok:
        checks.append({
            "code": "STUDY_METADATA",
            "name": "Study Core Information",
            "passed": True,
            "message": f"Study '{study.title}' has complete classification metadata.",
        })
    else:
        checks.append({
            "code": "STUDY_METADATA",
            "name": "Study Core Information",
            "passed": False,
            "message": "Study classification or research objectives are incomplete.",
        })
        blocking_reasons.append("Complete required study core metadata (title, type, design, objective).")

    # 2. Protocol Completeness
    protocol = Protocol.query.filter_by(study_id=study.id).first()
    protocol_ok = bool(
        protocol
        and protocol.rationale
        and protocol.primary_objective
        and protocol.protocol_title
    )
    if protocol_ok:
        checks.append({
            "code": "PROTOCOL_COMPLETE",
            "name": "Structured Protocol Completion",
            "passed": True,
            "message": f"Protocol v{protocol.protocol_version} is complete with rationale and objectives.",
        })
    else:
        checks.append({
            "code": "PROTOCOL_COMPLETE",
            "name": "Structured Protocol Completion",
            "passed": False,
            "message": "Structured protocol is missing or lacks mandatory clinical objectives.",
        })
        blocking_reasons.append("Protocol is incomplete. Define study rationale and primary objectives.")

    # 3. Required Documents Availability
    documents = Document.query.filter_by(study_id=study.id, is_deleted=False).all()
    doc_types = {d.document_type for d in documents}
    has_protocol_doc = "protocol" in doc_types
    has_consent_doc = "informed_consent" in doc_types
    docs_available = has_protocol_doc and has_consent_doc

    if docs_available:
        checks.append({
            "code": "DOCUMENTS_AVAILABLE",
            "name": "Mandatory Clinical Documents",
            "passed": True,
            "message": f"Clinical Study Protocol and Informed Consent Form are uploaded ({len(documents)} total documents).",
        })
    else:
        missing = []
        if not has_protocol_doc:
            missing.append("Clinical Study Protocol")
        if not has_consent_doc:
            missing.append("Informed Consent Form (ICF)")
        checks.append({
            "code": "DOCUMENTS_AVAILABLE",
            "name": "Mandatory Clinical Documents",
            "passed": False,
            "message": f"Missing mandatory document types: {', '.join(missing)}.",
        })
        blocking_reasons.append(f"Upload mandatory clinical documents: {', '.join(missing)}.")

    # 4. Document Verification Complete
    all_verified = bool(documents and all(d.status == "verified" for d in documents))
    if all_verified:
        checks.append({
            "code": "DOCUMENTS_VERIFIED",
            "name": "IEC Secretariat Document Verification",
            "passed": True,
            "message": f"All {len(documents)} uploaded study documents have been verified by the IEC Secretariat.",
        })
    else:
        unverified_count = sum(1 for d in documents if d.status != "verified")
        checks.append({
            "code": "DOCUMENTS_VERIFIED",
            "name": "IEC Secretariat Document Verification",
            "passed": False,
            "message": f"{unverified_count} document(s) have not yet been verified by the IEC Secretariat.",
        })
        blocking_reasons.append(f"IEC Secretariat must verify all {len(documents)} documents prior to activation.")

    # 5. AI Quality Gate Satisfied
    qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )
    # Passed if score >= 70 and not blocked/rejected
    qg_passed = bool(
        qc
        and qc.score is not None
        and qc.score >= 70
        and qc.status not in {"blocked", "rejected"}
    )
    if qg_passed:
        checks.append({
            "code": "QUALITY_GATE_SATISFIED",
            "name": "AI Quality Gate Clearance",
            "passed": True,
            "message": f"AI Quality Gate passed with score {qc.score}/100 ({qc.status}).",
        })
    else:
        score_desc = f"{qc.score}/100" if qc and qc.score is not None else "Not evaluated"
        checks.append({
            "code": "QUALITY_GATE_SATISFIED",
            "name": "AI Quality Gate Clearance",
            "passed": False,
            "message": f"AI Quality Gate score {score_desc} does not meet minimum threshold (>= 70) or is blocked.",
        })
        blocking_reasons.append("AI Quality Gate clearance requires a score of at least 70/100 without blocking flags.")

    # 6. IEC Member Review Complete
    member_reviews = load_study_reviews(study.study_id) or load_study_reviews(str(study.id))
    has_member_review = len(member_reviews) > 0 or study.status in {"iec_recommendation_submitted", "approved"}
    if has_member_review:
        checks.append({
            "code": "IEC_REVIEW_COMPLETE",
            "name": "Ethics Committee Member Review",
            "passed": True,
            "message": f"IEC Member review completed ({len(member_reviews)} review submission(s) on file).",
        })
    else:
        checks.append({
            "code": "IEC_REVIEW_COMPLETE",
            "name": "Ethics Committee Member Review",
            "passed": False,
            "message": "Study has not undergone ethics committee member scrutiny.",
        })
        blocking_reasons.append("IEC Member must submit ethical review recommendations.")

    # 7. Official IEC Decision is 'Approved'
    decision = load_study_decision(study.study_id) or load_study_decision(str(study.id))
    decision_outcome = (decision.get("decision") if decision else study.status or "").lower()
    is_iec_approved = decision_outcome == "approved" or study.status == "approved"

    if is_iec_approved:
        checks.append({
            "code": "IEC_DECISION_APPROVED",
            "name": "Official IEC Decision Approval",
            "passed": True,
            "message": "Official Institutional Ethics Committee Decision is 'Approved'.",
        })
    else:
        checks.append({
            "code": "IEC_DECISION_APPROVED",
            "name": "Official IEC Decision Approval",
            "passed": False,
            "message": f"IEC Decision is not approved (Current status: '{study.status}').",
        })
        blocking_reasons.append("An official IEC Decision of 'Approved' is mandatory before activation.")

    # 8. Regulatory & CTRI Tracking Requirements
    tracking = get_or_create_regulatory_tracking(study)
    ctri_status = (tracking.ctri_status or "Not Started").strip()
    has_ctri_reg = bool(tracking.ctri_reg_number or ctri_status in {"Approved/Registered", "Submitted"})

    reg_status = (tracking.regulatory_status or "Not Started").strip()
    has_reg_clearance = bool(
        reg_status in {"Approved/Registered", "Submitted"}
        or tracking.regulatory_reference_number
    )

    reg_ctri_satisfied = has_ctri_reg and has_reg_clearance

    if reg_ctri_satisfied:
        checks.append({
            "code": "REGULATORY_CTRI_SATISFIED",
            "name": "Regulatory & CTRI Tracking Clearance",
            "passed": True,
            "message": f"CTRI registration ({tracking.ctri_reg_number or ctri_status}) and regulatory clearance ({tracking.regulatory_reference_number or reg_status}) satisfied.",
        })
    else:
        missing_regs = []
        if not has_ctri_reg:
            missing_regs.append("CTRI registration number or status in 'Approved/Registered' / 'Submitted'")
        if not has_reg_clearance:
            missing_regs.append("Regulatory application reference or status in 'Approved/Registered' / 'Submitted'")
        checks.append({
            "code": "REGULATORY_CTRI_SATISFIED",
            "name": "Regulatory & CTRI Tracking Clearance",
            "passed": False,
            "message": f"Missing regulatory requirements: {'; '.join(missing_regs)}.",
        })
        blocking_reasons.append(f"Satisfy Regulatory and CTRI tracking: {'; '.join(missing_regs)}.")

    # 9. No Blocking Risk Flags
    risk_flags = qc.risk_flags if qc and qc.risk_flags else []
    has_blocking_risk = any(
        isinstance(rf, dict) and rf.get("severity") == "critical"
        for rf in risk_flags
    )
    if not has_blocking_risk:
        checks.append({
            "code": "RISK_FLAGS_CHECK",
            "name": "Patient Safety & Quality Risk Clearance",
            "passed": True,
            "message": "No critical patient safety risk or blocking protocol hazards detected.",
        })
    else:
        checks.append({
            "code": "RISK_FLAGS_CHECK",
            "name": "Patient Safety & Quality Risk Clearance",
            "passed": False,
            "message": "Critical risk flag detected by AI Quality Gate requiring resolution.",
        })
        blocking_reasons.append("Resolve critical risk flags identified by the AI Quality Gate.")

    is_ready = len(blocking_reasons) == 0
    overall_status = "ready_for_activation" if is_ready else "activation_blocked"

    readiness_data = {
        "overall_status": overall_status,
        "is_activated": False,
        "is_ready": is_ready,
        "study": study.to_dict(),
        "blocking_reasons": blocking_reasons,
        "checklist": checks,
        "passed_checks": sum(1 for c in checks if c["passed"]),
        "total_checks": len(checks),
    }

    return True, "Activation readiness evaluated successfully", 200, readiness_data


def activate_study(
    identifier: str | int,
    user: User,
    remarks: str = None,
) -> tuple[bool, str, int, dict | None]:
    """
    Execute official Study Activation.
    Enforces:
      1. Authorized role: Regulatory Admin (or Secretariat)
      2. Full validation of all 9 activation prerequisites
      3. Rejection if already activated or blocked
      4. Database status update: Study.status = 'activated'
      5. Audit recording in RegulatoryTracking
    """
    if user.role not in {"regulatory_admin", "iec_secretariat"}:
        return (
            False,
            "Access Denied: Only Regulatory Admins are authorized to activate clinical studies.",
            403,
            None,
        )

    study = _lookup_study(identifier)
    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    if study.status == "activated":
        return False, f"Study '{study.study_id}' is already in 'activated' status.", 409, None

    # Evaluate all prerequisites
    ok, msg, status_code, readiness = evaluate_activation_readiness(study.id)
    if not ok:
        return False, msg, status_code, None

    if not readiness["is_ready"]:
        reasons_str = "; ".join(readiness["blocking_reasons"])
        return (
            False,
            f"Cannot activate study: Prerequisites incomplete. Blocking items: {reasons_str}",
            400,
            readiness,
        )

    # Perform activation
    study.status = "activated"
    study.updated_at = datetime.utcnow()

    # Record in RegulatoryTracking audit trail
    tracking = get_or_create_regulatory_tracking(study)
    now_iso = datetime.utcnow().isoformat() + "Z"
    trail = list(tracking.audit_trail or [])
    trail.append({
        "timestamp": now_iso,
        "action": "STUDY_ACTIVATION",
        "activated_by": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "remarks": remarks or "Study verified and activated for clinical trial conduct and participant enrollment.",
        "previous_status": "approved",
        "new_status": "activated",
    })
    tracking.audit_trail = trail
    tracking.updated_by_id = user.id
    tracking.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error activating study: {str(exc)}", 500, None

    return True, f"Study '{study.study_id}' activated successfully! Participant enrollment is now unlocked.", 200, {
        "study": study.to_dict(),
        "activated_at": now_iso,
        "activated_by": {
            "id": user.id,
            "full_name": user.full_name,
            "role": user.role,
        },
    }
