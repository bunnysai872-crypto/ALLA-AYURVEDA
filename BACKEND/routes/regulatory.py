from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from utils.security import require_role
from services.regulatory_service import (
    list_regulatory_studies,
    get_regulatory_dossier,
    update_regulatory_tracking,
)
from services.activation_service import (
    evaluate_activation_readiness,
    activate_study,
)

regulatory_bp = Blueprint("regulatory", __name__, url_prefix="/api/regulatory")


def _get_authenticated_user() -> User | None:
    """Retrieve current authenticated user from JWT identity."""
    if hasattr(g, "current_user") and g.current_user:
        return g.current_user
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


@regulatory_bp.route("/studies", methods=["GET"])
@jwt_required()
@require_role("regulatory_admin", "researcher", "iec_secretariat")
def get_regulatory_studies():
    """
    List clinical studies eligible for or currently in Regulatory & CTRI Tracking.
    Accessible to Regulatory Admins (all approved studies) and Researchers (own approved studies).
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    search = request.args.get("search")
    status_filter = request.args.get("status")
    sort_by = request.args.get("sort_by", "newest")

    studies = list_regulatory_studies(user, search=search, status_filter=status_filter, sort_by=sort_by)
    return jsonify({
        "success": True,
        "message": f"Found {len(studies)} studies in regulatory tracking pipeline",
        "data": studies,
    }), 200


@regulatory_bp.route("/studies/<identifier>", methods=["GET"])
@jwt_required()
@require_role("regulatory_admin", "researcher", "iec_secretariat")
def get_study_regulatory_dossier(identifier):
    """
    Retrieve comprehensive regulatory and CTRI dossier for a study.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    ok, msg, status_code, data = get_regulatory_dossier(identifier, user)
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200


@regulatory_bp.route("/studies/<identifier>", methods=["PUT"])
@jwt_required()
@require_role("regulatory_admin")
def update_study_regulatory_tracking(identifier):
    """
    Update regulatory clearance and CTRI registration parameters.
    Security: Regulatory Admin role only.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    ok, msg, status_code, data = update_regulatory_tracking(identifier, user, payload)
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200


@regulatory_bp.route("/studies/<identifier>/readiness", methods=["GET"])
@jwt_required()
@require_role("regulatory_admin", "researcher", "iec_secretariat")
def get_study_activation_readiness(identifier):
    """
    Evaluate the 9-point multi-phase prerequisite checklist for Study Activation.
    """
    ok, msg, status_code, data = evaluate_activation_readiness(identifier)
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200


@regulatory_bp.route("/studies/<identifier>/activate", methods=["POST"])
@jwt_required()
@require_role("regulatory_admin", "iec_secretariat")
def activate_clinical_study(identifier):
    """
    Execute Study Activation upon meeting all prerequisite requirements.
    Updates Study.status to 'activated' and unlocks Participant Management.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    payload = request.get_json(silent=True) or {}
    remarks = payload.get("remarks")

    ok, msg, status_code, data = activate_study(identifier, user, remarks=remarks)
    if not ok:
        return jsonify({
            "success": False,
            "message": msg,
            "data": data,
        }), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200
