from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from utils.security import require_role
from services.iec_decision_service import (
    get_study_decision_dossier,
    record_study_decision,
    load_study_decision,
)

iec_decision_bp = Blueprint("iec_decision", __name__, url_prefix="/api/iec")


def _get_authenticated_iec_user():
    """Retrieve current authenticated user and assert active IEC role."""
    if hasattr(g, "current_user") and g.current_user:
        return g.current_user

    user_id = get_jwt_identity()
    if not user_id:
        return None
    user = db.session.get(User, int(user_id))
    if user and user.is_active and user.role in ("iec_member", "iec_secretariat"):
        return user
    return None


@iec_decision_bp.route("/studies/<identifier>/decision-dossier", methods=["GET"])
@jwt_required()
@require_role("iec_member", "iec_secretariat")
def get_decision_dossier(identifier):
    """
    Retrieve comprehensive decision dossier for a clinical study.
    Accessible only to authorized IEC Members and IEC Secretariat.
    """
    ok, msg, status_code, data = get_study_decision_dossier(identifier)
    if not ok:
        return jsonify({
            "success": False,
            "message": msg,
        }), status_code

    return jsonify({
        "success": True,
        "message": msg,
        "data": data,
    }), 200


@iec_decision_bp.route("/studies/<identifier>/decision", methods=["POST"])
@jwt_required()
@require_role("iec_member", "iec_secretariat")
def submit_decision(identifier):
    """
    Record an official IEC Decision (Approved, Modify/Revision Required, Not Approved).
    Updates workflow status and logs crash-safe audit trail.
    """
    user = _get_authenticated_iec_user()
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    ok, msg, status_code, data = record_study_decision(identifier, user, payload)
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


from models.study import Study


@iec_decision_bp.route("/studies/<identifier>/decision", methods=["GET"])
@jwt_required()
@require_role("iec_member", "iec_secretariat")
def get_existing_decision(identifier):
    """
    Retrieve recorded official IEC Decision for a clinical study.
    """
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    lookup_keys = [str(identifier)]
    if study:
        if study.study_id and study.study_id not in lookup_keys:
            lookup_keys.append(study.study_id)
        if str(study.id) not in lookup_keys:
            lookup_keys.append(str(study.id))

    decision = None
    for k in lookup_keys:
        decision = load_study_decision(k)
        if decision:
            break

    if not decision:
        return jsonify({
            "success": True,
            "has_decision": False,
            "decision": None,
            "message": f"No official IEC Decision recorded for study '{identifier}'.",
        }), 200

    return jsonify({
        "success": True,
        "has_decision": True,
        "decision": decision,
    }), 200
