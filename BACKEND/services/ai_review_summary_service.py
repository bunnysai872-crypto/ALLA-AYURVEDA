"""
ALLA AYURVEDA — AI REVIEW SUMMARY SERVICE
Isolated, Read-Only Service for Synthesizing Structured Clinical & Ethical Review Dossiers.

CRITICAL INVARIANTS:
1. READ-ONLY: Never writes to the database, never alters study status or records.
2. NO FABRICATION: Never invents clinical findings, safety data, or reviewer remarks.
   Missing items are explicitly marked: "Not available in the current study dossier."
3. TRANSPARENCY: Clearly designated as "AI-Assisted Review Summary" generated from
   available structured sources.
4. FINAL DECISION PROTECTION: Does NOT make final committee decisions. Only echoes
   the recorded IEC Member recommendation.
"""

from datetime import datetime
from extensions import db
from models.study import Study
from models.document import Document
from models.protocol import Protocol
from models.quality_check import QualityCheck
from services.iec_secretariat_service import (
    calculate_study_readiness,
    get_study_verification_checklist,
)
from services.iec_member_service import (
    load_study_reviews,
    IEC_REVIEW_DOMAINS,
)


def _format_val(val, fallback="Not available in the current study dossier."):
    """Format string or numeric value; return explicit non-fabricated fallback if missing."""
    if val is None:
        return fallback
    s = str(val).strip()
    return s if s else fallback


def generate_ai_review_summary(identifier: str | int) -> tuple[bool, str, int, dict | None]:
    """
    Synthesize an AI-Assisted Review Summary by aggregating:
      1. Study Core Metadata
      2. Structured Protocol Data
      3. Research Documents & Secretariat Verification Status
      4. AI Quality Gate Compliance & Risk Findings
      5. IEC Member Ethical Review & Recommendation
    
    Returns:
      (is_success, message, http_status_code, summary_dict)
    """
    # 1. Study Resolution
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return False, f"Study '{identifier}' not found", 404, None

    # 2. Check IEC Member Review availability
    # The summary module operates only after an IEC Member recommendation has been submitted
    reviews = load_study_reviews(study.study_id)
    if not reviews:
        return (
            False,
            "IEC recommendation not yet available. An IEC Member review must be submitted before the AI Review Summary can be synthesized.",
            409,
            None,
        )

    latest_review = reviews[-1]

    # 3. Read Protocol
    protocol = Protocol.query.filter_by(study_id=study.id).first()

    # 4. Read Documents & Verification
    documents = (
        Document.query.filter_by(study_id=study.id, is_deleted=False)
        .order_by(Document.created_at.desc())
        .all()
    )
    verification_checklist = get_study_verification_checklist(study.id, documents)
    readiness = calculate_study_readiness(study)

    # 5. Read Quality Gate
    qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )

    # --------------------------------------------------------------------------
    # A. STUDY OVERVIEW
    # --------------------------------------------------------------------------
    study_overview = {
        "study_id": study.study_id,
        "title": _format_val(study.title),
        "short_title": _format_val(study.short_title),
        "study_type": _format_val(study.study_type),
        "study_design": _format_val(study.study_design.replace("_", " ") if study.study_design else None),
        "condition": _format_val(study.condition),
        "ayurveda_intervention": _format_val(study.ayurveda_intervention),
        "research_objective": _format_val(study.research_objective),
        "primary_objective": _format_val(study.primary_objective),
        "secondary_objectives": _format_val(study.secondary_objectives),
        "principal_researcher": {
            "full_name": _format_val(study.researcher.full_name if study.researcher else None),
            "email": _format_val(study.researcher.email if study.researcher else None),
            "institution": "AYUSH Clinical Research Center",
        },
        "sample_size": study.estimated_sample_size if study.estimated_sample_size is not None else "Not available in the current study dossier.",
        "study_duration": _format_val(study.study_duration),
        "target_population": _format_val(study.target_population),
        "current_status": study.status,
        "created_at": study.created_at.isoformat() if study.created_at else None,
    }

    # --------------------------------------------------------------------------
    # B. PROTOCOL SUMMARY
    # --------------------------------------------------------------------------
    if protocol:
        protocol_summary = {
            "protocol_available": True,
            "protocol_version": _format_val(protocol.protocol_version),
            "protocol_title": _format_val(protocol.protocol_title or study.title),
            "protocol_date": _format_val(protocol.protocol_date),
            "background_and_rationale": _format_val(protocol.rationale or protocol.background),
            "objectives": {
                "primary": _format_val(protocol.primary_objective or study.primary_objective),
                "secondary": _format_val(protocol.secondary_objectives or study.secondary_objectives),
            },
            "study_design": {
                "type": _format_val(protocol.study_type or study.study_type),
                "design": _format_val(protocol.study_design or study.study_design),
                "phase": _format_val(protocol.study_phase),
                "randomization": _format_val(protocol.randomization),
                "blinding": _format_val(protocol.blinding),
                "control_type": _format_val(protocol.control_type),
            },
            "participants": {
                "target_population": _format_val(protocol.target_population or study.target_population),
                "sample_size": protocol.sample_size or study.estimated_sample_size or "Not available in the current study dossier.",
                "age_range": f"{protocol.minimum_age or 'Min N/A'} to {protocol.maximum_age or 'Max N/A'} years" if (protocol.minimum_age or protocol.maximum_age) else "Not available in the current study dossier.",
                "gender_criteria": _format_val(protocol.gender_criteria),
            },
            "eligibility_criteria": {
                "inclusion": _format_val(protocol.inclusion_criteria),
                "exclusion": _format_val(protocol.exclusion_criteria),
            },
            "intervention": {
                "name": _format_val(protocol.intervention_name or study.ayurveda_intervention),
                "description": _format_val(protocol.intervention_description),
                "dosage": _format_val(protocol.dosage),
                "route": _format_val(protocol.route),
                "frequency": _format_val(protocol.frequency),
                "duration": _format_val(protocol.intervention_duration or protocol.study_duration or study.study_duration),
            },
            "outcomes": {
                "primary": _format_val(protocol.primary_outcomes),
                "secondary": _format_val(protocol.secondary_outcomes),
            },
            "safety_procedures": {
                "monitoring": _format_val(protocol.safety_monitoring),
                "adverse_event_reporting": _format_val(protocol.adverse_event_reporting),
            },
        }
    else:
        protocol_summary = {
            "protocol_available": False,
            "note": "Structured protocol record is not available in the current study dossier.",
            "background_and_rationale": "Not available in the current study dossier.",
            "objectives": {"primary": "Not available in the current study dossier.", "secondary": "Not available in the current study dossier."},
            "study_design": {"type": "Not available in the current study dossier.", "design": "Not available in the current study dossier."},
            "participants": {"target_population": "Not available in the current study dossier.", "sample_size": "Not available in the current study dossier."},
            "eligibility_criteria": {"inclusion": "Not available in the current study dossier.", "exclusion": "Not available in the current study dossier."},
            "intervention": {"name": "Not available in the current study dossier.", "dosage": "Not available in the current study dossier."},
            "outcomes": {"primary": "Not available in the current study dossier.", "secondary": "Not available in the current study dossier."},
            "safety_procedures": {"monitoring": "Not available in the current study dossier.", "adverse_event_reporting": "Not available in the current study dossier."},
        }

    # --------------------------------------------------------------------------
    # C. DOCUMENT READINESS
    # --------------------------------------------------------------------------
    total_docs = len(documents)
    verified_docs = sum(1 for d in documents if d.status == "verified")
    pending_docs = sum(1 for d in documents if d.status in {"uploaded", "pending_verification"})
    correction_docs = sum(1 for d in documents if d.status == "correction_required")
    rejected_docs = sum(1 for d in documents if d.status == "rejected")

    # Mandatory check
    doc_types_uploaded = {d.document_type for d in documents}
    has_protocol_doc = "protocol" in doc_types_uploaded
    has_icf_doc = "informed_consent" in doc_types_uploaded
    mandatory_ready = has_protocol_doc and has_icf_doc and (verified_docs >= 2)

    doc_readiness = {
        "total_documents": total_docs,
        "verified_count": verified_docs,
        "pending_count": pending_docs,
        "correction_required_count": correction_docs,
        "rejected_count": rejected_docs,
        "mandatory_documents_present": has_protocol_doc and has_icf_doc,
        "mandatory_documents_verified": mandatory_ready,
        "overall_readiness_status": readiness.get("status", "NOT READY"),
        "readiness_score": readiness.get("score", 0),
        "checklist": verification_checklist,
        "documents_catalog": [
            {
                "id": d.id,
                "name": d.original_filename,
                "document_type": d.document_type,
                "status": d.status,
                "version": d.current_version,
            }
            for d in documents
        ],
    }

    # --------------------------------------------------------------------------
    # D. QUALITY GATE SUMMARY
    # --------------------------------------------------------------------------
    if qc:
        quality_gate_summary = {
            "evaluated": True,
            "score": qc.score,
            "status": qc.status,
            "risk_level": "High" if qc.status in {"blocked", "issues_found"} else ("Medium" if qc.status == "passed_with_warnings" else "Low"),
            "summary": _format_val(qc.summary),
            "completeness_findings": qc.completeness_data or {"status": "not_checked", "issues": []},
            "consistency_findings": qc.consistency_data or {"status": "not_checked", "issues": []},
            "cross_document_findings": qc.cross_document_data or {"status": "not_checked", "issues": []},
            "risk_flags": qc.risk_flags or [],
            "recommendations": qc.recommendations or [],
        }
    else:
        quality_gate_summary = {
            "evaluated": False,
            "score": None,
            "status": "not_evaluated",
            "risk_level": "Unknown",
            "summary": "AI Quality Gate evaluation has not been performed on this study.",
            "completeness_findings": {"status": "not_checked", "issues": []},
            "consistency_findings": {"status": "not_checked", "issues": []},
            "cross_document_findings": {"status": "not_checked", "issues": []},
            "risk_flags": [],
            "recommendations": [],
        }

    # --------------------------------------------------------------------------
    # E. IEC MEMBER REVIEW
    # --------------------------------------------------------------------------
    iec_member_review = {
        "reviewer": {
            "id": latest_review.get("reviewer_id"),
            "full_name": latest_review.get("reviewer_name") or "IEC Member",
            "email": latest_review.get("reviewer_email") or "Not available",
        },
        "review_date": latest_review.get("review_timestamp"),
        "recommendation": latest_review.get("recommendation"),
        "recommendation_label": latest_review.get("recommendation_label") or latest_review.get("recommendation"),
        "comments": latest_review.get("comments") or "No general comments recorded.",
        "reviewer_notes": latest_review.get("reviewer_notes") or "None recorded.",
        "domains": latest_review.get("sections") or {},
        "total_member_reviews": len(reviews),
    }

    # --------------------------------------------------------------------------
    # F. ETHICAL RISK SUMMARY (Synthesized from existing records only)
    # --------------------------------------------------------------------------
    sections = latest_review.get("sections") or {}

    def _extract_domain_note(key, default_label):
        d = sections.get(key)
        if d and isinstance(d, dict):
            rating = d.get("rating", "satisfactory")
            notes = d.get("notes", "").strip()
            if notes:
                return f"[{rating.replace('_', ' ').upper()}] {notes}"
            return f"[{rating.replace('_', ' ').upper()}] No specific notes recorded."
        return "No specific ethical notes recorded in the current study dossier."

    ethical_risk_summary = {
        "participant_safety": {
            "domain_evaluation": _extract_domain_note("safety_monitoring", "Safety Monitoring"),
            "protocol_provisions": _format_val(protocol.safety_monitoring if protocol else None),
            "identified_risks": [f for f in (qc.risk_flags or []) if any(k in str(f).lower() for k in ("safety", "risk", "adverse", "dose"))] if qc else [],
        },
        "informed_consent": {
            "domain_evaluation": _extract_domain_note("informed_consent", "Informed Consent"),
            "document_status": "Verified by Secretariat" if any(d.document_type == "informed_consent" and d.status == "verified" for d in documents) else "Pending or not verified",
        },
        "confidentiality": {
            "domain_evaluation": _extract_domain_note("confidentiality_data", "Confidentiality & Data Protection"),
        },
        "risk_benefit": {
            "domain_evaluation": _extract_domain_note("risk_benefit", "Risk-Benefit Assessment"),
        },
        "methodology": {
            "domain_evaluation": _extract_domain_note("study_design", "Study Design & Methodology"),
            "scientific_validity": _extract_domain_note("scientific_validity", "Scientific Validity"),
        },
        "intervention": {
            "domain_evaluation": _extract_domain_note("intervention_regimen", "Ayurvedic Intervention & Regimen"),
            "regimen_specified": bool(protocol and protocol.dosage),
        },
        "other_ethical_concerns": {
            "domain_evaluation": _extract_domain_note("ethical_considerations", "Ethical Considerations"),
            "reviewer_notes": latest_review.get("reviewer_notes") or "No confidential committee notes recorded.",
        },
    }

    # --------------------------------------------------------------------------
    # G. KEY STRENGTHS (Derived strictly from available verified data)
    # --------------------------------------------------------------------------
    strengths = []
    if mandatory_ready:
        strengths.append("Mandatory regulatory documents (Clinical Study Protocol and Informed Consent Form) are present and verified by the IEC Secretariat.")
    elif has_protocol_doc and has_icf_doc:
        strengths.append("Mandatory document types (Protocol and Informed Consent Form) are uploaded in the dossier.")

    if protocol and protocol.rationale:
        strengths.append("Structured clinical protocol includes defined scientific rationale grounded in Ayurvedic and clinical research objectives.")

    if protocol and (protocol.safety_monitoring or protocol.adverse_event_reporting):
        strengths.append("Safety monitoring procedures and adverse event reporting mechanisms are formally articulated in the protocol.")

    if qc and qc.score and qc.score >= 70:
        strengths.append(f"AI Quality Gate evaluation passed with compliance score of {qc.score}/100.")

    if latest_review.get("recommendation") == "recommend_approval":
        strengths.append(f"IEC Member ({latest_review.get('reviewer_name')}) recommended Approval with affirmative findings across clinical review domains.")

    if not strengths:
        strengths.append("Not available in the current study dossier.")

    # --------------------------------------------------------------------------
    # H. KEY CONCERNS (Derived strictly from recorded flags & cautionary notes)
    # --------------------------------------------------------------------------
    concerns = []
    if pending_docs > 0:
        concerns.append(f"{pending_docs} document(s) remain pending formal Secretariat verification.")
    if correction_docs > 0:
        concerns.append(f"{correction_docs} document(s) have Secretariat correction requests pending investigator resubmission.")
    if rejected_docs > 0:
        concerns.append(f"{rejected_docs} document(s) were rejected during verification.")

    if qc and qc.risk_flags:
        for rf in qc.risk_flags:
            msg = rf if isinstance(rf, str) else rf.get("message", str(rf))
            concerns.append(f"Quality Gate Risk: {msg}")

    # Inspect reviewer domain ratings for concerns
    for d_key, d_val in sections.items():
        if isinstance(d_val, dict):
            r = d_val.get("rating")
            if r in {"minor_concerns", "major_concerns", "not_acceptable"}:
                d_label = next((item["label"] for item in IEC_REVIEW_DOMAINS if item["key"] == d_key), d_key)
                notes = d_val.get("notes", "").strip()
                concerns.append(f"IEC Reviewer Caution [{d_label} - {r.replace('_', ' ').title()}]: {notes or 'No specific notes provided.'}")

    if latest_review.get("recommendation") == "recommend_modification":
        concerns.append(f"IEC Member filed 'Recommend Modification': {latest_review.get('comments')}")
    elif latest_review.get("recommendation") == "recommend_rejection":
        concerns.append(f"IEC Member filed 'Recommend Rejection': {latest_review.get('comments')}")

    if not concerns:
        concerns.append("None identified in the current study dossier.")

    # --------------------------------------------------------------------------
    # I. REQUIRED FOLLOW-UP (Derived strictly from actionable findings)
    # --------------------------------------------------------------------------
    follow_ups = []
    if correction_docs > 0:
        follow_ups.append("Investigator must address Secretariat document corrections and upload revised versions.")

    if qc and qc.recommendations:
        for rec in qc.recommendations:
            rec_text = rec if isinstance(rec, str) else rec.get("text", str(rec))
            follow_ups.append(f"AI Quality Recommendation: {rec_text}")

    if latest_review.get("recommendation") in {"recommend_modification", "recommend_rejection"}:
        follow_ups.append(f"Address reviewer feedback prior to committee consensus: {latest_review.get('comments')}")

    if not follow_ups:
        follow_ups.append("No pending follow-up actions identified in the current study dossier.")

    # --------------------------------------------------------------------------
    # J. OVERALL REVIEW SNAPSHOT (Neutral, Assistive, No Final Decision)
    # --------------------------------------------------------------------------
    rec_label = latest_review.get("recommendation_label") or latest_review.get("recommendation")
    reviewer_name = latest_review.get("reviewer_name") or "Assigned Member"

    snapshot_text = (
        f"Study '{study.title}' ({study.study_id}) is currently in '{study.status.replace('_', ' ').title()}' status. "
        f"The dossier comprises {total_docs} submitted document(s) ({verified_docs} verified). "
        f"Quality Gate status: {quality_gate_summary.get('status', 'not evaluated')} (Score: {quality_gate_summary.get('score', 'N/A')}). "
        f"Ethical Reviewer {reviewer_name} submitted recommendation: '{rec_label}'. "
        f"This synthesis is compiled to assist Institutional Ethics Committee review deliberations."
    )

    # Compile Final Structure
    summary_payload = {
        "meta": {
            "title": "AI-Assisted Review Summary",
            "study_id": study.study_id,
            "protocol_number": study.protocol_number,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "transparency_notice": (
                "AI-Assisted Review Summary: This summary is generated from available structured study, "
                "protocol, document, Quality Gate and IEC review information. It is an assistive aid and does "
                "not replace independent IEC judgment."
            ),
            "decision_disclaimer": (
                "This summary is an assistive review aid. It does not replace independent IEC judgment or "
                "constitute the final IEC decision."
            ),
        },
        "study_overview": study_overview,
        "protocol_summary": protocol_summary,
        "document_readiness": doc_readiness,
        "quality_gate": quality_gate_summary,
        "iec_member_review": iec_member_review,
        "ethical_risk_summary": ethical_risk_summary,
        "key_strengths": strengths,
        "key_concerns": concerns,
        "required_follow_up": follow_ups,
        "overall_snapshot": snapshot_text,
    }

    return True, "AI Review Summary synthesized successfully", 200, summary_payload
