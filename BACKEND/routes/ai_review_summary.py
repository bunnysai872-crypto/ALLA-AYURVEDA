"""
ALLA AYURVEDA — AI REVIEW SUMMARY ROUTE MODULE
Isolated Route Module for Synthesized AI Review Summary.

FUTURE INTEGRATION INSTRUCTIONS (To be executed in later integration phase):
To activate this blueprint in the main Flask server when ready:
  1. In BACKEND/app.py:
       from routes.ai_review_summary import ai_review_summary_bp
       app.register_blueprint(ai_review_summary_bp)
  2. Endpoint will then be live at:
       GET /api/iec/review-summary/<identifier>

SECURITY POLICY:
  - Requires valid JWT token.
  - Authorized roles: 'iec_member', 'iec_secretariat'.
  - Unauthorized roles ('researcher', 'regulatory_admin') receive 403 Forbidden.
  - Missing/invalid JWT receives 401 Unauthorized.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from utils.security import require_role
from services.ai_review_summary_service import generate_ai_review_summary

ai_review_summary_bp = Blueprint("ai_review_summary", __name__, url_prefix="/api/iec")


@ai_review_summary_bp.route("/review-summary/<identifier>", methods=["GET"])
@jwt_required()
@require_role("iec_member", "iec_secretariat")
def get_ai_review_summary(identifier):
    """
    Retrieve deterministic, read-only AI-Assisted Review Summary for a study.
    Accessible only to IEC Members and IEC Secretariat.
    
    Status codes:
      200 OK: Summary synthesized successfully.
      401 Unauthorized: Missing or invalid JWT token.
      403 Forbidden: User role is not iec_member or iec_secretariat.
      404 Not Found: Study not found.
      409 Conflict: IEC Member recommendation is not yet available for this study.
    """
    ok, message, status_code, summary_data = generate_ai_review_summary(identifier)
    if not ok:
        return jsonify({
            "success": False,
            "message": message,
        }), status_code

    return jsonify({
        "success": True,
        "message": message,
        "data": summary_data,
    }), 200
