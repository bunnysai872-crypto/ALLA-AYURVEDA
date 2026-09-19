from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.user import User
from models.study import Study
from models.protocol import Protocol
from utils.permissions import can_user_access_study

studies_bp = Blueprint("studies", __name__, url_prefix="/api")


def _get_authenticated_user():
    """Retrieve the current user from JWT identity."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


def _generate_next_study_id() -> str:
    """Generate the next unique formatted study_id (e.g. ALLA-2026-0003)."""
    current_year = datetime.utcnow().year
    prefix = f"ALLA-{current_year}-"

    last_study = (
        Study.query.filter(Study.study_id.like(f"{prefix}%"))
        .order_by(Study.id.desc())
        .first()
    )

    next_num = 1
    if last_study and last_study.study_id:
        try:
            parts = last_study.study_id.split("-")
            if len(parts) >= 3 and parts[-1].isdigit():
                next_num = int(parts[-1]) + 1
        except Exception:
            next_num = (last_study.id or 0) + 1

    candidate = f"{prefix}{next_num:04d}"
    while Study.query.filter_by(study_id=candidate).first() is not None:
        next_num += 1
        candidate = f"{prefix}{next_num:04d}"

    return candidate


@studies_bp.route("/studies", methods=["POST"])
@jwt_required()
def create_study():
    """
    Create a new clinical research study.
    Expected JSON payload with at least:
      - title (str, required)
      - study_type (str, required)
      - study_design (str, required)
      - research_objective (str, required)
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    if user.role != "researcher":
        return jsonify({"success": False, "message": "Only researchers can create studies"}), 403

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    title = (data.get("title") or "").strip()
    study_type = (data.get("study_type") or "").strip()
    study_design = (data.get("study_design") or "").strip()
    research_objective = (data.get("research_objective") or data.get("description") or "").strip()

    errors = {}
    if not title:
        errors["title"] = "Study Title is required."
    if not study_type:
        errors["study_type"] = "Study Type is required."
    if not study_design:
        errors["study_design"] = "Study Design is required."
    if not research_objective:
        errors["research_objective"] = "Research Objective is required."

    if errors:
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": errors
        }), 400

    protocol_num = (data.get("protocol_number") or "").strip()
    if protocol_num:
        existing = Study.query.filter_by(study_id=protocol_num).first()
        if existing:
            return jsonify({
                "success": False,
                "message": f"Protocol number / Study ID '{protocol_num}' already exists.",
                "errors": {"protocol_number": "Protocol number already in use."}
            }), 400
        study_id = protocol_num
    else:
        study_id = _generate_next_study_id()

    sample_size = data.get("estimated_sample_size")
    if sample_size is not None and sample_size != "":
        try:
            sample_size = int(sample_size)
        except (ValueError, TypeError):
            sample_size = None
    else:
        sample_size = None

    new_study = Study(
        study_id=study_id,
        researcher_id=user.id,
        title=title,
        short_title=(data.get("short_title") or "").strip() or None,
        study_type=study_type,
        study_design=study_design,
        condition=(data.get("condition") or "").strip() or None,
        ayurveda_intervention=(data.get("ayurveda_intervention") or "").strip() or None,
        research_objective=research_objective,
        primary_objective=(data.get("primary_objective") or "").strip() or None,
        secondary_objectives=(data.get("secondary_objectives") or "").strip() or None,
        study_duration=(data.get("study_duration") or "").strip() or None,
        target_population=(data.get("target_population") or "").strip() or None,
        estimated_sample_size=sample_size,
        status="draft",
    )

    try:
        db.session.add(new_study)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error creating study: {str(exc)}"
        }), 500

    study_dict = new_study.to_dict()
    return jsonify({
        "success": True,
        "message": "Study created successfully",
        "study": study_dict,
        "data": study_dict
    }), 201


@studies_bp.route("/studies", methods=["GET"])
@jwt_required()
def list_studies():
    """
    List research studies.
    Researchers only see studies where researcher_id == user.id.
    Reviewers and Admins see all studies.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    if user.role == "researcher":
        studies = (
            Study.query.filter_by(researcher_id=user.id)
            .order_by(Study.created_at.desc())
            .all()
        )
    else:
        studies = Study.query.order_by(Study.created_at.desc()).all()

    study_list = [s.to_dict() for s in studies]
    return jsonify({
        "success": True,
        "studies": study_list,
        "data": study_list
    }), 200


@studies_bp.route("/studies/<identifier>", methods=["GET"])
@jwt_required()
def get_study(identifier):
    """
    Fetch a single study by database ID (integer) or study_id (string).
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    is_allowed, err_msg = can_user_access_study(user, study, action="view")
    if not is_allowed:
        return jsonify({"success": False, "message": err_msg or "Permission denied"}), 403

    study_dict = study.to_dict()
    return jsonify({
        "success": True,
        "study": study_dict,
        "data": study_dict
    }), 200


@studies_bp.route("/studies/<identifier>", methods=["PUT"])
@jwt_required()
def update_study(identifier):
    """
    Update an existing study record.
    Allowed for study owner (researcher) or regulatory admin.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    # Authorization check: only study owner or regulatory admin can update
    if user.role == "researcher" and study.researcher_id != user.id:
        return jsonify({"success": False, "message": "You do not have permission to edit this study"}), 403

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    # Update metadata fields if provided
    if "title" in data and str(data["title"]).strip():
        study.title = str(data["title"]).strip()
    if "short_title" in data:
        study.short_title = str(data["short_title"]).strip() or None
    if "study_type" in data and str(data["study_type"]).strip():
        study.study_type = str(data["study_type"]).strip()
    if "study_design" in data and str(data["study_design"]).strip():
        study.study_design = str(data["study_design"]).strip()
    if "condition" in data:
        study.condition = str(data["condition"]).strip() or None
    if "ayurveda_intervention" in data:
        study.ayurveda_intervention = str(data["ayurveda_intervention"]).strip() or None
    if "research_objective" in data and str(data["research_objective"]).strip():
        study.research_objective = str(data["research_objective"]).strip()
    elif "description" in data and str(data["description"]).strip():
        study.research_objective = str(data["description"]).strip()
    if "primary_objective" in data:
        study.primary_objective = str(data["primary_objective"]).strip() or None
    if "secondary_objectives" in data:
        study.secondary_objectives = str(data["secondary_objectives"]).strip() or None
    if "study_duration" in data:
        study.study_duration = str(data["study_duration"]).strip() or None
    if "target_population" in data:
        study.target_population = str(data["target_population"]).strip() or None
    if "estimated_sample_size" in data:
        val = data["estimated_sample_size"]
        if val is not None and val != "":
            try:
                study.estimated_sample_size = int(val)
            except (ValueError, TypeError):
                pass
        else:
            study.estimated_sample_size = None
    if "status" in data and str(data["status"]).strip():
        study.status = str(data["status"]).strip().lower()

    study.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Database error updating study: {str(exc)}"}), 500

    study_dict = study.to_dict()
    return jsonify({
        "success": True,
        "message": "Study updated successfully",
        "study": study_dict,
        "data": study_dict
    }), 200


@studies_bp.route("/studies/<identifier>", methods=["DELETE"])
@jwt_required()
def delete_study(identifier):
    """
    Delete an existing study record.
    Security constraint: Only studies in 'draft' status can be deleted.
    Allowed for study owner (researcher) or regulatory admin.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()

    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    # Authorization check
    if user.role == "researcher" and study.researcher_id != user.id:
        return jsonify({"success": False, "message": "You do not have permission to delete this study"}), 403

    # Security check: only draft studies can be deleted
    if (study.status or "").lower().strip() != "draft":
        return jsonify({
            "success": False,
            "message": f"Cannot delete study with status '{study.status}'. Only studies in 'draft' status can be deleted."
        }), 400

    try:
        db.session.delete(study)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Database error deleting study: {str(exc)}"}), 500

    return jsonify({
        "success": True,
        "message": f"Study '{identifier}' has been permanently deleted."
    }), 200


# ==============================================================================
# PROTOCOL BUILDER — RESEARCHER ENDPOINTS
# ==============================================================================

def _lookup_study(identifier):
    """Resolve Study by integer database ID or string study_id."""
    if not identifier:
        return None
    study = None
    if str(identifier).isdigit():
        study = db.session.get(Study, int(identifier))
    if not study:
        study = Study.query.filter_by(study_id=str(identifier)).first()
    return study


def _parse_optional_str(val, max_len=None):
    """Trim string, return None if empty; optionally truncate to max length."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    if max_len and len(s) > max_len:
        return s[:max_len]
    return s


def _parse_optional_int(val):
    """Convert input to integer safely; return None on failure or blank."""
    if val is None or val == "":
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


@studies_bp.route("/studies/<identifier>/protocol", methods=["GET"])
@jwt_required()
def get_study_protocol(identifier):
    """
    Fetch protocol for a study.
    Security: Researcher role only, and researcher must own the study.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    if user.role != "researcher":
        return jsonify({"success": False, "message": "Only researchers can access the researcher Protocol Builder"}), 403

    study = _lookup_study(identifier)
    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    if study.researcher_id != user.id:
        return jsonify({"success": False, "message": "You do not have permission to access the protocol for this study"}), 403

    protocol = Protocol.query.filter_by(study_id=study.id).first()
    if not protocol:
        return jsonify({"success": False, "message": f"No protocol found for study '{identifier}'"}), 404

    protocol_dict = protocol.to_dict()
    return jsonify({
        "success": True,
        "protocol": protocol_dict,
        "data": protocol_dict,
    }), 200


@studies_bp.route("/studies/<identifier>/protocol", methods=["POST"])
@jwt_required()
def create_study_protocol(identifier):
    """
    Create a new protocol for a study.
    Security: Researcher role only, and researcher must own the study.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    if user.role != "researcher":
        return jsonify({"success": False, "message": "Only researchers can access the researcher Protocol Builder"}), 403

    study = _lookup_study(identifier)
    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    if study.researcher_id != user.id:
        return jsonify({"success": False, "message": "You do not have permission to create a protocol for this study"}), 403

    existing_protocol = Protocol.query.filter_by(study_id=study.id).first()
    if existing_protocol:
        return jsonify({
            "success": False,
            "message": f"Protocol already exists for study '{identifier}'. Use PUT to update.",
        }), 409

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    protocol_version = _parse_optional_str(data.get("protocol_version"), 50) or "1.0"
    protocol_title = _parse_optional_str(data.get("protocol_title"), 255) or study.title

    protocol = Protocol(
        study_id=study.id,
        protocol_title=protocol_title,
        protocol_version=protocol_version,
        protocol_date=_parse_optional_str(data.get("protocol_date"), 50),
        principal_investigator=_parse_optional_str(data.get("principal_investigator"), 150),
        sponsor=_parse_optional_str(data.get("sponsor"), 150),
        background=_parse_optional_str(data.get("background")),
        rationale=_parse_optional_str(data.get("rationale")),
        research_question=_parse_optional_str(data.get("research_question")),
        primary_objective=_parse_optional_str(data.get("primary_objective")),
        secondary_objectives=_parse_optional_str(data.get("secondary_objectives")),
        study_type=_parse_optional_str(data.get("study_type"), 100),
        study_design=_parse_optional_str(data.get("study_design"), 100),
        study_phase=_parse_optional_str(data.get("study_phase"), 100),
        randomization=_parse_optional_str(data.get("randomization"), 100),
        blinding=_parse_optional_str(data.get("blinding"), 100),
        control_type=_parse_optional_str(data.get("control_type"), 100),
        study_duration=_parse_optional_str(data.get("study_duration"), 100),
        target_population=_parse_optional_str(data.get("target_population"), 255),
        sample_size=_parse_optional_int(data.get("sample_size")),
        minimum_age=_parse_optional_int(data.get("minimum_age")),
        maximum_age=_parse_optional_int(data.get("maximum_age")),
        gender_criteria=_parse_optional_str(data.get("gender_criteria"), 50),
        inclusion_criteria=_parse_optional_str(data.get("inclusion_criteria")),
        exclusion_criteria=_parse_optional_str(data.get("exclusion_criteria")),
        intervention_name=_parse_optional_str(data.get("intervention_name"), 255),
        intervention_description=_parse_optional_str(data.get("intervention_description")),
        dosage=_parse_optional_str(data.get("dosage"), 255),
        route=_parse_optional_str(data.get("route"), 100),
        frequency=_parse_optional_str(data.get("frequency"), 100),
        intervention_duration=_parse_optional_str(data.get("intervention_duration"), 100),
        primary_outcomes=_parse_optional_str(data.get("primary_outcomes")),
        secondary_outcomes=_parse_optional_str(data.get("secondary_outcomes")),
        safety_monitoring=_parse_optional_str(data.get("safety_monitoring")),
        adverse_event_reporting=_parse_optional_str(data.get("adverse_event_reporting")),
    )

    try:
        db.session.add(protocol)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error creating protocol: {str(exc)}",
        }), 500

    protocol_dict = protocol.to_dict()
    return jsonify({
        "success": True,
        "message": "Protocol created successfully",
        "protocol": protocol_dict,
        "data": protocol_dict,
    }), 201


@studies_bp.route("/studies/<identifier>/protocol", methods=["PUT"])
@jwt_required()
def update_study_protocol(identifier):
    """
    Update protocol for a study.
    Upserts safely if no protocol exists yet.
    Security: Researcher role only, and researcher must own the study.
    """
    user = _get_authenticated_user()
    if not user or not user.is_active:
        return jsonify({"success": False, "message": "User account is inactive or not found"}), 403

    if user.role != "researcher":
        return jsonify({"success": False, "message": "Only researchers can access the researcher Protocol Builder"}), 403

    study = _lookup_study(identifier)
    if not study:
        return jsonify({"success": False, "message": f"Study '{identifier}' not found"}), 404

    if study.researcher_id != user.id:
        return jsonify({"success": False, "message": "You do not have permission to update the protocol for this study"}), 403

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be a valid JSON object"}), 400

    protocol = Protocol.query.filter_by(study_id=study.id).first()
    is_new = False
    if not protocol:
        protocol = Protocol(
            study_id=study.id,
            protocol_title=study.title,
            protocol_version="1.0",
        )
        db.session.add(protocol)
        is_new = True

    # Safely apply supplied fields while preserving others
    if "protocol_title" in data:
        protocol.protocol_title = _parse_optional_str(data.get("protocol_title"), 255)
    if "protocol_version" in data:
        pv = _parse_optional_str(data.get("protocol_version"), 50)
        if pv:
            protocol.protocol_version = pv
    if "protocol_date" in data:
        protocol.protocol_date = _parse_optional_str(data.get("protocol_date"), 50)
    if "principal_investigator" in data:
        protocol.principal_investigator = _parse_optional_str(data.get("principal_investigator"), 150)
    if "sponsor" in data:
        protocol.sponsor = _parse_optional_str(data.get("sponsor"), 150)
    if "background" in data:
        protocol.background = _parse_optional_str(data.get("background"))
    if "rationale" in data:
        protocol.rationale = _parse_optional_str(data.get("rationale"))
    if "research_question" in data:
        protocol.research_question = _parse_optional_str(data.get("research_question"))
    if "primary_objective" in data:
        protocol.primary_objective = _parse_optional_str(data.get("primary_objective"))
    if "secondary_objectives" in data:
        protocol.secondary_objectives = _parse_optional_str(data.get("secondary_objectives"))
    if "study_type" in data:
        protocol.study_type = _parse_optional_str(data.get("study_type"), 100)
    if "study_design" in data:
        protocol.study_design = _parse_optional_str(data.get("study_design"), 100)
    if "study_phase" in data:
        protocol.study_phase = _parse_optional_str(data.get("study_phase"), 100)
    if "randomization" in data:
        protocol.randomization = _parse_optional_str(data.get("randomization"), 100)
    if "blinding" in data:
        protocol.blinding = _parse_optional_str(data.get("blinding"), 100)
    if "control_type" in data:
        protocol.control_type = _parse_optional_str(data.get("control_type"), 100)
    if "study_duration" in data:
        protocol.study_duration = _parse_optional_str(data.get("study_duration"), 100)
    if "target_population" in data:
        protocol.target_population = _parse_optional_str(data.get("target_population"), 255)
    if "sample_size" in data:
        protocol.sample_size = _parse_optional_int(data.get("sample_size"))
    if "minimum_age" in data:
        protocol.minimum_age = _parse_optional_int(data.get("minimum_age"))
    if "maximum_age" in data:
        protocol.maximum_age = _parse_optional_int(data.get("maximum_age"))
    if "gender_criteria" in data:
        protocol.gender_criteria = _parse_optional_str(data.get("gender_criteria"), 50)
    if "inclusion_criteria" in data:
        protocol.inclusion_criteria = _parse_optional_str(data.get("inclusion_criteria"))
    if "exclusion_criteria" in data:
        protocol.exclusion_criteria = _parse_optional_str(data.get("exclusion_criteria"))
    if "intervention_name" in data:
        protocol.intervention_name = _parse_optional_str(data.get("intervention_name"), 255)
    if "intervention_description" in data:
        protocol.intervention_description = _parse_optional_str(data.get("intervention_description"))
    if "dosage" in data:
        protocol.dosage = _parse_optional_str(data.get("dosage"), 255)
    if "route" in data:
        protocol.route = _parse_optional_str(data.get("route"), 100)
    if "frequency" in data:
        protocol.frequency = _parse_optional_str(data.get("frequency"), 100)
    if "intervention_duration" in data:
        protocol.intervention_duration = _parse_optional_str(data.get("intervention_duration"), 100)
    if "primary_outcomes" in data:
        protocol.primary_outcomes = _parse_optional_str(data.get("primary_outcomes"))
    if "secondary_outcomes" in data:
        protocol.secondary_outcomes = _parse_optional_str(data.get("secondary_outcomes"))
    if "safety_monitoring" in data:
        protocol.safety_monitoring = _parse_optional_str(data.get("safety_monitoring"))
    if "adverse_event_reporting" in data:
        protocol.adverse_event_reporting = _parse_optional_str(data.get("adverse_event_reporting"))

    # Ensure protocol_version is not empty
    if not protocol.protocol_version:
        protocol.protocol_version = "1.0"

    # Invariant: protocol remains bound to this study; study workflow status is unaffected
    protocol.study_id = study.id
    protocol.updated_at = datetime.utcnow()

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error updating protocol: {str(exc)}",
        }), 500

    protocol_dict = protocol.to_dict()
    return jsonify({
        "success": True,
        "message": "Protocol created successfully" if is_new else "Protocol draft updated successfully",
        "protocol": protocol_dict,
        "data": protocol_dict,
    }), 200

