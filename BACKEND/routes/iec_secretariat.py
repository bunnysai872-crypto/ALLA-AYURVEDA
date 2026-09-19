from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from utils.security import require_role
from services.iec_secretariat_service import (
    get_secretariat_dashboard_metrics,
    list_secretariat_submissions,
    get_study_secretariat_view,
    verify_study_document,
    request_document_correction,
    mark_document_missing,
    submit_study_to_iec_review,
)

iec_secretariat_bp = Blueprint("iec_secretariat", __name__, url_prefix="/api/iec/secretariat")


def _get_authenticated_secretariat_user():
    """Retrieve current authenticated user and assert active iec_secretariat role."""
    if hasattr(g, "current_user") and g.current_user:
        return g.current_user

    user_id = get_jwt_identity()
    if not user_id:
        return None
    user = db.session.get(User, int(user_id))
    if user and user.is_active and user.role == "iec_secretariat":
        return user
    return None


@iec_secretariat_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_dashboard():
    """Aggregate real live metrics for IEC Secretariat dashboard."""
    metrics = get_secretariat_dashboard_metrics()
    return jsonify({
        "success": True,
        "metrics": metrics,
    }), 200


@iec_secretariat_bp.route("/submissions", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_submissions():
    """List research study submissions with search, filters, and sorting."""
    search = request.args.get("search")
    status_filter = request.args.get("status")
    readiness_filter = request.args.get("readiness")
    doc_filter = request.args.get("document_status")
    sort_by = request.args.get("sort", "newest")

    submissions = list_secretariat_submissions(
        search=search,
        status_filter=status_filter,
        readiness_filter=readiness_filter,
        doc_filter=doc_filter,
        sort_by=sort_by,
    )

    return jsonify({
        "success": True,
        "count": len(submissions),
        "submissions": submissions,
    }), 200


@iec_secretariat_bp.route("/studies/<identifier>", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_study_detail(identifier):
    """Retrieve complete study review dossier for Secretariat."""
    data = get_study_secretariat_view(identifier)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@iec_secretariat_bp.route("/studies/<identifier>/documents", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_study_documents(identifier):
    """Retrieve study documents catalog and verification checklist."""
    data = get_study_secretariat_view(identifier)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "study_id": data["study"]["study_id"],
        "documents": data["documents"],
        "checklist": data["verification_checklist"],
        "readiness": data["readiness"],
    }), 200


@iec_secretariat_bp.route("/studies/<identifier>/quality", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_study_quality(identifier):
    """Retrieve AI Quality Gate data for a study."""
    data = get_study_secretariat_view(identifier)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "quality_gate": data["quality_gate"],
        "readiness": data["readiness"],
    }), 200


@iec_secretariat_bp.route("/documents/<int:document_id>/verify", methods=["POST"])
@jwt_required()
@require_role("iec_secretariat")
def verify_document(document_id: int):
    """Mark a document as verified with Secretariat audit remarks."""
    user = _get_authenticated_secretariat_user()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True) or {}
    remarks = payload.get("remarks")

    ok, msg, doc = verify_study_document(document_id, user, remarks)
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "document": doc,
    }), 200


@iec_secretariat_bp.route("/documents/<int:document_id>/correction", methods=["POST"])
@jwt_required()
@require_role("iec_secretariat")
def request_correction(document_id: int):
    """Flag a document as requiring correction or rejected with specific reason."""
    user = _get_authenticated_secretariat_user()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a JSON object"}), 400

    reason = payload.get("reason", "").strip()
    remarks = payload.get("remarks", "").strip()
    reject = bool(payload.get("reject", False))

    if not reason:
        return jsonify({"success": False, "message": "Correction reason is mandatory"}), 400

    ok, msg, doc = request_document_correction(
        document_id=document_id,
        secretariat_user=user,
        reason=reason,
        remarks=remarks,
        reject=reject,
    )
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "document": doc,
    }), 200


@iec_secretariat_bp.route("/documents/<int:document_id>/missing", methods=["POST"])
@jwt_required()
@require_role("iec_secretariat")
def mark_missing(document_id: int):
    """Mark a document as missing / deficient with Secretariat audit remarks."""
    user = _get_authenticated_secretariat_user()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True) or {}
    remarks = payload.get("remarks")

    ok, msg, doc = mark_document_missing(
        document_id=document_id,
        secretariat_user=user,
        remarks=remarks,
    )
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "document": doc,
    }), 200


@iec_secretariat_bp.route("/studies/<identifier>/verification-summary", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def get_verification_summary(identifier):
    """Retrieve complete verification summary and readiness report."""
    data = get_study_secretariat_view(identifier)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "summary": {
            "study_id": data["study"]["study_id"],
            "title": data["study"]["title"],
            "workflow_status": data["study"]["status"],
            "checklist": data["verification_checklist"],
            "readiness": data["readiness"],
            "quality_gate": {
                "status": data["quality_gate"].get("status"),
                "score": data["quality_gate"].get("score"),
            },
        },
    }), 200


@iec_secretariat_bp.route("/studies/<identifier>/submit-to-iec", methods=["POST"])
@jwt_required()
@require_role("iec_secretariat")
def submit_to_iec(identifier):
    """Submit study to the next IEC review stage after document verification."""
    user = _get_authenticated_secretariat_user()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True) or {}
    remarks = payload.get("remarks")

    ok, msg, result = submit_study_to_iec_review(
        identifier=identifier,
        secretariat_user=user,
        remarks=remarks,
    )
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "data": result,
    }), 200
