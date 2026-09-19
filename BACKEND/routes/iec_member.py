from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from utils.security import require_role
from services.iec_member_service import (
    get_member_dashboard_metrics,
    list_member_reviews,
    get_study_member_view,
    start_study_member_review,
    submit_member_recommendation,
)

iec_member_bp = Blueprint("iec_member", __name__, url_prefix="/api/iec/member")


def _get_authenticated_member():
    """Retrieve current authenticated user and assert active iec_member role."""
    if hasattr(g, "current_user") and g.current_user:
        return g.current_user

    user_id = get_jwt_identity()
    if not user_id:
        return None
    user = db.session.get(User, int(user_id))
    if user and user.is_active and user.role == "iec_member":
        return user
    return None


@iec_member_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_dashboard():
    """Aggregate live metrics and recent reviews for IEC Member dashboard."""
    metrics = get_member_dashboard_metrics()
    return jsonify({
        "success": True,
        "metrics": metrics,
    }), 200


@iec_member_bp.route("/reviews", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_reviews():
    """List studies in IEC review queue with search, status filtering, and sorting."""
    search = request.args.get("search")
    status_filter = request.args.get("status")
    sort_by = request.args.get("sort", "newest")

    reviews = list_member_reviews(
        search=search,
        status_filter=status_filter,
        sort_by=sort_by,
    )

    return jsonify({
        "success": True,
        "count": len(reviews),
        "reviews": reviews,
    }), 200


@iec_member_bp.route("/studies/<identifier>", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_study_detail(identifier):
    """Retrieve complete study review dossier for IEC Member review."""
    user = _get_authenticated_member()
    data = get_study_member_view(identifier, current_user=user)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@iec_member_bp.route("/studies/<identifier>/protocol", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_study_protocol(identifier):
    """Retrieve clinical study protocol for IEC Member review."""
    data = get_study_member_view(identifier)
    if not data:
        return jsonify({
            "success": False,
            "message": f"Study '{identifier}' not found",
        }), 404

    return jsonify({
        "success": True,
        "study_id": data["study"]["study_id"],
        "protocol": data["protocol"],
    }), 200


@iec_member_bp.route("/studies/<identifier>/documents", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_study_documents(identifier):
    """Retrieve submitted research documents catalog and verification status."""
    data = get_study_member_view(identifier)
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


@iec_member_bp.route("/studies/<identifier>/quality", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def get_study_quality(identifier):
    """Retrieve AI Quality Gate evaluation and risk flags for study."""
    data = get_study_member_view(identifier)
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


@iec_member_bp.route("/studies/<identifier>/start-review", methods=["POST"])
@jwt_required()
@require_role("iec_member")
def start_review(identifier):
    """Transition study status from 'ready_for_iec_review' to 'under_iec_review'."""
    user = _get_authenticated_member()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    ok, msg, study = start_study_member_review(identifier, user)
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "study": study,
    }), 200


@iec_member_bp.route("/studies/<identifier>/recommendation", methods=["POST"])
@jwt_required()
@require_role("iec_member")
def submit_recommendation(identifier):
    """
    Submit an IEC Member recommendation (Approval / Modification / Rejection).
    Updates workflow status to 'iec_recommendation_submitted' and logs audit trail.
    Does NOT approve or activate study.
    """
    user = _get_authenticated_member()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a JSON object"}), 400

    ok, msg, result = submit_member_recommendation(identifier, user, payload)
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({
        "success": True,
        "message": msg,
        "data": result,
    }), 200
