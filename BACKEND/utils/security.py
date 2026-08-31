from functools import wraps
from flask import g
from flask_jwt_extended import get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


def hash_password(password: str) -> str:
    """Create a secure password hash."""
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Verify a plain password against its stored hash."""
    return check_password_hash(password_hash, password)


def require_role(*allowed_roles):
    """
    Decorator to restrict endpoint access to users with specified role(s).
    Must be used in conjunction with @jwt_required().
    
    Returns:
        - 401/404 if identity is missing or user does not exist.
        - 403 if user account is inactive or role is not permitted.
    """
    # Flatten if a list/tuple was passed as single argument
    if len(allowed_roles) == 1 and isinstance(allowed_roles[0], (list, tuple, set)):
        normalized_roles = {str(r).strip().lower() for r in allowed_roles[0]}
    else:
        normalized_roles = {str(r).strip().lower() for r in allowed_roles}

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from models.user import User

            user_id = get_jwt_identity()
            if not user_id:
                return {
                    "success": False,
                    "message": "Unauthorized"
                }, 401

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

            if user.role.strip().lower() not in normalized_roles:
                return {
                    "success": False,
                    "message": "Access forbidden: insufficient permissions"
                }, 403

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator