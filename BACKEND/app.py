from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt
from routes.auth import auth_bp
from routes.documents import documents_bp


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

    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)

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

    return app


app = create_app()

from models import User, Study, Document, DocumentVersion, QualityCheck

with app.app_context():
    db.create_all()



if __name__ == "__main__":
    app.run(debug=True)