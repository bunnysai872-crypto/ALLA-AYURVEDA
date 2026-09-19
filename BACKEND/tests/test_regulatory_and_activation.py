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
from services.iec_decision_service import save_study_decision


class RegulatoryAndActivationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Setup Users
            admin = User.query.filter_by(role="regulatory_admin").first()
            if not admin:
                admin = User(full_name="Regulatory Admin", email="reg_admin@test.com", role="regulatory_admin", is_active=True)
                admin.set_password("Admin123!")
                db.session.add(admin)
                db.session.commit()
            cls.admin_id = admin.id

            researcher = User.query.filter_by(role="researcher").first()
            if not researcher:
                researcher = User(full_name="Dr. PI Researcher", email="pi_researcher@test.com", role="researcher", is_active=True)
                researcher.set_password("Res123!")
                db.session.add(researcher)
                db.session.commit()
            cls.researcher_id = researcher.id

            member = User.query.filter_by(role="iec_member").first()
            cls.member_id = member.id if member else 1

            # Setup Study
            study = Study.query.filter_by(study_id="ALLA-REG-TEST-001").first()
            if not study:
                study = Study(
                    study_id="ALLA-REG-TEST-001",
                    researcher_id=cls.researcher_id,
                    title="Ayurvedic Trial on Ashwagandha for Stress",
                    short_title="Ashwagandha Stress Study",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    condition="Chronic Stress",
                    research_objective="Evaluate efficacy of Ashwagandha extract vs placebo",
                    status="approved",
                )
                db.session.add(study)
                db.session.commit()
            else:
                study.status = "approved"
                db.session.commit()
            cls.study_id = study.id
            cls.study_num = study.study_id

            # Setup Protocol
            proto = Protocol.query.filter_by(study_id=cls.study_id).first()
            if not proto:
                proto = Protocol(
                    study_id=cls.study_id,
                    protocol_title="Ashwagandha Clinical Trial Protocol",
                    protocol_version="1.0",
                    rationale="Ayurvedic rasayana herbs reduce cortisol",
                    primary_objective="Measure change in PSS stress score",
                )
                db.session.add(proto)
                db.session.commit()

            # Setup Mandatory Documents
            doc_p = Document.query.filter_by(study_id=cls.study_id, document_type="protocol").first()
            if not doc_p:
                doc_p = Document(
                    study_id=cls.study_id,
                    uploaded_by=cls.researcher_id,
                    original_filename="Protocol_v1.0.pdf",
                    storage_path="/uploads/test_p.pdf",
                    document_type="protocol",
                    mime_type="application/pdf",
                    file_size=1024,
                    status="verified",
                )
                db.session.add(doc_p)

            doc_c = Document.query.filter_by(study_id=cls.study_id, document_type="informed_consent").first()
            if not doc_c:
                doc_c = Document(
                    study_id=cls.study_id,
                    uploaded_by=cls.researcher_id,
                    original_filename="Informed_Consent_v1.0.pdf",
                    storage_path="/uploads/test_c.pdf",
                    document_type="informed_consent",
                    mime_type="application/pdf",
                    file_size=2048,
                    status="verified",
                )
                db.session.add(doc_c)
            db.session.commit()

            # Setup Quality Gate
            qc = QualityCheck.query.filter_by(study_id=cls.study_id).first()
            if not qc:
                qc = QualityCheck(
                    study_id=cls.study_id,
                    status="passed",
                    score=90,
                    summary="Protocol validated with high completeness.",
                    checked_by=cls.admin_id,
                )
                db.session.add(qc)
                db.session.commit()

            # Record Approved IEC Decision
            save_study_decision(cls.study_num, {
                "decision_id": f"dec_{cls.study_id}",
                "study_id": cls.study_num,
                "decision": "approved",
                "decision_label": "Approved",
                "remarks": "Ethically sound trial design.",
                "decision_date": datetime.utcnow().isoformat() + "Z",
            })

        with cls.app.app_context():
            cls.admin_token = create_access_token(identity=str(cls.admin_id))
            cls.researcher_token = create_access_token(identity=str(cls.researcher_id))
            cls.member_token = create_access_token(identity=str(cls.member_id))

    def test_01_get_regulatory_studies_unauthorized(self):
        """401 when no token is provided."""
        res = self.client.get("/api/regulatory/studies")
        self.assertEqual(res.status_code, 401)

    def test_02_get_regulatory_studies_success(self):
        """200 when Regulatory Admin lists studies."""
        res = self.client.get(
            "/api/regulatory/studies",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_03_update_regulatory_tracking_forbidden_for_researcher(self):
        """403 when researcher attempts to modify regulatory clearances."""
        payload = {
            "regulatory_status": "Approved/Registered",
            "regulatory_reference_number": "AYUSH/2026/001",
        }
        res = self.client.put(
            f"/api/regulatory/studies/{self.study_num}",
            headers={"Authorization": f"Bearer {self.researcher_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 403)

    def test_04_update_regulatory_tracking_invalid_status(self):
        """400 when invalid status is submitted."""
        payload = {"regulatory_status": "InvalidStatus123"}
        res = self.client.put(
            f"/api/regulatory/studies/{self.study_num}",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Invalid regulatory status", data["message"])

    def test_05_update_regulatory_tracking_success(self):
        """200 when Regulatory Admin successfully updates CTRI and Regulatory tracking."""
        payload = {
            "regulatory_status": "Approved/Registered",
            "regulatory_reference_number": "AYUSH-CL-2026-981",
            "regulatory_approval_date": "2026-09-18",
            "regulatory_remarks": "Clearance granted by National Ayush Regulatory Council",
            "ctri_status": "Approved/Registered",
            "ctri_reg_number": "CTRI/2026/09/045892",
            "ctri_registration_date": "2026-09-18",
            "ctri_remarks": "Registered on Clinical Trial Registry - India",
        }
        res = self.client.put(
            f"/api/regulatory/studies/{self.study_num}",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json=payload,
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["regulatory"]["reference_number"], "AYUSH-CL-2026-981")
        self.assertEqual(data["data"]["ctri"]["reg_number"], "CTRI/2026/09/045892")

    def test_06_activation_readiness_evaluation(self):
        """200 evaluation confirms study is ready for activation."""
        res = self.client.get(
            f"/api/regulatory/studies/{self.study_num}/readiness",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["overall_status"], "ready_for_activation")
        self.assertTrue(data["data"]["is_ready"])

    def test_07_activate_study_forbidden_for_member(self):
        """403 when IEC Member attempts to activate study."""
        res = self.client.post(
            f"/api/regulatory/studies/{self.study_num}/activate",
            headers={"Authorization": f"Bearer {self.member_token}"},
            json={"remarks": "Unauthorized activation attempt"},
        )
        self.assertEqual(res.status_code, 403)

    def test_08_activate_study_success(self):
        """200 when Regulatory Admin activates study with satisfied prerequisites."""
        res = self.client.post(
            f"/api/regulatory/studies/{self.study_num}/activate",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"remarks": "All clearances and CTRI registration verified. Study activated."},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["study"]["status"], "activated")

    def test_09_activate_already_activated_study_conflict(self):
        """409 conflict when attempting to reactivate an already activated study."""
        res = self.client.post(
            f"/api/regulatory/studies/{self.study_num}/activate",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"remarks": "Duplicate activation attempt"},
        )
        self.assertEqual(res.status_code, 409)


if __name__ == "__main__":
    unittest.main()
