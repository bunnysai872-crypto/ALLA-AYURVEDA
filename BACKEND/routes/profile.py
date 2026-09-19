from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.study import Study

profile_bp = Blueprint("profile", __name__, url_prefix="/api")


def _get_authenticated_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    """Fetch current user profile with study and activity metrics."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or not found"}), 403

    study_count = Study.query.filter_by(researcher_id=user.id).count()

    profile_dict = user.to_dict()
    profile_dict["study_count"] = study_count

    return jsonify({
        "success": True,
        "profile": profile_dict,
        "user": profile_dict,
    }), 200


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_user_profile():
    """Update supported user profile fields (e.g. full_name)."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or not found"}), 403

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    full_name = (data.get("full_name") or "").strip()
    if not full_name:
        return jsonify({"success": False, "message": "Full name cannot be empty"}), 400

    user.full_name = full_name
    user.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Database error updating profile: {str(exc)}"}), 500

    profile_dict = user.to_dict()
    return jsonify({
        "success": True,
        "message": "Profile updated successfully",
        "profile": profile_dict,
        "user": profile_dict,
    }), 200
