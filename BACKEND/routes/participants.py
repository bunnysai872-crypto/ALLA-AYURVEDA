from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from utils.security import require_role
from services.participant_service import (
    list_participants,
    create_participant,
    update_participant_status,
    record_informed_consent,
)

participants_bp = Blueprint("participants", __name__, url_prefix="/api")


def _get_authenticated_user() -> User | None:
    """Retrieve current authenticated user from JWT identity."""
    if hasattr(g, "current_user") and g.current_user:
        return g.current_user
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


@participants_bp.route("/studies/<identifier>/participants", methods=["GET"])
@jwt_required()
@require_role("researcher", "regulatory_admin")
def get_study_participants(identifier):
    """
    List participants for a clinical study.
    Enforces study-level isolation and researcher ownership check.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    search = request.args.get("search")
    status_filter = request.args.get("status")
    consent_filter = request.args.get("consent")

    ok, msg, status_code, data = list_participants(
        identifier,
        user,
        search=search,
        status_filter=status_filter,
        consent_filter=consent_filter,
    )
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200


@participants_bp.route("/studies/<identifier>/participants", methods=["POST"])
@jwt_required()
@require_role("researcher", "regulatory_admin")
def register_participant(identifier):
    """
    Register a new de-identified participant in an activated clinical study.
    Study must be in 'activated' status.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    ok, msg, status_code, data = create_participant(identifier, user, payload)
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 201


@participants_bp.route("/studies/<identifier>/participants/<participant_ref>/status", methods=["PATCH"])
@jwt_required()
@require_role("researcher", "regulatory_admin")
def patch_participant_status(identifier, participant_ref):
    """
    Update participant lifecycle status.
    Enforces the Informed Consent prerequisite before transitioning to Enrolled or Active.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    ok, msg, status_code, data = update_participant_status(identifier, participant_ref, user, payload)
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


@participants_bp.route("/studies/<identifier>/participants/<participant_ref>/consent", methods=["POST"])
@jwt_required()
@require_role("researcher", "regulatory_admin")
def submit_informed_consent(identifier, participant_ref):
    """
    Record or update an official Informed Consent status for a study participant.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or session invalid"}), 403

    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    ok, msg, status_code, data = record_informed_consent(identifier, participant_ref, user, payload)
    if not ok:
        return jsonify({"success": False, "message": msg}), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200
