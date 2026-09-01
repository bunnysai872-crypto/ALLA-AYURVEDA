from models.user import User
from models.study import Study


def can_user_access_study(
    user: User,
    study: Study,
    action: str = "view",
) -> tuple[bool, str | None]:
    """
    Evaluate if a user has permission to perform a specific action on a study.
    
    Actions:
        - "view" / "list": List and view study documents.
        - "download": Download study documents or versions.
        - "quality_data": Access AI Quality Gate preparation data.
        - "upload" / "create_version": Upload new documents or versions.
        - "update": Modify document metadata.
        - "delete": Soft delete a study document.
        
    Returns:
        (is_allowed, error_message)
    """
    if not user or not user.is_active:
        return False, "User account is inactive"

    role = (user.role or "").strip().lower()

    # Regulatory Admin has full access to all studies and documents
    if role == "regulatory_admin":
        return True, None

    # IEC Secretariat and Members have read/review access across studies
    if role in {"iec_secretariat", "iec_member"}:
        if action in {"view", "list", "download", "quality_data"}:
            return True, None
        return False, f"Role '{role}' does not have permission to modify study documents"

    # Researchers can only access and manage their own studies
    if role == "researcher":
        if study.principal_investigator_id == user.id:
            return True, None
        return False, "You do not have permission to access this study"

    return False, "Unauthorized role"

