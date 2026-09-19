from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt
from routes.auth import auth_bp
from routes.documents import documents_bp
from routes.studies import studies_bp
from routes.notifications import notifications_bp
from routes.profile import profile_bp
from routes.iec_secretariat import iec_secretariat_bp
from routes.iec_member import iec_member_bp
from routes.ai_review_summary import ai_review_summary_bp
from routes.iec_decision import iec_decision_bp
from routes.regulatory import regulatory_bp
from routes.participants import participants_bp


def register_jwt_handlers(jwt_manager):
    """Register custom JWT error handlers for uniform JSON responses."""
    @jwt_manager.unauthorized_loader
    def unauthorized_callback(error_string):
        return jsonify({
            "success": False,
            "message": "Missing Authorization Header"
        }), 401

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            "success": False,
            "message": "Invalid token"
        }), 401

    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "message": "Token has expired"
        }), 401

    @jwt_manager.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "message": "Token has been revoked"
        }), 401


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    register_jwt_handlers(jwt)

    cors_origins = Config.CORS_ORIGINS
    if cors_origins and "," in cors_origins:
        cors_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
    CORS(app, resources={r"/*": {"origins": cors_origins}}, supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(studies_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(iec_secretariat_bp)
    app.register_blueprint(iec_member_bp)
    app.register_blueprint(ai_review_summary_bp)
    app.register_blueprint(iec_decision_bp)
    app.register_blueprint(regulatory_bp)
    app.register_blueprint(participants_bp)

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "message": "File is too large"
        }), 413

    @app.route("/")
    def home():
        return {
            "success": True,
            "message": "ALLA Ayurveda Backend is running"
        }

    @app.route("/api/health")
    def health_check():
        db_status = "connected"
        http_code = 200
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
            http_code = 503
        return jsonify({
            "success": http_code == 200,
            "status": "healthy" if http_code == 200 else "degraded",
            "database": db_status
        }), http_code

    return app


app = create_app()

from models import (
    User,
    Study,
    Document,
    DocumentVersion,
    QualityCheck,
    Protocol,
    RegulatoryTracking,
    Participant,
    InformedConsent,
)

with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"[ALLA Ayurveda Startup] Note: Could not auto-create tables on startup: {e}")



if __name__ == "__main__":
    app.run(debug=True)