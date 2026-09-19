import os
import sys
import unittest
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import app
from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from models.protocol import Protocol
from models.quality_check import QualityCheck
from models.regulatory import RegulatoryTracking
from models.participant import Participant, InformedConsent
from services.iec_member_service import save_study_review, _get_study_review_file_path
from services.iec_decision_service import save_study_decision, _get_study_decision_file_path


class EndToEndWorkflowLifecycleTestCase(unittest.TestCase):
    """
    PHASE 12 — FINAL INTEGRATION VERIFICATION
    Full End-to-End Test demonstrating the complete lifecycle:
      1. Researcher logs in.
      2. Researcher opens a study.
      3. Study reaches IEC review.
      4. IEC Member completes review.
      5. AI Review Summary is displayed.
      6. Authorized IEC user makes a decision (Approved).
      7. Approved study enters Regulatory & CTRI Tracking.
      8. Regulatory Admin updates required regulatory/CTRI information.
      9. Study becomes Ready for Activation.
      10. Authorized user activates the study.
      11. Researcher opens Participant Management.
      12. Researcher adds a participant (Screened).
      13. Informed Consent workflow is opened.
      14. Consent status is recorded (Consented).
      15. Participant can progress to Enrolled & Active.
    """

    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Seed / Retrieve All 4 Roles
            roles_setup = [
                ("researcher", "e2e_res@test.com", "Dr. E2E Researcher"),
                ("iec_secretariat", "e2e_sec@test.com", "E2E Secretariat"),
                ("iec_member", "e2e_mem@test.com", "Dr. E2E Member"),
                ("regulatory_admin", "e2e_adm@test.com", "E2E Regulatory Admin"),
            ]
            cls.users = {}
            for role, email, name in roles_setup:
                u = User.query.filter_by(email=email).first()
                if not u:
                    u = User(full_name=name, email=email, role=role, is_active=True)
                    u.set_password("AllaTest123!")
                    db.session.add(u)
                    db.session.commit()
                cls.users[role] = u

            # Clean up any leftover files or records from prior runs
            dec_f = _get_study_decision_file_path("ALLA-E2E-2026-001")
            if os.path.exists(dec_f):
                try:
                    os.remove(dec_f)
                except Exception:
                    pass

            rev_f = _get_study_review_file_path("ALLA-E2E-2026-001")
            if os.path.exists(rev_f):
                try:
                    os.remove(rev_f)
                except Exception:
                    pass

            # Create an E2E Study
            study = Study.query.filter_by(study_id="ALLA-E2E-2026-001").first()
            if not study:
                study = Study(
                    study_id="ALLA-E2E-2026-001",
                    researcher_id=cls.users["researcher"].id,
                    title="Clinical Evaluation of Haridra Extract in Metabolic Health",
                    short_title="Haridra Metabolic Trial",
                    study_type="interventional",
                    study_design="double_blind_rct",
                    condition="Metabolic Syndrome",
                    research_objective="Investigate glucose homeostasis with standardized Haridra formulation",
                    status="draft",
                    estimated_sample_size=60,
                )
                db.session.add(study)
                db.session.commit()
            else:
                study.status = "draft"
                # Remove participants & tracking from previous test run
                Participant.query.filter_by(study_id=study.id).delete()
                RegulatoryTracking.query.filter_by(study_id=study.id).delete()
                db.session.commit()
            cls.study_id = study.id
            cls.study = study

            # Create Protocol
            proto = Protocol.query.filter_by(study_id=cls.study.id).first()
            if not proto:
                proto = Protocol(
                    study_id=cls.study.id,
                    protocol_title=cls.study.title,
                    protocol_version="1.0",
                    rationale="Curcuminoids modulate inflammatory signaling in metabolic dysregulation.",
                    primary_objective="Assess HbA1c reduction over 12 weeks",
                    study_duration="24 weeks",
                    target_population="Adults aged 30-65 with impaired fasting glucose",
                )
                db.session.add(proto)
                db.session.commit()

            # Upload Mandatory Documents
            doc_p = Document.query.filter_by(study_id=cls.study.id, document_type="protocol").first()
            if not doc_p:
                doc_p = Document(
                    study_id=cls.study.id,
                    uploaded_by=cls.users["researcher"].id,
                    original_filename="Haridra_Trial_Protocol_v1.0.pdf",
                    storage_path="/uploads/e2e_protocol.pdf",
                    document_type="protocol",
                    mime_type="application/pdf",
                    file_size=4096,
                    status="verified",
                )
                db.session.add(doc_p)

            doc_c = Document.query.filter_by(study_id=cls.study.id, document_type="informed_consent").first()
            if not doc_c:
                doc_c = Document(
                    study_id=cls.study.id,
                    uploaded_by=cls.users["researcher"].id,
                    original_filename="Haridra_Informed_Consent_v1.0.pdf",
                    storage_path="/uploads/e2e_icf.pdf",
                    document_type="informed_consent",
                    mime_type="application/pdf",
                    file_size=2048,
                    status="verified",
                )
                db.session.add(doc_c)
            db.session.commit()
            cls.icf_doc_id = doc_c.id

            # Create Quality Check (Score 88)
            qc = QualityCheck.query.filter_by(study_id=cls.study.id).first()
            if not qc:
                qc = QualityCheck(
                    study_id=cls.study.id,
                    status="passed",
                    score=88,
                    summary="High protocol consistency, sound statistical planning.",
                    checked_by=cls.users["researcher"].id,
                )
                db.session.add(qc)
                db.session.commit()

            # Save user IDs and tokens while session is active
            cls.user_ids = {role: u.id for role, u in cls.users.items()}
            cls.user_names = {role: u.full_name for role, u in cls.users.items()}
            cls.tokens = {
                role: create_access_token(identity=str(cls.user_ids[role]))
                for role in cls.users
            }

    def test_complete_end_to_end_lifecycle(self):
        """Execute full 15-step clinical trial lifecycle from draft to active enrollment."""
        study_id = "ALLA-E2E-2026-001"

        # -------------------------------------------------------------
        # Step 1: Researcher Authentication
        # -------------------------------------------------------------
        res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["user"]["role"], "researcher")

        # -------------------------------------------------------------
        # Step 2: Researcher Opens Study Details
        # -------------------------------------------------------------
        res = self.client.get(
            f"/api/studies/{study_id}",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
        )
        self.assertEqual(res.status_code, 200)
        study_data = res.get_json()["study"]
        self.assertEqual(study_data["study_id"], study_id)

        # -------------------------------------------------------------
        # Step 3: Study Moves to Under IEC Review
        # -------------------------------------------------------------
        with self.app.app_context():
            st = Study.query.filter_by(study_id=study_id).first()
            st.status = "under_iec_review"
            db.session.commit()

        # -------------------------------------------------------------
        # Step 4: IEC Member Submits Ethical Review
        # -------------------------------------------------------------
        review_record = {
            "review_id": f"rev_{self.study_id}_{self.user_ids['iec_member']}_1",
            "study_id": study_id,
            "reviewer": {
                "id": self.user_ids["iec_member"],
                "full_name": self.user_names["iec_member"],
                "role": "iec_member",
            },
            "recommendation": "approve",
            "overall_comments": "Trial design adheres to ICMR and Ayurvedic ethics standards.",
            "review_timestamp": datetime.utcnow().isoformat() + "Z",
        }
        save_study_review(study_id, review_record)

        # Update status to iec_recommendation_submitted
        with self.app.app_context():
            st = Study.query.filter_by(study_id=study_id).first()
            st.status = "iec_recommendation_submitted"
            db.session.commit()

        # -------------------------------------------------------------
        # Step 5: AI Review Summary Synthesized
        # -------------------------------------------------------------
        res = self.client.get(
            f"/api/iec/review-summary/{study_id}",
            headers={"Authorization": f"Bearer {self.tokens['iec_member']}"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["success"])

        # -------------------------------------------------------------
        # Step 6: Authorized IEC Decision (Approved)
        # -------------------------------------------------------------
        decision_payload = {
            "decision": "approved",
            "remarks": "Ethical committee approves study without amendment.",
            "conditions": "Quarterly adverse event reporting mandatory.",
        }
        res = self.client.post(
            f"/api/iec/studies/{study_id}/decision",
            headers={"Authorization": f"Bearer {self.tokens['iec_member']}"},
            json=decision_payload,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["study"]["status"], "approved")

        # -------------------------------------------------------------
        # Step 7: Approved Study Enters Regulatory & CTRI Pipeline
        # -------------------------------------------------------------
        res = self.client.get(
            "/api/regulatory/studies",
            headers={"Authorization": f"Bearer {self.tokens['regulatory_admin']}"},
        )
        self.assertEqual(res.status_code, 200)
        all_studies = res.get_json()["data"]
        matching = [s for s in all_studies if s["study_id"] == study_id]
        self.assertEqual(len(matching), 1)

        # -------------------------------------------------------------
        # Step 8: Regulatory Admin Updates Regulatory & CTRI Information
        # -------------------------------------------------------------
        reg_payload = {
            "regulatory_status": "Approved/Registered",
            "regulatory_reference_number": "AYUSH-E2E-2026-088",
            "regulatory_approval_date": "2026-09-18",
            "regulatory_remarks": "Official Ayush central clearance issued.",
            "ctri_status": "Approved/Registered",
            "ctri_reg_number": "CTRI/2026/09/099881",
            "ctri_registration_date": "2026-09-18",
            "ctri_remarks": "Trial indexed in national public trial registry.",
        }
        res = self.client.put(
            f"/api/regulatory/studies/{study_id}",
            headers={"Authorization": f"Bearer {self.tokens['regulatory_admin']}"},
            json=reg_payload,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["ctri"]["reg_number"], "CTRI/2026/09/099881")

        # -------------------------------------------------------------
        # Step 9: Study Evaluated as Ready for Activation
        # -------------------------------------------------------------
        res = self.client.get(
            f"/api/regulatory/studies/{study_id}/readiness",
            headers={"Authorization": f"Bearer {self.tokens['regulatory_admin']}"},
        )
        self.assertEqual(res.status_code, 200)
        readiness = res.get_json()["data"]
        self.assertEqual(readiness["overall_status"], "ready_for_activation")
        self.assertTrue(readiness["is_ready"])

        # -------------------------------------------------------------
        # Step 10: Authorized Regulatory Admin Activates the Study
        # -------------------------------------------------------------
        res = self.client.post(
            f"/api/regulatory/studies/{study_id}/activate",
            headers={"Authorization": f"Bearer {self.tokens['regulatory_admin']}"},
            json={"remarks": "Study certified for clinical trial initiation."},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["study"]["status"], "activated")

        # -------------------------------------------------------------
        # Step 11: Researcher Opens Participant Management
        # -------------------------------------------------------------
        res = self.client.get(
            f"/api/studies/{study_id}/participants",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["data"]["study"]["is_activated"])
        self.assertEqual(res.get_json()["data"]["stats"]["total"], 0)

        # -------------------------------------------------------------
        # Step 12: Researcher Adds a Participant
        # -------------------------------------------------------------
        part_payload = {
            "initials": "K.P.",
            "age": 49,
            "gender": "Female",
            "prakriti": "Pitta-Kapha",
            "screening_date": "2026-09-18",
            "notes": "Subject meets fasting glycemia inclusion criteria.",
        }
        res = self.client.post(
            f"/api/studies/{study_id}/participants",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
            json=part_payload,
        )
        self.assertEqual(res.status_code, 201)
        part = res.get_json()["data"]
        participant_id = part["participant_id"]
        self.assertEqual(part["status"], "Screened")
        self.assertEqual(part["consent"]["status"], "Not Started")

        # -------------------------------------------------------------
        # Step 13: Attempt Enrollment Before Consent -> Blocked!
        # -------------------------------------------------------------
        res = self.client.patch(
            f"/api/studies/{study_id}/participants/{participant_id}/status",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
            json={"status": "Enrolled"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Informed Consent must be in 'Consented' status", res.get_json()["message"])

        # -------------------------------------------------------------
        # Step 14: Informed Consent Workflow Executed (Consented)
        # -------------------------------------------------------------
        consent_payload = {
            "status": "Consented",
            "consent_date": "2026-09-18 14:30:00 UTC",
            "witness_name": "Dr. Suresh Verma",
            "language": "Hindi",
            "remarks": "Participant voluntarily consented in presence of clinical witness.",
            "consent_document_id": self.icf_doc_id,
        }
        res = self.client.post(
            f"/api/studies/{study_id}/participants/{participant_id}/consent",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
            json=consent_payload,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["consent"]["status"], "Consented")
        self.assertTrue(res.get_json()["data"]["consent"]["is_consented"])

        # -------------------------------------------------------------
        # Step 15: Participant Enrolled & Active in Clinical Trial
        # -------------------------------------------------------------
        res = self.client.patch(
            f"/api/studies/{study_id}/participants/{participant_id}/status",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
            json={"status": "Enrolled"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["status"], "Enrolled")

        res = self.client.patch(
            f"/api/studies/{study_id}/participants/{participant_id}/status",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
            json={"status": "Active"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["data"]["status"], "Active")

        # Confirm stats updated
        res = self.client.get(
            f"/api/studies/{study_id}/participants",
            headers={"Authorization": f"Bearer {self.tokens['researcher']}"},
        )
        self.assertEqual(res.status_code, 200)
        stats = res.get_json()["data"]["stats"]
        self.assertEqual(stats["total"], 1)
        self.assertEqual(stats["active"], 1)
        self.assertEqual(stats["consented"], 1)


if __name__ == "__main__":
    unittest.main()
