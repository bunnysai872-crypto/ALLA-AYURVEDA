from datetime import datetime
from threading import Lock

from models.study import Study
from models.protocol import Protocol
from models.document import Document
from models.quality_check import QualityCheck

# In-memory store for tracking read notification IDs per user (thread-safe)
_read_store_lock = Lock()
_user_read_notifications = {}  # { user_id: set(notification_ids) }


def _get_read_set(user_id: int) -> set:
    with _read_store_lock:
        if user_id not in _user_read_notifications:
            _user_read_notifications[user_id] = set()
        return set(_user_read_notifications[user_id])


def mark_notification_as_read(user_id: int, notification_id: str) -> bool:
    """Mark a single notification as read for a given user."""
    with _read_store_lock:
        if user_id not in _user_read_notifications:
            _user_read_notifications[user_id] = set()
        _user_read_notifications[user_id].add(str(notification_id))
    return True


def mark_all_notifications_as_read(user_id: int) -> int:
    """Mark all current notifications for user as read."""
    all_notifs = get_user_notifications(user_id)
    with _read_store_lock:
        if user_id not in _user_read_notifications:
            _user_read_notifications[user_id] = set()
        for n in all_notifs:
            _user_read_notifications[user_id].add(n["id"])
    return len(all_notifs)


def get_user_notifications(user_id: int) -> list:
    """
    Generate real, user-isolated system notifications derived from database records:
    - Studies created & status updates
    - Protocol drafting & revisions
    - Document uploads & version updates
    - AI Quality Gate evaluations & risk findings
    """
    read_ids = _get_read_set(user_id)
    notifications = []

    # 1. Studies owned by this researcher
    user_studies = (
        Study.query.filter_by(researcher_id=user_id)
        .order_by(Study.created_at.desc())
        .all()
    )

    study_ids = [s.id for s in user_studies]
    if not study_ids:
        return []

    for s in user_studies:
        # Notification: Study Registration
        notif_id = f"study-create-{s.id}"
        notifications.append({
            "id": notif_id,
            "title": f"Study Registered: {s.study_id}",
            "message": f"Clinical research study '{s.title}' was initialized in draft status.",
            "category": "study",
            "severity": "info",
            "study_id": s.id,
            "study_code": s.study_id,
            "study_title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "is_read": notif_id in read_ids,
        })

        # Notification: Status changed beyond draft
        if s.status and s.status.lower() != "draft":
            notif_status_id = f"study-status-{s.id}-{s.status}"
            notifications.append({
                "id": notif_status_id,
                "title": f"Status Update: {s.study_id}",
                "message": f"Study lifecycle status transitioned to '{s.status.replace('_', ' ').title()}'.",
                "category": "regulatory",
                "severity": "success" if s.status == "approved" else "warning",
                "study_id": s.id,
                "study_code": s.study_id,
                "study_title": s.title,
                "created_at": s.updated_at.isoformat() if s.updated_at else None,
                "is_read": notif_status_id in read_ids,
            })

    # 2. Protocols on user studies
    protocols = Protocol.query.filter(Protocol.study_id.in_(study_ids)).all()
    for p in protocols:
        s = next((st for st in user_studies if st.id == p.study_id), None)
        notif_proto_id = f"proto-{p.id}-v{p.protocol_version}"
        notifications.append({
            "id": notif_proto_id,
            "title": f"Protocol Active (v{p.protocol_version})",
            "message": f"Standardized Ayurveda clinical protocol '{p.protocol_title or (s.title if s else 'Trial')}' is saved.",
            "category": "protocol",
            "severity": "success",
            "study_id": p.study_id,
            "study_code": s.study_id if s else f"Study #{p.study_id}",
            "study_title": s.title if s else "Research Study",
            "created_at": (p.updated_at or p.created_at).isoformat() if (p.updated_at or p.created_at) else None,
            "is_read": notif_proto_id in read_ids,
        })

    # 3. Documents on user studies
    documents = (
        Document.query.filter(
            Document.study_id.in_(study_ids),
            Document.is_deleted == False
        )
        .order_by(Document.created_at.desc())
        .all()
    )

    for doc in documents:
        s = next((st for st in user_studies if st.id == doc.study_id), None)
        notif_doc_id = f"doc-{doc.id}-v{doc.current_version}"
        notifications.append({
            "id": notif_doc_id,
            "title": f"Document Uploaded: {doc.original_filename}",
            "message": f"New asset ({doc.document_type.replace('_', ' ').upper()}) added to repository at version v{doc.current_version}.0.",
            "category": "document",
            "severity": "info",
            "study_id": doc.study_id,
            "study_code": s.study_id if s else f"Study #{doc.study_id}",
            "study_title": s.title if s else "Research Study",
            "created_at": (doc.updated_at or doc.created_at).isoformat() if (doc.updated_at or doc.created_at) else None,
            "is_read": notif_doc_id in read_ids,
        })

    # 4. Quality Checks on user studies
    quality_checks = (
        QualityCheck.query.filter(QualityCheck.study_id.in_(study_ids))
        .order_by(QualityCheck.created_at.desc())
        .all()
    )

    for qc in quality_checks:
        s = next((st for st in user_studies if st.id == qc.study_id), None)
        notif_qc_id = f"qc-{qc.id}"
        severity = "success" if qc.score and qc.score >= 80 else ("warning" if qc.score and qc.score >= 60 else "critical")
        notifications.append({
            "id": notif_qc_id,
            "title": f"AI Quality Gate Executed ({qc.score}/100)",
            "message": f"{qc.summary or 'Automated cross-document review completed.'}",
            "category": "quality_gate",
            "severity": severity,
            "study_id": qc.study_id,
            "study_code": s.study_id if s else f"Study #{qc.study_id}",
            "study_title": s.title if s else "Research Study",
            "created_at": qc.created_at.isoformat() if qc.created_at else None,
            "is_read": notif_qc_id in read_ids,
        })

    # Sort all notifications newest first
    notifications.sort(
        key=lambda x: x["created_at"] or "",
        reverse=True
    )

    return notifications


def get_unread_count(user_id: int) -> int:
    """Calculate the number of unread notifications for a user."""
    notifs = get_user_notifications(user_id)
    return sum(1 for n in notifs if not n.get("is_read"))
