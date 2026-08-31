from flask import Blueprint, request, g
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from extensions import db
from models.user import User
from utils.security import verify_password, require_role


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


VALID_ROLES = {
    "researcher",
    "iec_secretariat",
    "iec_member",
    "regulatory_admin",
}


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email, password, and role, then return JWT token."""
    data = request.get_json(silent=True)

    if not data:
        return {
            "success": False,
            "message": "Request body must be JSON"
        }, 400

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not email or not password or not role:
        return {
            "success": False,
            "message": "Email, password, and role are required"
        }, 400

    email = email.strip().lower()
    role = role.strip().lower()

    if role not in VALID_ROLES:
        return {
            "success": False,
            "message": "Invalid role"
        }, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "success": False,
            "message": "Invalid credentials"
        }, 401

    if not verify_password(user.password_hash, password):
        return {
            "success": False,
            "message": "Invalid credentials"
        }, 401

    if user.role != role:
        return {
            "success": False,
            "message": "Invalid credentials or role"
        }, 401

    if not user.is_active:
        return {
            "success": False,
            "message": "User account is inactive"
        }, 403

    access_token = create_access_token(
        identity=str(user.id)
    )

    return {
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        }
    }, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Return authenticated user profile based on JWT token identity."""
    user_id = get_jwt_identity()

    user = db.session.get(User, int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }, 404

    if not user.is_active:
        return {
            "success": False,
            "message": "User account is inactive"
        }, 403

    return {
        "success": True,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        }
    }, 200


@auth_bp.route("/test/researcher", methods=["GET"])
@jwt_required()
@require_role("researcher")
def test_researcher_access():
    """Protected test endpoint for researcher role."""
    user = g.current_user
    return {
        "success": True,
        "message": "Researcher access granted",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    }, 200


@auth_bp.route("/test/iec-secretariat", methods=["GET"])
@jwt_required()
@require_role("iec_secretariat")
def test_iec_secretariat_access():
    """Protected test endpoint for IEC Secretariat role."""
    user = g.current_user
    return {
        "success": True,
        "message": "IEC Secretariat access granted",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    }, 200


@auth_bp.route("/test/iec-member", methods=["GET"])
@jwt_required()
@require_role("iec_member")
def test_iec_member_access():
    """Protected test endpoint for IEC Member role."""
    user = g.current_user
    return {
        "success": True,
        "message": "IEC Member access granted",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    }, 200


@auth_bp.route("/test/regulatory-admin", methods=["GET"])
@jwt_required()
@require_role("regulatory_admin")
def test_regulatory_admin_access():
    """Protected test endpoint for Regulatory Admin role."""
    user = g.current_user
    return {
        "success": True,
        "message": "Regulatory Admin access granted",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    }, 200