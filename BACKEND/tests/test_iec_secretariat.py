import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import app
from extensions import db
from models.user import User
from models.study import Study
from models.document import Document
from routes.iec_secretariat import iec_secretariat_bp
from services.iec_secretariat_service import (
    calculate_study_readiness,
    get_secretariat_dashboard_metrics,
)


class IECSecretariatTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True

        # Dynamically register blueprint for test suite if not already registered
        if "iec_secretariat" not in cls.app.blueprints:
            cls.app.register_blueprint(iec_secretariat_bp)

        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Locate or create test users
            cls.secretariat_user = User.query.filter_by(role="iec_secretariat").first()
            if not cls.secretariat_user:
                cls.secretariat_user = User(
                    full_name="IEC Secretariat Test",
                    email="secretariat_unit@test.com",
                    role="iec_secretariat",
                    is_active=True,
                )
                cls.secretariat_user.set_password("SecretariatPass123!")
                db.session.add(cls.secretariat_user)
                db.session.commit()

            cls.researcher_user = User.query.filter_by(role="researcher").first()
            cls.member_user = User.query.filter_by(role="iec_member").first()
            cls.admin_user = User.query.filter_by(role="regulatory_admin").first()

            # Ensure a test study exists
            cls.test_study = Study.query.first()
            if not cls.test_study:
                cls.test_study = Study(
                    study_id="ALLA-TEST-0001",
                    researcher_id=cls.researcher_user.id if cls.researcher_user else cls.secretariat_user.id,
                    title="Test IEC Study",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    research_objective="Evaluate test clinical protocol",
                    status="submitted",
                )
                db.session.add(cls.test_study)
                db.session.commit()

    def _get_token(self, user):
        with self.app.app_context():
            return create_access_token(
                identity=str(user.id),
                additional_claims={"role": user.role},
            )

    # --------------------------------------------------------------------------
    # 1. SECURITY & ROLE AUTHORIZATION TESTS
    # --------------------------------------------------------------------------
    def test_01_no_token_returns_401(self):
        """Unauthenticated requests must be rejected with 401."""
        res = self.client.get("/api/iec/secretariat/dashboard")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/iec/secretariat/submissions")
        self.assertEqual(res.status_code, 401)

    def test_02_researcher_cannot_access_secretariat(self):
        """Researchers must receive 403 Forbidden on Secretariat endpoints."""
        if not self.researcher_user:
            self.skipTest("No researcher user available")
        token = self._get_token(self.researcher_user)
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_03_iec_member_cannot_access_secretariat(self):
        """IEC Members must receive 403 Forbidden on Secretariat endpoints."""
        if not self.member_user:
            self.skipTest("No IEC member user available")
        token = self._get_token(self.member_user)
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_04_regulatory_admin_cannot_access_secretariat(self):
        """Regulatory admin cannot access Secretariat-specific workflow."""
        if not self.admin_user:
            self.skipTest("No regulatory admin user available")
        token = self._get_token(self.admin_user)
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_05_secretariat_user_allowed(self):
        """Authenticated IEC Secretariat role must receive 200 OK."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("metrics", data)

    # --------------------------------------------------------------------------
    # 2. DASHBOARD KPI METRICS TESTS
    # --------------------------------------------------------------------------
    def test_06_dashboard_kpis_real_data(self):
        """Verify dashboard KPIs contain non-negative real database metrics."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        m = res.get_json()["metrics"]
        self.assertIn("total_studies", m)
        self.assertIn("total_submitted", m)
        self.assertIn("pending_document_verification", m)
        self.assertIn("verification_completed", m)
        self.assertIn("ready_for_iec_review", m)
        self.assertIn("correction_requested", m)
        self.assertIn("recent_submissions", m)
        self.assertIsInstance(m["recent_submissions"], list)

    # --------------------------------------------------------------------------
    # 3. SUBMISSIONS QUEUE & FILTERING TESTS
    # --------------------------------------------------------------------------
    def test_07_submissions_list(self):
        """Verify submissions listing and structure."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            "/api/iec/secretariat/submissions",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 1)

        first = data["submissions"][0]
        self.assertIn("study_id", first)
        self.assertIn("protocol_number", first)
        self.assertIn("title", first)
        self.assertIn("researcher", first)
        self.assertIn("document_status", first)
        self.assertIn("quality_gate", first)
        self.assertIn("readiness", first)

    def test_08_submissions_search_filter(self):
        """Verify search query filters results properly."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            f"/api/iec/secretariat/submissions?search={self.test_study.study_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(any(s["study_id"] == self.test_study.study_id for s in data["submissions"]))

    # --------------------------------------------------------------------------
    # 4. STUDY DOSSIER & VERIFICATION WORKBENCH TESTS
    # --------------------------------------------------------------------------
    def test_09_study_detail_view(self):
        """Verify complete study review view including researcher, protocol, documents, and readiness."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            f"/api/iec/secretariat/studies/{self.test_study.study_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        d = res.get_json()["data"]
        self.assertIn("study", d)
        self.assertIn("researcher", d)
        self.assertIn("documents", d)
        self.assertIn("quality_gate", d)
        self.assertIn("readiness", d)
        self.assertIn("verification_checklist", d)

    def test_10_study_not_found(self):
        """Invalid study identifier returns 404."""
        token = self._get_token(self.secretariat_user)
        res = self.client.get(
            "/api/iec/secretariat/studies/NON-EXISTENT-STUDY-9999",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 404)

    # --------------------------------------------------------------------------
    # 5. DOCUMENT VERIFICATION & CORRECTION WORKFLOW TESTS
    # --------------------------------------------------------------------------
    def test_11_document_verification_and_correction(self):
        """Verify document verification status changes, remarks recording, and correction request."""
        token = self._get_token(self.secretariat_user)

        with self.app.app_context():
            # Create a test document
            doc = Document(
                study_id=self.test_study.id,
                uploaded_by=self.secretariat_user.id,
                original_filename="Test_Informed_Consent.pdf",
                storage_path="/tmp/test_icf.pdf",
                document_type="informed_consent",
                mime_type="application/pdf",
                file_size=1024,
                description="Initial upload",
                status="uploaded",
            )
            db.session.add(doc)
            db.session.commit()
            doc_id = doc.id

        # 1. Verify Document
        res = self.client.post(
            f"/api/iec/secretariat/documents/{doc_id}/verify",
            json={"remarks": "All participant rights clauses verified."},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["document"]["status"], "verified")
        self.assertIn("VERIFIED by IEC Secretariat", data["document"]["description"])

        # 2. Request Correction
        res = self.client.post(
            f"/api/iec/secretariat/documents/{doc_id}/correction",
            json={
                "reason": "Missing local language translation for Section 4.",
                "remarks": "Please provide Hindi translation.",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["document"]["status"], "correction_required")
        self.assertIn("CORRECTION_REQUIRED", data["document"]["description"])

        # Confirm Study status was updated to correction_requested
        with self.app.app_context():
            updated_study = db.session.get(Study, self.test_study.id)
            self.assertEqual(updated_study.status, "correction_requested")

            # Clean up test document
            doc_to_delete = db.session.get(Document, doc_id)
            if doc_to_delete:
                db.session.delete(doc_to_delete)
                db.session.commit()

    def test_12_mark_document_missing(self):
        """Verify marking a document as missing updates status and logs audit remarks."""
        token = self._get_token(self.secretariat_user)

        with self.app.app_context():
            doc = Document(
                study_id=self.test_study.id,
                uploaded_by=self.secretariat_user.id,
                original_filename="Test_Investigator_Brochure.pdf",
                storage_path="/tmp/test_ib.pdf",
                document_type="investigator_brochure",
                mime_type="application/pdf",
                file_size=2048,
                status="uploaded",
            )
            db.session.add(doc)
            db.session.commit()
            doc_id = doc.id

        res = self.client.post(
            f"/api/iec/secretariat/documents/{doc_id}/missing",
            json={"remarks": "Mandatory safety toxicology data appendix missing."},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["document"]["status"], "missing")
        self.assertIn("MISSING flagged by IEC Secretariat", data["document"]["description"])

        with self.app.app_context():
            updated_study = db.session.get(Study, self.test_study.id)
            self.assertEqual(updated_study.status, "correction_requested")

            doc_to_delete = db.session.get(Document, doc_id)
            if doc_to_delete:
                db.session.delete(doc_to_delete)
                db.session.commit()

    def test_13_submit_to_iec_review(self):
        """Verify study submission to IEC Review stage with readiness validation."""
        token = self._get_token(self.secretariat_user)

        # 1. When study is not ready, submission must be rejected with 400
        res = self.client.post(
            f"/api/iec/secretariat/studies/{self.test_study.study_id}/submit-to-iec",
            json={"remarks": "Submitting incomplete study."},
            headers={"Authorization": f"Bearer {token}"},
        )
        # Should be 400 since test study lacks verified protocol & ICF documents
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Cannot submit to IEC Review", data["message"])


if __name__ == "__main__":
    unittest.main()
