from datetime import datetime
from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from models.protocol import Protocol
from models.quality_check import QualityCheck


MANDATORY_DOCUMENT_TYPES = [
    {
        "type": "protocol",
        "label": "Clinical Study Protocol",
        "description": "Full formal protocol detailing objectives, design, methodology, statistical considerations, and study organization.",
        "mandatory": True,
    },
    {
        "type": "informed_consent",
        "label": "Informed Consent Form (ICF)",
        "description": "Patient information sheet and informed consent documentation in English and local languages.",
        "mandatory": True,
    },
    {
        "type": "investigator_brochure",
        "label": "Investigator's Brochure (IB)",
        "description": "Compilation of clinical and non-clinical data on the investigational Ayurvedic formulation.",
        "mandatory": False,
    },
    {
        "type": "case_report_form",
        "label": "Case Report Form (CRF)",
        "description": "Standardized questionnaire or data collection tool designed to record protocol required information.",
        "mandatory": False,
    },
    {
        "type": "study_plan",
        "label": "Study Plan / Clinical Trial Agreement",
        "description": "Project implementation timeline, resource allocation, and institutional commitments.",
        "mandatory": False,
    },
    {
        "type": "other",
        "label": "Ethics & Regulatory Approvals / CTRI",
        "description": "Institutional clearances, investigator CVs, laboratory accreditations, and CTRI pre-registration.",
        "mandatory": False,
    },
]


def calculate_study_readiness(study: Study) -> dict:
    """
    Evaluate study completeness and verification state to classify
    'READY FOR IEC REVIEW' vs 'NOT READY'.
    
    Checks:
      1. Study metadata completeness
      2. Protocol presence & essential fields
      3. Required document presence (Protocol & Informed Consent)
      4. Document verification status (all uploaded documents must be 'verified')
      5. Quality Gate status (score >= 70, not blocked)
      6. Safety monitoring defined in protocol
    """
    checks = []
    missing_items = []
    correction_items = []

    # 1. Study Metadata Completeness
    meta_ok = bool(
        study.title
        and study.study_type
        and study.study_design
        and study.research_objective
    )
    if meta_ok:
        checks.append({
            "code": "STUDY_METADATA",
            "name": "Study Core Metadata",
            "status": "pass",
            "message": "Study title, type, design, and research objective are defined.",
        })
    else:
        checks.append({
            "code": "STUDY_METADATA",
            "name": "Study Core Metadata",
            "status": "fail",
            "message": "Missing core study metadata (title, type, design, or objective).",
        })
        missing_items.append("Complete required study core fields (title, study type, design, research objective).")

    # 2. Protocol Availability
    protocol = Protocol.query.filter_by(study_id=study.id).first()
    if protocol and protocol.rationale and protocol.primary_objective:
        checks.append({
            "code": "PROTOCOL_AVAILABLE",
            "name": "Structured Protocol",
            "status": "pass",
            "message": f"Structured Protocol v{protocol.protocol_version} is linked.",
        })
    else:
        checks.append({
            "code": "PROTOCOL_AVAILABLE",
            "name": "Structured Protocol",
            "status": "fail",
            "message": "No structured protocol found or protocol lacks rationale/primary objective.",
        })
        missing_items.append("Provide a completed structured protocol with rationale and primary objective.")

    # 3. Documents Availability & Mandatory Types
    documents = Document.query.filter_by(study_id=study.id, is_deleted=False).all()
    uploaded_types = {d.document_type for d in documents}

    has_protocol_doc = "protocol" in uploaded_types
    has_icf_doc = "informed_consent" in uploaded_types

    if has_protocol_doc and has_icf_doc:
        checks.append({
            "code": "MANDATORY_DOCS",
            "name": "Mandatory Documents Uploaded",
            "status": "pass",
            "message": "Mandatory documents (Protocol and Informed Consent Form) are present.",
        })
    else:
        missing_types = []
        if not has_protocol_doc:
            missing_types.append("Protocol Document")
        if not has_icf_doc:
            missing_types.append("Informed Consent Form (ICF)")
        checks.append({
            "code": "MANDATORY_DOCS",
            "name": "Mandatory Documents Uploaded",
            "status": "fail",
            "message": f"Missing mandatory document types: {', '.join(missing_types)}.",
        })
        missing_items.append(f"Upload mandatory documents: {', '.join(missing_types)}.")

    # 4. Document Verification Status
    if not documents:
        checks.append({
            "code": "DOC_VERIFICATION",
            "name": "Document Verification Status",
            "status": "fail",
            "message": "No documents uploaded for verification.",
        })
        missing_items.append("Upload study documents for Secretariat verification.")
    else:
        unverified = [d for d in documents if d.status not in {"verified"}]
        corrections = [d for d in documents if d.status in {"correction_required", "rejected"}]
        missing_docs = [d for d in documents if d.status == "missing"]

        if missing_docs:
            for m in missing_docs:
                missing_items.append(f"{m.original_filename} ({m.document_type}) is marked as missing/deficient.")
            checks.append({
                "code": "DOC_VERIFICATION",
                "name": "Document Verification Status",
                "status": "fail",
                "message": f"{len(missing_docs)} document(s) flagged as missing.",
            })
        elif corrections:
            for c in corrections:
                correction_items.append(f"{c.original_filename} ({c.document_type}) requires correction.")
            checks.append({
                "code": "DOC_VERIFICATION",
                "name": "Document Verification Status",
                "status": "fail",
                "message": f"{len(corrections)} document(s) have corrections required.",
            })
        elif unverified:
            checks.append({
                "code": "DOC_VERIFICATION",
                "name": "Document Verification Status",
                "status": "warning",
                "message": f"{len(unverified)} of {len(documents)} document(s) pending Secretariat verification.",
            })
            missing_items.append(f"Complete Secretariat verification for {len(unverified)} document(s).")
        else:
            checks.append({
                "code": "DOC_VERIFICATION",
                "name": "Document Verification Status",
                "status": "pass",
                "message": f"All {len(documents)} document(s) have been verified by the Secretariat.",
            })

    # 5. AI Quality Gate Status
    latest_qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )

    if latest_qc and latest_qc.score is not None:
        if latest_qc.status != "blocked" and latest_qc.score >= 70:
            checks.append({
                "code": "AI_QUALITY_GATE",
                "name": "AI Quality Gate",
                "status": "pass",
                "message": f"AI Quality Gate passed with score {latest_qc.score}/100 ({latest_qc.status}).",
            })
        else:
            checks.append({
                "code": "AI_QUALITY_GATE",
                "name": "AI Quality Gate",
                "status": "fail",
                "message": f"AI Quality Gate score is {latest_qc.score}/100 with status '{latest_qc.status}'.",
            })
            missing_items.append(f"Resolve AI Quality Gate blocking issues (current score: {latest_qc.score}/100).")
    else:
        checks.append({
            "code": "AI_QUALITY_GATE",
            "name": "AI Quality Gate",
            "status": "warning",
            "message": "AI Quality Gate evaluation has not been executed yet.",
        })
        missing_items.append("Execute AI Quality Gate validation before IEC review.")

    # 6. Safety Monitoring Definition
    if protocol and (protocol.safety_monitoring or protocol.adverse_event_reporting):
        checks.append({
            "code": "SAFETY_MONITORING",
            "name": "Safety Monitoring Procedures",
            "status": "pass",
            "message": "Safety monitoring and adverse event reporting procedures defined.",
        })
    else:
        checks.append({
            "code": "SAFETY_MONITORING",
            "name": "Safety Monitoring Procedures",
            "status": "warning",
            "message": "Safety monitoring procedures should be specified in protocol.",
        })

    # Calculate overall readiness
    passed_count = sum(1 for c in checks if c["status"] == "pass")
    total_checks = len(checks)
    score_percentage = int((passed_count / total_checks) * 100) if total_checks else 0

    is_ready = bool(
        meta_ok
        and (protocol is not None)
        and (has_protocol_doc and has_icf_doc)
        and (len(documents) > 0)
        and (len(correction_items) == 0)
        and (len(missing_docs) == 0)
        and (sum(1 for d in documents if d.status != "verified") == 0)
        and (latest_qc and latest_qc.status != "blocked" and (latest_qc.score or 0) >= 70)
    )

    return {
        "status": "READY FOR IEC REVIEW" if is_ready else "NOT READY",
        "is_ready": is_ready,
        "score": score_percentage,
        "checks": checks,
        "missing_items": missing_items,
        "correction_items": correction_items,
        "documents_count": len(documents),
        "verified_documents_count": sum(1 for d in documents if d.status == "verified"),
    }


def get_secretariat_dashboard_metrics() -> dict:
    """
    Aggregate live KPI statistics for the IEC Secretariat dashboard.
    Queries real study, document, and quality check records.
    """
    all_studies = Study.query.all()
    total_studies = len(all_studies)

    # 1. Total submitted studies: studies not in draft
    submitted_studies = [s for s in all_studies if s.status != "draft"]
    total_submitted = len(submitted_studies)

    # 2. Counts
    studies_awaiting_verification = 0
    total_docs_pending_verification = 0
    verification_completed_count = 0
    ready_for_iec_count = 0
    correction_requested_count = 0

    for s in all_studies:
        docs = Document.query.filter_by(study_id=s.id, is_deleted=False).all()
        has_corrections = any(d.status in {"correction_required", "rejected"} for d in docs)
        has_missing = any(d.status == "missing" for d in docs)
        pending_docs = [d for d in docs if d.status in {"uploaded", "pending_verification"}]
        total_docs_pending_verification += len(pending_docs)
        all_verified = bool(docs and all(d.status == "verified" for d in docs))

        if s.status == "correction_requested" or has_corrections or has_missing:
            correction_requested_count += 1
        elif s.status == "ready_for_iec_review":
            ready_for_iec_count += 1
        elif all_verified:
            verification_completed_count += 1
            readiness = calculate_study_readiness(s)
            if readiness["is_ready"]:
                ready_for_iec_count += 1
        elif len(pending_docs) > 0 or s.status in {"submitted", "ready_for_ai_check"}:
            studies_awaiting_verification += 1

    # Recent submissions (ordered by updated_at or created_at desc)
    recent_records = (
        Study.query.order_by(Study.updated_at.desc(), Study.created_at.desc())
        .limit(6)
        .all()
    )

    recent_submissions = []
    for r in recent_records:
        docs = Document.query.filter_by(study_id=r.id, is_deleted=False).all()
        qc = (
            QualityCheck.query.filter_by(study_id=r.id)
            .order_by(QualityCheck.created_at.desc())
            .first()
        )
        readiness = calculate_study_readiness(r)

        recent_submissions.append({
            "id": r.id,
            "study_id": r.study_id,
            "protocol_number": r.protocol_number,
            "title": r.title,
            "researcher_name": r.researcher.full_name if r.researcher else "Unknown",
            "researcher_email": r.researcher.email if r.researcher else None,
            "study_type": r.study_type,
            "status": r.status,
            "documents_count": len(docs),
            "verified_count": sum(1 for d in docs if d.status == "verified"),
            "quality_score": qc.score if qc else None,
            "quality_status": qc.status if qc else "not_checked",
            "readiness": readiness["status"],
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        })

    return {
        "total_studies": total_studies,
        "total_submitted": total_submitted,
        "studies_awaiting_verification": studies_awaiting_verification,
        "pending_document_verification": total_docs_pending_verification,
        "documents_pending_verification": total_docs_pending_verification,
        "verification_completed": verification_completed_count,
        "ready_for_iec_review": ready_for_iec_count,
        "studies_requiring_correction": correction_requested_count,
        "correction_requested": correction_requested_count,
        "recent_submissions": recent_submissions,
    }


def list_secretariat_submissions(
    search: str = None,
    status_filter: str = None,
    readiness_filter: str = None,
    doc_filter: str = None,
    sort_by: str = "newest",
) -> list[dict]:
    """
    List submissions for the Submission Queue with search, filtering, and sorting.
    """
    query = Study.query

    if search:
        s_term = f"%{search.strip()}%"
        query = query.join(User, Study.researcher_id == User.id).filter(
            (Study.title.ilike(s_term))
            | (Study.study_id.ilike(s_term))
            | (User.full_name.ilike(s_term))
            | (User.email.ilike(s_term))
        )

    if status_filter and status_filter != "all":
        query = query.filter(Study.status == status_filter.strip())

    if sort_by == "oldest":
        query = query.order_by(Study.created_at.asc())
    elif sort_by == "title":
        query = query.order_by(Study.title.asc())
    else:
        query = query.order_by(Study.created_at.desc())

    studies = query.all()
    results = []

    for study in studies:
        docs = Document.query.filter_by(study_id=study.id, is_deleted=False).all()
        qc = (
            QualityCheck.query.filter_by(study_id=study.id)
            .order_by(QualityCheck.created_at.desc())
            .first()
        )
        readiness = calculate_study_readiness(study)

        # Apply readiness filter in-memory if requested
        if readiness_filter and readiness_filter != "all":
            if readiness_filter == "ready" and not readiness["is_ready"]:
                continue
            if readiness_filter == "not_ready" and readiness["is_ready"]:
                continue

        # Apply document verification filter in-memory
        if doc_filter and doc_filter != "all":
            all_v = bool(docs and all(d.status == "verified" for d in docs))
            has_p = any(d.status in {"uploaded", "pending_verification"} for d in docs)
            has_c = any(d.status in {"correction_required", "rejected"} for d in docs)

            if doc_filter == "verified" and not all_v:
                continue
            if doc_filter == "pending" and not has_p:
                continue
            if doc_filter == "correction" and not has_c:
                continue

        doc_status_summary = {
            "total": len(docs),
            "verified": sum(1 for d in docs if d.status == "verified"),
            "pending": sum(1 for d in docs if d.status in {"uploaded", "pending_verification"}),
            "correction_required": sum(1 for d in docs if d.status in {"correction_required", "rejected"}),
        }

        results.append({
            "id": study.id,
            "study_id": study.study_id,
            "protocol_number": study.protocol_number,
            "title": study.title,
            "short_title": study.short_title,
            "researcher": {
                "id": study.researcher.id if study.researcher else None,
                "full_name": study.researcher.full_name if study.researcher else "Unknown",
                "email": study.researcher.email if study.researcher else None,
            },
            "study_type": study.study_type,
            "study_design": study.study_design,
            "condition": study.condition,
            "ayurveda_intervention": study.ayurveda_intervention,
            "submission_date": (study.updated_at or study.created_at).isoformat(),
            "workflow_status": study.status,
            "document_status": doc_status_summary,
            "quality_gate": {
                "status": qc.status if qc else "not_checked",
                "score": qc.score if qc else None,
            },
            "readiness": readiness,
            "created_at": study.created_at.isoformat() if study.created_at else None,
        })

    return results


def get_study_secretariat_view(identifier: str | int) -> dict | None:
    """
    Fetch the complete Secretariat review view for a study:
    Includes Study Information, Researcher Information, Protocol, Documents,
    Quality Gate evaluation, and Readiness assessment.
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return None

    # Researcher metadata
    researcher_data = {
        "id": study.researcher.id if study.researcher else None,
        "full_name": study.researcher.full_name if study.researcher else "Unknown",
        "email": study.researcher.email if study.researcher else None,
        "role": study.researcher.role if study.researcher else None,
        "institution": "AYUSH Clinical Research Center",
    }

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

    # Latest Quality Check
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
        "recommendations": [],
    }

    # Readiness
    readiness = calculate_study_readiness(study)

    # Verification checklist
    checklist = get_study_verification_checklist(study.id, documents)

    return {
        "study": study.to_dict(),
        "researcher": researcher_data,
        "protocol": protocol_data,
        "documents": docs_list,
        "quality_gate": qc_data,
        "readiness": readiness,
        "verification_checklist": checklist,
    }


def get_study_verification_checklist(study_id: int, documents: list = None) -> list[dict]:
    """
    Evaluate checklist of mandatory and recommended document types against uploaded documents.
    """
    if documents is None:
        documents = Document.query.filter_by(study_id=study_id, is_deleted=False).all()

    doc_by_type = {}
    for d in documents:
        doc_by_type.setdefault(d.document_type, []).append(d)

    checklist = []
    for item in MANDATORY_DOCUMENT_TYPES:
        t = item["type"]
        matching = doc_by_type.get(t, [])
        is_uploaded = len(matching) > 0
        latest_doc = matching[0] if is_uploaded else None

        item_status = "missing"
        if is_uploaded:
            if latest_doc.status == "verified":
                item_status = "verified"
            elif latest_doc.status in {"correction_required", "rejected"}:
                item_status = "correction_required"
            elif latest_doc.status == "missing":
                item_status = "missing"
            else:
                item_status = "pending_verification"

        checklist.append({
            "document_type": t,
            "label": item["label"],
            "description": item["description"],
            "mandatory": item["mandatory"],
            "is_uploaded": is_uploaded,
            "uploaded_count": len(matching),
            "document": latest_doc.to_dict() if latest_doc else None,
            "verification_status": item_status,
        })

    return checklist


def verify_study_document(document_id: int, secretariat_user: User, remarks: str = None) -> tuple[bool, str, dict | None]:
    """
    Mark a document as 'verified' by the authenticated Secretariat user.
    Records audit remarks in document.description with user and timestamp.
    """
    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return False, f"Document #{document_id} not found", None

    study = db.session.get(Study, document.study_id)
    if not study:
        return False, "Associated study not found", None

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    clean_remarks = (remarks or "").strip()
    audit_entry = f"[VERIFIED by IEC Secretariat ({secretariat_user.full_name}, ID #{secretariat_user.id}) on {now_str}]"
    if clean_remarks:
        audit_entry += f" Remarks: {clean_remarks}"

    # Append to existing description
    if document.description:
        document.description = f"{document.description}\n---\n{audit_entry}"
    else:
        document.description = audit_entry

    document.status = "verified"
    document.updated_at = datetime.utcnow()

    # If all study documents are now verified, update study status if currently pending
    sibling_docs = Document.query.filter_by(study_id=study.id, is_deleted=False).all()
    all_verified = all(d.status == "verified" for d in sibling_docs if d.id != document.id)
    if all_verified:
        readiness = calculate_study_readiness(study)
        if readiness["is_ready"]:
            study.status = "ready_for_iec_review"
        else:
            study.status = "verification_completed"
        study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error verifying document: {str(exc)}", None

    return True, "Document verified successfully", document.to_dict()


def request_document_correction(
    document_id: int,
    secretariat_user: User,
    reason: str,
    remarks: str = None,
    reject: bool = False,
) -> tuple[bool, str, dict | None]:
    """
    Mark a document as requiring correction or rejected.
    Records audit trail and updates study status to 'correction_requested'.
    """
    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return False, f"Document #{document_id} not found", None

    study = db.session.get(Study, document.study_id)
    if not study:
        return False, "Associated study not found", None

    if not reason or not reason.strip():
        return False, "Correction reason is mandatory", None

    new_status = "rejected" if reject else "correction_required"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    audit_entry = (
        f"[{new_status.upper()} by IEC Secretariat ({secretariat_user.full_name}, ID #{secretariat_user.id}) on {now_str}]\n"
        f"Reason: {reason.strip()}"
    )
    if remarks and remarks.strip():
        audit_entry += f"\nRemarks: {remarks.strip()}"

    if document.description:
        document.description = f"{document.description}\n---\n{audit_entry}"
    else:
        document.description = audit_entry

    document.status = new_status
    document.updated_at = datetime.utcnow()

    # Update Study workflow status
    study.status = "correction_requested"
    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error requesting correction: {str(exc)}", None

    return True, f"Document marked as '{new_status}' and study status updated to 'correction_requested'", document.to_dict()


def mark_document_missing(
    document_id: int,
    secretariat_user: User,
    remarks: str = None,
) -> tuple[bool, str, dict | None]:
    """
    Mark a document as 'missing' / deficient by the Secretariat.
    Records audit remarks and updates study status to 'correction_requested'.
    """
    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return False, f"Document #{document_id} not found", None

    study = db.session.get(Study, document.study_id)
    if not study:
        return False, "Associated study not found", None

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    clean_remarks = (remarks or "Document marked as missing / deficient by IEC Secretariat").strip()
    audit_entry = (
        f"[MISSING flagged by IEC Secretariat ({secretariat_user.full_name}, ID #{secretariat_user.id}) on {now_str}]\n"
        f"Remarks: {clean_remarks}"
    )

    if document.description:
        document.description = f"{document.description}\n---\n{audit_entry}"
    else:
        document.description = audit_entry

    document.status = "missing"
    document.updated_at = datetime.utcnow()

    study.status = "correction_requested"
    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error marking document as missing: {str(exc)}", None

    return True, "Document flagged as missing successfully", document.to_dict()


def submit_study_to_iec_review(
    identifier: str | int,
    secretariat_user: User,
    remarks: str = None,
) -> tuple[bool, str, dict | None]:
    """
    Transition a study from verification to IEC review stage ('ready_for_iec_review').
    Validates that:
      - Core study metadata and protocol exist
      - Mandatory documents (Protocol, Informed Consent) exist and are verified
      - No documents are pending, missing, or require correction
      - Quality Gate is passed or reviewed
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", None

    readiness = calculate_study_readiness(study)
    if not readiness["is_ready"]:
        issues = readiness.get("missing_items", []) + readiness.get("correction_items", [])
        issues_summary = "; ".join(issues) if issues else "Verification criteria not met"
        return False, f"Cannot submit to IEC Review: {issues_summary}", None

    study.status = "ready_for_iec_review"
    study.updated_at = datetime.utcnow()

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return False, f"Database error submitting to IEC Review: {str(exc)}", None

    return True, "Study successfully submitted to IEC Review stage", {
        "study_id": study.study_id,
        "title": study.title,
        "status": study.status,
        "readiness": readiness,
        "auditor": secretariat_user.full_name,
        "submitted_at": now_str,
    }
