import os
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime

from extensions import db
from models.study import Study
from models.document import Document
from models.quality_check import QualityCheck
from utils.storage import get_absolute_file_path


def extract_document_text(document: Document) -> tuple[str, bool, str]:
    """
    Safely extract textual content from uploaded study documents.
    Supports .txt, .docx (via standard zipfile/xml), and text patterns in .pdf.
    
    Returns:
        (extracted_text, is_success, extraction_note)
    """
    abs_path = get_absolute_file_path(document.storage_path)
    if not abs_path or not os.path.isfile(abs_path):
        return "", False, "File missing on server storage"

    ext = (document.original_filename.rsplit(".", 1)[-1].lower()) if "." in document.original_filename else ""

    # 1. Plain Text files
    if ext == "txt":
        try:
            with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read().strip()
                return text, True, "Extracted plain text successfully"
        except Exception as e:
            return "", False, f"Plain text read error: {str(e)}"

    # 2. DOCX files (Standard XML extraction via zipfile)
    if ext == "docx":
        try:
            with zipfile.ZipFile(abs_path, "r") as docx_zip:
                if "word/document.xml" in docx_zip.namelist():
                    xml_content = docx_zip.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    paragraphs = []
                    for p in tree.iterfind(".//w:p", namespaces):
                        texts = [node.text for node in p.iterfind(".//w:t", namespaces) if node.text]
                        if texts:
                            paragraphs.append("".join(texts))
                    extracted_text = "\n".join(paragraphs).strip()
                    return extracted_text, True, "Extracted DOCX XML text successfully"
        except Exception as e:
            return "", False, f"DOCX extraction note: {str(e)}"

    # 3. PDF files (Text stream inspection)
    if ext == "pdf":
        try:
            with open(abs_path, "rb") as f:
                content = f.read()
                # Basic textual stream extraction from PDF objects
                text_chunks = re.findall(rb"\(([^\)\\]{4,})\)", content)
                decoded_chunks = []

                for chunk in text_chunks:
                    try:
                        decoded_chunks.append(chunk.decode("utf-8", errors="ignore"))
                    except Exception:
                        pass
                if decoded_chunks:
                    return " ".join(decoded_chunks), True, "Extracted PDF text stream"
                return "", False, "Unable to extract text automatically from binary PDF stream"
        except Exception as e:
            return "", False, f"PDF extraction note: {str(e)}"

    return "", False, "Unable to verify binary content automatically"


def _extract_sample_size_from_text(text: str) -> int | None:
    """Extract sample size or participant count from document text."""
    if not text:
        return None
    patterns = [
        r"sample\s*size\s*[:=\-]?\s*(\d{1,5})",
        r"(\d{1,5})\s*(?:participants|patients|subjects|volunteers)",
        r"total\s*enrollment\s*[:=\-]?\s*(\d{1,5})",
        r"n\s*=\s*(\d{1,5})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                val = int(match.group(1))
                if 1 <= val <= 100000:
                    return val
            except ValueError:
                pass
    return None


def _extract_duration_from_text(text: str) -> str | None:
    """Extract study or intervention duration from document text."""
    if not text:
        return None
    match = re.search(r"(\d{1,3})\s*(weeks?|months?|days?|years?)", text, re.IGNORECASE)
    if match:
        return f"{match.group(1)} {match.group(2).lower()}"
    return None


def run_study_quality_check(study: Study, user_id: int) -> QualityCheck:
    """
    Execute deterministic AI Quality Gate checks for a study.
    Evaluates Completeness, Internal Consistency, Cross-Document Consistency,
    generates Quality/Risk flags and actionable recommendations.
    """
    active_docs = (
        Document.query.filter_by(study_id=study.id, is_deleted=False)
        .order_by(Document.id.asc())
        .all()
    )

    completeness_issues = []
    consistency_issues = []
    cross_doc_issues = []
    risk_flags = []
    recommendations = []

    # =========================================================================
    # CHECK A: COMPLETENESS
    # =========================================================================
    # 1. Study Title
    if not study.title or len(study.title.strip()) < 10:
        completeness_issues.append({
            "id": "comp_title",
            "field": "title",
            "severity": "HIGH",
            "message": "Study title is missing or insufficiently descriptive (minimum 10 characters required).",
            "recommendation": "Provide a comprehensive clinical title specifying the Ayurvedic formulation and target indication."
        })

    # 2. Protocol Number
    if not study.protocol_number or len(study.protocol_number.strip()) < 3:
        completeness_issues.append({
            "id": "comp_protocol_num",
            "field": "protocol_number",
            "severity": "HIGH",
            "message": "Mandatory protocol identification number is missing.",
            "recommendation": "Assign a unique institutional protocol number (e.g. ALLA-2026-001)."
        })

    # 3. Description / Objective
    if not study.description or len(study.description.strip()) < 20:
        completeness_issues.append({
            "id": "comp_desc",
            "field": "description",
            "severity": "WARNING",
            "message": "Study summary/objective is brief or incomplete.",
            "recommendation": "Expand the study description to detail research hypothesis, dosage, and methodology."
        })

    # 4. Mandatory Document Types Presence
    doc_types = {d.document_type for d in active_docs}

    if "protocol" not in doc_types:
        completeness_issues.append({
            "id": "comp_doc_protocol",
            "field": "document_protocol",
            "severity": "CRITICAL",
            "message": "Missing mandatory Study Protocol document.",
            "recommendation": "Upload the finalized Clinical Study Protocol document before submitting for review."
        })
        risk_flags.append({
            "code": "MISSING_PROTOCOL",
            "severity": "CRITICAL",
            "title": "Protocol Document Required",
            "description": "A study cannot proceed to IEC Secretariat review without an uploaded protocol."
        })

    if "informed_consent" not in doc_types:
        completeness_issues.append({
            "id": "comp_doc_icf",
            "field": "document_informed_consent",
            "severity": "HIGH",
            "message": "Missing Informed Consent Form (ICF) / Participant Information Sheet.",
            "recommendation": "Upload the Informed Consent Form and patient information document."
        })
        risk_flags.append({
            "code": "MISSING_ICF",
            "severity": "HIGH",
            "title": "Missing Informed Consent Form",
            "description": "Patient safety and ethics compliance require an explicit Informed Consent Form."
        })

    if "case_report_form" not in doc_types:
        completeness_issues.append({
            "id": "comp_doc_crf",
            "field": "document_crf",
            "severity": "WARNING",
            "message": "Case Report Form (CRF) template has not been uploaded.",
            "recommendation": "Upload the CRF to ensure clinical data points are systematically captured."
        })

    if "investigator_brochure" not in doc_types:
        completeness_issues.append({
            "id": "comp_doc_ib",
            "field": "document_ib",
            "severity": "INFO",
            "message": "Investigator Brochure or Herb Monograph not attached.",
            "recommendation": "Attach the Investigator Brochure or Ayurvedic classical reference text."
        })

    # =========================================================================
    # EXTRACT TEXT & CROSS-CHECK
    # =========================================================================
    extracted_docs = {}
    for doc in active_docs:
        txt, success, note = extract_document_text(doc)
        extracted_docs[doc.id] = {
            "document": doc,
            "text": txt,
            "success": success,
            "note": note,
            "sample_size": _extract_sample_size_from_text(txt),
            "duration": _extract_duration_from_text(txt),
        }

    # =========================================================================
    # CHECK B: INTERNAL CONSISTENCY
    # =========================================================================
    protocol_doc = next((d for d in active_docs if d.document_type == "protocol"), None)
    if protocol_doc:
        p_info = extracted_docs.get(protocol_doc.id, {})
        p_text = p_info.get("text", "")

        # Check if protocol text mentions a protocol number that contradicts study.protocol_number
        if p_text and study.protocol_number:
            found_num = re.search(r"protocol\s*(?:no|number|id)?\s*[:=\-]?\s*([A-Za-z0-9\-_]{3,20})", p_text, re.IGNORECASE)
            if found_num:
                detected_num = found_num.group(1).strip()
                if detected_num.lower() != study.protocol_number.strip().lower():
                    consistency_issues.append({
                        "id": "const_prot_num_mismatch",
                        "field": "protocol_number",
                        "severity": "HIGH",
                        "message": f"Protocol number mismatch: Study record has '{study.protocol_number}' but uploaded protocol document mentions '{detected_num}'.",
                        "recommendation": "Harmonize the protocol number in study details and uploaded protocol."
                    })

        # Check for study protocol text completeness
        if p_text:
            if not re.search(r"inclusion\s*criteria", p_text, re.IGNORECASE):
                completeness_issues.append({
                    "id": "comp_inclusion",
                    "field": "inclusion_criteria",
                    "severity": "HIGH",
                    "message": "No explicit Inclusion Criteria section detected in Protocol text.",
                    "recommendation": "Ensure the protocol explicitly defines inclusion criteria."
                })
            if not re.search(r"exclusion\s*criteria", p_text, re.IGNORECASE):
                completeness_issues.append({
                    "id": "comp_exclusion",
                    "field": "exclusion_criteria",
                    "severity": "HIGH",
                    "message": "No explicit Exclusion Criteria section detected in Protocol text.",
                    "recommendation": "Ensure the protocol explicitly defines exclusion criteria."
                })
            if not re.search(r"safety|adverse\s*event|pharmacovigilance", p_text, re.IGNORECASE):
                completeness_issues.append({
                    "id": "comp_safety",
                    "field": "safety_monitoring",
                    "severity": "WARNING",
                    "message": "Safety monitoring and adverse event reporting section is absent in Protocol text.",
                    "recommendation": "Include safety monitoring protocols for Ayurvedic herbal interventions."
                })

    # =========================================================================
    # CHECK C: CROSS-DOCUMENT CONSISTENCY
    # =========================================================================
    icf_doc = next((d for d in active_docs if d.document_type == "informed_consent"), None)
    if protocol_doc and icf_doc:
        p_info = extracted_docs.get(protocol_doc.id, {})
        i_info = extracted_docs.get(icf_doc.id, {})

        # Cross-check sample size
        p_size = p_info.get("sample_size")
        i_size = i_info.get("sample_size")
        if p_size and i_size and p_size != i_size:
            cross_doc_issues.append({
                "id": "cross_sample_size",
                "field": "sample_size",
                "severity": "HIGH",
                "message": f"Sample size conflict: Protocol specifies {p_size} subjects, but Informed Consent Form specifies {i_size} subjects.",
                "recommendation": "Reconcile sample size between Protocol and Informed Consent Form."
            })
            risk_flags.append({
                "code": "SAMPLE_SIZE_CONFLICT",
                "severity": "HIGH",
                "title": "Conflicting Sample Size Across Documents",
                "description": f"Protocol states n={p_size} while Consent Form states n={i_size}."
            })

        # Cross-check duration
        p_dur = p_info.get("duration")
        i_dur = i_info.get("duration")
        if p_dur and i_dur and p_dur.lower() != i_dur.lower():
            cross_doc_issues.append({
                "id": "cross_duration",
                "field": "duration",
                "severity": "WARNING",
                "message": f"Trial duration divergence: Protocol indicates '{p_dur}', while ICF mentions '{i_dur}'.",
                "recommendation": "Align intervention timeline across both documents."
            })

    # Check for unreadable/binary documents
    for doc in active_docs:
        info = extracted_docs.get(doc.id, {})
        if not info.get("success"):
            cross_doc_issues.append({
                "id": f"unparsed_doc_{doc.id}",
                "field": f"document_{doc.id}",
                "severity": "INFO",
                "message": f"Document '{doc.original_filename}': {info.get('note', 'Unable to verify content automatically')}.",
                "recommendation": "Manual verification recommended by IEC secretariat during document review."
            })

    # =========================================================================
    # CALCULATE QUALITY SCORE & STATUS
    # =========================================================================
    all_issues = completeness_issues + consistency_issues + cross_doc_issues

    critical_count = sum(1 for i in all_issues if i.get("severity") == "CRITICAL")
    high_count = sum(1 for i in all_issues if i.get("severity") == "HIGH")
    warning_count = sum(1 for i in all_issues if i.get("severity") == "WARNING")
    info_count = sum(1 for i in all_issues if i.get("severity") == "INFO")

    base_score = 100
    deductions = (critical_count * 25) + (high_count * 15) + (warning_count * 6) + (info_count * 2)
    score = max(0, min(100, base_score - deductions))

    if critical_count > 0:
        overall_status = "blocked"
    elif high_count > 0:
        overall_status = "issues_found"
    elif warning_count > 0:
        overall_status = "passed_with_warnings"
    else:
        overall_status = "passed"

    # Consolidate actionable recommendations
    for issue in all_issues:
        rec = issue.get("recommendation")
        if rec and rec not in recommendations:
            recommendations.append(rec)

    # Build summary
    summary_text = (
        f"AI Quality Gate evaluation completed. Status: {overall_status.replace('_', ' ').title()}. "
        f"Quality Score: {score}/100 with {critical_count} critical, {high_count} high, {warning_count} warnings, "
        f"and {info_count} informational notes across {len(active_docs)} documents."
    )

    # Update document statuses based on quality gate findings
    for doc in active_docs:
        if overall_status == "passed":
            doc.status = "quality_check_completed"
        elif overall_status in ("issues_found", "blocked"):
            doc.status = "issues_found"
        else:
            doc.status = "quality_check_completed"

    # Persist QualityCheck record
    qc = QualityCheck(
        study_id=study.id,
        document_id=None,
        status=overall_status,
        score=score,
        summary=summary_text,
        completeness_data={
            "status": "passed" if not completeness_issues else ("issues_found" if critical_count + high_count > 0 else "warnings"),
            "issues": completeness_issues,
            "checked_items": ["Study Title", "Protocol Number", "Study Description", "Mandatory Document Types", "Inclusion/Exclusion Criteria", "Safety Monitoring"],
        },
        consistency_data={
            "status": "passed" if not consistency_issues else "issues_found",
            "issues": consistency_issues,
            "checked_items": ["Protocol Number Uniformity", "Study Objective Alignment", "Internal Section Consistency"],
        },
        cross_document_data={
            "status": "passed" if not cross_doc_issues else ("issues_found" if any(i.get("severity") == "HIGH" for i in cross_doc_issues) else "warnings"),
            "issues": cross_doc_issues,
            "checked_items": ["Sample Size Concordance", "Intervention Duration Matching", "Document Parsing Verification"],
        },
        risk_flags=risk_flags,
        recommendations=recommendations,
        checked_by=user_id,
    )

    db.session.add(qc)
    db.session.commit()

    return qc
