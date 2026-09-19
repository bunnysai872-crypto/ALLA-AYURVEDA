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
from models.participant import Participant, InformedConsent


class ParticipantsAndConsentTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Setup PI Researcher 1
            r1 = User.query.filter_by(email="pi_part_1@test.com").first()
            if not r1:
                r1 = User(full_name="Dr. PI One", email="pi_part_1@test.com", role="researcher", is_active=True)
                r1.set_password("Pass123!")
                db.session.add(r1)
                db.session.commit()
            cls.r1_id = r1.id

            # Setup PI Researcher 2 (for isolation testing)
            r2 = User.query.filter_by(email="pi_part_2@test.com").first()
            if not r2:
                r2 = User(full_name="Dr. PI Two", email="pi_part_2@test.com", role="researcher", is_active=True)
                r2.set_password("Pass123!")
                db.session.add(r2)
                db.session.commit()
            cls.r2_id = r2.id

            # Activated Study for R1
            s_active = Study.query.filter_by(study_id="ALLA-PART-ACT-001").first()
            if not s_active:
                s_active = Study(
                    study_id="ALLA-PART-ACT-001",
                    researcher_id=cls.r1_id,
                    title="Ayurveda Guggulu Clinical Trial",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    research_objective="Evaluate lipid reduction with Triphala Guggulu",
                    status="activated",
                    estimated_sample_size=50,
                )
                db.session.add(s_active)
                db.session.commit()
            cls.study_active_id = s_active.id
            cls.study_active_num = s_active.study_id

            # Non-activated (Draft) Study for R1
            s_draft = Study.query.filter_by(study_id="ALLA-PART-DFT-001").first()
            if not s_draft:
                s_draft = Study(
                    study_id="ALLA-PART-DFT-001",
                    researcher_id=cls.r1_id,
                    title="Draft Neem Clinical Study",
                    study_type="observational",
                    study_design="cohort",
                    research_objective="Observe dermal responses",
                    status="draft",
                )
                db.session.add(s_draft)
                db.session.commit()
            cls.study_draft_id = s_draft.id
            cls.study_draft_num = s_draft.study_id

            # Study for R2 (for isolation testing)
            s_r2 = Study.query.filter_by(study_id="ALLA-PART-R2-001").first()
            if not s_r2:
                s_r2 = Study(
                    study_id="ALLA-PART-R2-001",
                    researcher_id=cls.r2_id,
                    title="Researcher Two Brahmi Study",
                    study_type="interventional",
                    study_design="open_label",
                    research_objective="Cognitive assessment",
                    status="activated",
                )
                db.session.add(s_r2)
                db.session.commit()
            cls.study_r2_id = s_r2.id
            cls.study_r2_num = s_r2.study_id

            # Consent Document for active study
            doc = Document.query.filter_by(study_id=cls.study_active_id, document_type="informed_consent").first()
            if not doc:
                doc = Document(
                    study_id=cls.study_active_id,
                    uploaded_by=cls.r1_id,
                    original_filename="Guggulu_ICF_v2.0.pdf",
                    storage_path="/uploads/icf_v2.pdf",
                    document_type="informed_consent",
                    mime_type="application/pdf",
                    file_size=1024,
                    status="verified",
                    current_version=2,
                )
                db.session.add(doc)
                db.session.commit()
            cls.doc_id = doc.id

        with cls.app.app_context():
            cls.r1_token = create_access_token(identity=str(cls.r1_id))
            cls.r2_token = create_access_token(identity=str(cls.r2_id))

    def test_01_get_participants_unauthorized(self):
        """401 on missing token."""
        res = self.client.get(f"/api/studies/{self.study_active_num}/participants")
        self.assertEqual(res.status_code, 401)

    def test_02_get_participants_forbidden_for_other_researcher(self):
        """403 when researcher attempts to access another researcher's study participants."""
        res = self.client.get(
            f"/api/studies/{self.study_active_num}/participants",
            headers={"Authorization": f"Bearer {self.r2_token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_03_create_participant_blocked_for_non_activated_study(self):
        """400 when attempting to register participant in non-activated study."""
        payload = {
            "initials": "A.S.",
            "age": 42,
            "gender": "Male",
            "prakriti": "Pitta-Kapha",
        }
        res = self.client.post(
            f"/api/studies/{self.study_draft_num}/participants",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("must be in 'activated' status", data["message"])

    def test_04_create_participant_success_in_activated_study(self):
        """201 when participant is registered in activated study."""
        payload = {
            "initials": "V.K.",
            "age": 38,
            "gender": "Female",
            "prakriti": "Vata-Pitta",
            "notes": "Patient meets primary lipid criteria",
        }
        res = self.client.post(
            f"/api/studies/{self.study_active_num}/participants",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("SUBJ-", data["data"]["participant_id"])
        self.assertEqual(data["data"]["status"], "Screened")
        self.assertEqual(data["data"]["consent"]["status"], "Not Started")
        self.assertFalse(data["data"]["consent"]["is_consented"])
        ParticipantsAndConsentTestCase.test_participant_id = data["data"]["participant_id"]

    def test_05_enrollment_blocked_without_consent(self):
        """400 safety guard: Participant cannot be Enrolled if consent is not 'Consented'."""
        pid = getattr(self, "test_participant_id", "SUBJ-001")
        res = self.client.patch(
            f"/api/studies/{self.study_active_num}/participants/{pid}/status",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json={"status": "Enrolled"},
        )
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Informed Consent must be in 'Consented' status", data["message"])

    def test_06_record_informed_consent_success(self):
        """200 when Informed Consent is recorded and linked to study document."""
        pid = getattr(self, "test_participant_id", "SUBJ-001")
        payload = {
            "status": "Consented",
            "witness_name": "Dr. Ramesh Sharma",
            "language": "Hindi",
            "remarks": "Patient thoroughly informed and signed vernacular consent form.",
            "consent_document_id": self.doc_id,
        }
        res = self.client.post(
            f"/api/studies/{self.study_active_num}/participants/{pid}/consent",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["consent"]["status"], "Consented")
        self.assertTrue(data["data"]["consent"]["is_consented"])
        self.assertGreater(len(data["data"]["consent"]["audit_trail"]), 0)

    def test_07_enrollment_allowed_after_consent(self):
        """200 when participant is Enrolled after consent is confirmed."""
        pid = getattr(self, "test_participant_id", "SUBJ-001")
        res = self.client.patch(
            f"/api/studies/{self.study_active_num}/participants/{pid}/status",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json={"status": "Enrolled"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "Enrolled")

    def test_08_active_status_allowed_after_enrollment(self):
        """200 when participant progresses to Active intervention."""
        pid = getattr(self, "test_participant_id", "SUBJ-001")
        res = self.client.patch(
            f"/api/studies/{self.study_active_num}/participants/{pid}/status",
            headers={"Authorization": f"Bearer {self.r1_token}"},
            json={"status": "Active"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["data"]["status"], "Active")

    def test_09_cross_study_isolation(self):
        """404 when querying participant using a different study's URL."""
        pid = getattr(self, "test_participant_id", "SUBJ-001")
        res = self.client.patch(
            f"/api/studies/{self.study_r2_num}/participants/{pid}/status",
            headers={"Authorization": f"Bearer {self.r2_token}"},
            json={"status": "Completed"},
        )
        self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
