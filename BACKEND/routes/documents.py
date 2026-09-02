from datetime import datetime
from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.study import Study
from models.document import Document, DocumentVersion, VALID_DOCUMENT_TYPES
from models.quality_check import QualityCheck
from utils.permissions import can_user_access_study
from utils.storage import (
    validate_file_upload,
    save_file,
    get_absolute_file_path,
)
from services.quality_gate_service import run_study_quality_check, extract_document_text

documents_bp = Blueprint("documents", __name__, url_prefix="/api")


def _get_authenticated_user():
    """Retrieve the current user from JWT identity."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


# ==============================================================================
# 1. STUDY DOCUMENTS UPLOAD & LISTING
# ==============================================================================

@documents_bp.route("/studies/<int:study_id>/documents", methods=["POST"])
@jwt_required()
def upload_study_document(study_id: int):
    """
    Upload a new study document (multipart/form-data).
    Creates Document and initial DocumentVersion (v1).
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="upload")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded or file is empty"}), 400

    uploaded_file = request.files["file"]
    is_valid, err, meta = validate_file_upload(uploaded_file)
    if not is_valid:
        return jsonify({"success": False, "message": err}), 400

    document_type = request.form.get("document_type", "other").strip().lower()
    if document_type not in VALID_DOCUMENT_TYPES:
        return jsonify({
            "success": False,
            "message": f"Invalid document type '{document_type}'. Allowed types: {', '.join(sorted(VALID_DOCUMENT_TYPES))}"
        }), 400

    description = request.form.get("description", "").strip()

    try:
        # Create initial Document record to obtain ID
        document = Document(
            study_id=study.id,
            uploaded_by=user.id,
            original_filename=meta["original_filename"],
            storage_path="",  # Updated after saving file
            document_type=document_type,
            mime_type=meta["mime_type"],
            file_size=meta["file_size"],
            description=description,
            status="uploaded",
            current_version=1,
            is_deleted=False,
        )
        db.session.add(document)
        db.session.flush()

        # Save physical file safely
        rel_path, orig_name, file_size, mime_type = save_file(
            uploaded_file,
            study_id=study.id,
            document_id=document.id,
            version_number=1,
        )
        document.storage_path = rel_path
        document.file_size = file_size
        document.mime_type = mime_type

        # Create Version 1 record
        version = DocumentVersion(
            document_id=document.id,
            version_number=1,
            storage_path=rel_path,
            original_filename=orig_name,
            mime_type=mime_type,
            file_size=file_size,
            uploaded_by=user.id,
            change_summary=description or "Initial document upload",
        )
        db.session.add(version)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Document uploaded successfully",
            "document": document.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to upload document: {str(e)}"
        }), 500


@documents_bp.route("/studies/<int:study_id>/documents", methods=["GET"])
@jwt_required()
def list_study_documents(study_id: int):
    """List non-deleted documents for a study with optional search, document_type and status filtering."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="list")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    query = Document.query.filter_by(study_id=study.id, is_deleted=False)

    doc_type = request.args.get("document_type")
    if doc_type:
        query = query.filter_by(document_type=doc_type.strip().lower())

    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status.strip().lower())

    search = request.args.get("search")
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search.strip()}%"))

    # Sorting
    sort = request.args.get("sort", "newest")
    if sort == "oldest":
        query = query.order_by(Document.created_at.asc())
    elif sort == "name":
        query = query.order_by(Document.original_filename.asc())
    elif sort == "status":
        query = query.order_by(Document.status.asc())
    else:
        query = query.order_by(Document.created_at.desc())

    documents = query.all()

    return jsonify({
        "success": True,
        "study_id": study.id,
        "study_title": study.title,
        "count": len(documents),
        "documents": [doc.to_dict() for doc in documents],
    }), 200


# ==============================================================================
# 2. DOCUMENT DETAILS, DOWNLOAD, UPDATE & DELETE (Study-scoped & Root-scoped)
# ==============================================================================

@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>", methods=["GET"])
@documents_bp.route("/documents/<int:document_id>", methods=["GET"])
@jwt_required()
def get_document_details(document_id: int, study_id: int = None):
    """Retrieve detailed metadata and version history for a single document."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="view")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    doc_dict = document.to_dict(include_versions=True)
    return jsonify({
        "success": True,
        "document": doc_dict,
    }), 200


@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>/download", methods=["GET"])
@documents_bp.route("/documents/<int:document_id>/download", methods=["GET"])
@jwt_required()
def download_document(document_id: int, study_id: int = None):
    """Download the latest version of an active document."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="download")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    abs_path = get_absolute_file_path(document.storage_path)
    if not abs_path:
        return jsonify({"success": False, "message": "File not found on storage"}), 404

    return send_file(
        abs_path,
        as_attachment=True,
        download_name=document.original_filename,
        mimetype=document.mime_type,
    )


@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>", methods=["PUT"])
@documents_bp.route("/documents/<int:document_id>", methods=["PUT"])
@jwt_required()
def update_document_metadata(document_id: int, study_id: int = None):
    """Update document metadata (document_type, description, status) without altering physical files."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="update")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body must be JSON"}), 400

    if "document_type" in data:
        doc_type = str(data["document_type"]).strip().lower()
        if doc_type not in VALID_DOCUMENT_TYPES:
            return jsonify({
                "success": False,
                "message": f"Invalid document type '{doc_type}'. Allowed types: {', '.join(sorted(VALID_DOCUMENT_TYPES))}"
            }), 400
        document.document_type = doc_type

    if "description" in data:
        document.description = str(data["description"]).strip()

    if "status" in data:
        document.status = str(data["status"]).strip().lower()

    document.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Document metadata updated successfully",
        "document": document.to_dict(),
    }), 200


@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>", methods=["DELETE"])
@documents_bp.route("/documents/<int:document_id>", methods=["DELETE"])
@jwt_required()
def delete_document(document_id: int, study_id: int = None):
    """Soft delete a document, hiding it from listings while preserving version history."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="delete")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    document.is_deleted = True
    document.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Document deleted successfully",
    }), 200


# ==============================================================================
# 3. DOCUMENT VERSIONING
# ==============================================================================

@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>/versions", methods=["POST"])
@documents_bp.route("/documents/<int:document_id>/versions", methods=["POST"])
@jwt_required()
def upload_document_version(document_id: int, study_id: int = None):
    """Upload a new version of an existing document without destroying prior versions."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="create_version")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded or file is empty"}), 400

    uploaded_file = request.files["file"]
    is_valid, err, meta = validate_file_upload(uploaded_file)
    if not is_valid:
        return jsonify({"success": False, "message": err}), 400

    change_summary = (
        request.form.get("change_summary") or request.form.get("description") or ""
    ).strip()

    next_version = document.current_version + 1

    try:
        rel_path, orig_name, file_size, mime_type = save_file(
            uploaded_file,
            study_id=study.id,
            document_id=document.id,
            version_number=next_version,
        )

        version = DocumentVersion(
            document_id=document.id,
            version_number=next_version,
            storage_path=rel_path,
            original_filename=orig_name,
            mime_type=mime_type,
            file_size=file_size,
            uploaded_by=user.id,
            change_summary=change_summary or f"Version {next_version} upload",
        )
        db.session.add(version)

        # Update Document pointer to latest version
        document.current_version = next_version
        document.storage_path = rel_path
        document.original_filename = orig_name
        document.mime_type = mime_type
        document.file_size = file_size
        document.status = "uploaded"
        document.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "New document version uploaded successfully",
            "document": document.to_dict(),
            "version": version.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to upload document version: {str(e)}"
        }), 500


@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>/versions", methods=["GET"])
@documents_bp.route("/documents/<int:document_id>/versions", methods=["GET"])
@jwt_required()
def list_document_versions(document_id: int, study_id: int = None):
    """Retrieve full version history for a document."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="view")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    versions = (
        DocumentVersion.query.filter_by(document_id=document.id)
        .order_by(DocumentVersion.version_number.asc())
        .all()
    )

    return jsonify({
        "success": True,
        "document_id": document.id,
        "current_version": document.current_version,
        "count": len(versions),
        "versions": [v.to_dict() for v in versions],
    }), 200


@documents_bp.route(
    "/studies/<int:study_id>/documents/<int:document_id>/versions/<int:version_number>/download",
    methods=["GET"],
)
@documents_bp.route(
    "/documents/<int:document_id>/versions/<int:version_number>/download",
    methods=["GET"],
)
@jwt_required()
def download_document_version(document_id: int, version_number: int, study_id: int = None):
    """Download a specific historical version of a document."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted:
        return jsonify({"success": False, "message": "Document not found"}), 404

    if study_id and document.study_id != study_id:
        return jsonify({"success": False, "message": "Document does not belong to specified study"}), 404

    study = db.session.get(Study, document.study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="download")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    version = DocumentVersion.query.filter_by(
        document_id=document.id,
        version_number=version_number,
    ).first()

    if not version:
        return jsonify({
            "success": False,
            "message": f"Version {version_number} not found"
        }), 404

    abs_path = get_absolute_file_path(version.storage_path)
    if not abs_path:
        return jsonify({"success": False, "message": "File not found on storage"}), 404

    return send_file(
        abs_path,
        as_attachment=True,
        download_name=version.original_filename,
        mimetype=version.mime_type,
    )


# ==============================================================================
# 4. AI QUALITY GATE ENDPOINTS
# ==============================================================================

@documents_bp.route("/studies/<int:study_id>/quality-check", methods=["POST"])
@jwt_required()
def trigger_study_quality_check(study_id: int):
    """
    Trigger the AI Quality Gate evaluation for a study.
    Runs Completeness, Consistency, Cross-Document checks, and generates Risk Flags & Recommendations.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="quality_data")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    qc = run_study_quality_check(study, user.id)

    return jsonify({
        "success": True,
        "message": "AI Quality Gate check executed successfully",
        "quality_check": qc.to_dict(),
    }), 200


@documents_bp.route("/studies/<int:study_id>/quality-check", methods=["GET"])
@jwt_required()
def get_latest_study_quality_check(study_id: int):
    """Retrieve the latest AI Quality Gate check result for a study."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="quality_data")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    latest_qc = (
        QualityCheck.query.filter_by(study_id=study.id)
        .order_by(QualityCheck.created_at.desc())
        .first()
    )

    if not latest_qc:
        return jsonify({
            "success": True,
            "status": "not_checked",
            "message": "Quality check has not been run yet for this study",
            "quality_check": {
                "status": "not_checked",
                "score": None,
                "summary": "Quality check has not been run yet.",
                "completeness": {"status": "not_checked", "issues": []},
                "consistency": {"status": "not_checked", "issues": []},
                "cross_document": {"status": "not_checked", "issues": []},
                "risk_flags": [],
                "recommendations": [],
                "created_at": None,
            },
        }), 200

    return jsonify({
        "success": True,
        "quality_check": latest_qc.to_dict(),
    }), 200


@documents_bp.route("/studies/<int:study_id>/documents/<int:document_id>/quality-check", methods=["POST"])
@jwt_required()
def trigger_document_quality_check(study_id: int, document_id: int):
    """Trigger a document-specific quality verification check."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    document = db.session.get(Document, document_id)
    if not document or document.is_deleted or document.study_id != study.id:
        return jsonify({"success": False, "message": "Document not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="quality_data")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    txt, success, note = extract_document_text(document)
    has_content = bool(txt and len(txt) > 20)

    issues = []
    if not success:
        issues.append({
            "severity": "INFO",
            "message": f"Text extraction note: {note}",
            "recommendation": "Review document manually if binary format."
        })
    elif not has_content:
        issues.append({
            "severity": "WARNING",
            "message": "Document content appears very brief or empty.",
            "recommendation": "Verify complete document upload."
        })

    status = "quality_check_completed" if not issues else "issues_found"
    document.status = status
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Document quality verification completed",
        "document_id": document.id,
        "status": status,
        "text_extraction": {
            "supported": True,
            "success": success,
            "note": note,
            "content_length": len(txt),
        },
        "issues": issues,
    }), 200


@documents_bp.route("/studies/<int:study_id>/documents/quality-data", methods=["GET"])
@jwt_required()
def get_study_documents_quality_data(study_id: int):
    """
    Gather and return structured document metadata for future AI Quality Gate processing.
    Provides document catalog, version histories, and text extraction readiness hooks.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive"}), 403

    study = db.session.get(Study, study_id)
    if not study:
        return jsonify({"success": False, "message": "Study not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="quality_data")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    documents = (
        Document.query.filter_by(study_id=study.id, is_deleted=False)
        .order_by(Document.id.asc())
        .all()
    )

    docs_data = []
    for doc in documents:
        ext = (doc.original_filename.rsplit(".", 1)[-1].lower()) if "." in doc.original_filename else ""
        extraction_type = "plain_text" if ext == "txt" else ("pdf" if ext == "pdf" else "word_document")

        versions_data = [
            {
                "version_number": v.version_number,
                "original_filename": v.original_filename,
                "mime_type": v.mime_type,
                "file_size": v.file_size,
                "uploaded_by": v.uploaded_by,
                "change_summary": v.change_summary,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in doc.versions
        ]

        docs_data.append({
            "id": doc.id,
            "document_name": doc.original_filename,
            "document_type": doc.document_type,
            "original_filename": doc.original_filename,
            "current_version": doc.current_version,
            "mime_type": doc.mime_type,
            "file_size": doc.file_size,
            "status": doc.status or "uploaded",
            "description": doc.description,
            "uploaded_by": doc.uploaded_by,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
            "text_extraction": {
                "supported": ext in {"pdf", "txt", "docx", "doc"},
                "ready_for_extraction": True,
                "extraction_type": extraction_type,
            },
            "versions_count": len(versions_data),
            "version_history": versions_data,
        })

    has_protocol = any(d.document_type == "protocol" for d in documents)
    has_consent = any(d.document_type == "informed_consent" for d in documents)
    has_crf = any(d.document_type == "case_report_form" for d in documents)

    return jsonify({
        "success": True,
        "study_id": study.id,
        "study_title": study.title,
        "protocol_number": study.protocol_number,
        "prepared_at": datetime.utcnow().isoformat(),
        "documents_count": len(docs_data),
        "documents": docs_data,
        "quality_gate_readiness": {
            "has_protocol": has_protocol,
            "has_informed_consent": has_consent,
            "has_case_report_form": has_crf,
            "total_documents": len(docs_data),
            "is_ready_for_pipeline": has_protocol and (len(docs_data) > 0),
        },
    }), 200
