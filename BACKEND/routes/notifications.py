from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from services.notification_service import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_count,
)

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api")


def _get_authenticated_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required()
def list_notifications():
    """List real system notifications for current authenticated researcher."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or unauthorized"}), 403

    notifications = get_user_notifications(user.id)
    unread_count = sum(1 for n in notifications if not n.get("is_read"))

    return jsonify({
        "success": True,
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(notifications),
    }), 200


@notifications_bp.route("/notifications/<notification_id>/read", methods=["POST"])
@jwt_required()
def mark_read(notification_id: str):
    """Mark a specific notification as read."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or unauthorized"}), 403

    mark_notification_as_read(user.id, notification_id)
    return jsonify({
        "success": True,
        "message": f"Notification '{notification_id}' marked as read",
        "unread_count": get_unread_count(user.id),
    }), 200


@notifications_bp.route("/notifications/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read for current user."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or unauthorized"}), 403

    count = mark_all_notifications_as_read(user.id)
    return jsonify({
        "success": True,
        "message": f"Marked {count} notifications as read",
        "unread_count": 0,
    }), 200


@notifications_bp.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    """Get the unread notification count for badge counters."""
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User inactive or unauthorized"}), 403

    count = get_unread_count(user.id)
    return jsonify({
        "success": True,
        "unread_count": count,
    }), 200
