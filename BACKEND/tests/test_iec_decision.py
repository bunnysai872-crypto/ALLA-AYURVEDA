"""
ALLA AYURVEDA — IEC DECISION TEST SUITE
Comprehensive Automated Tests for Official IEC Decision Module.

Tests:
1. Dossier: 401 on Missing Token
2. Dossier: 401 on Invalid Token
3. Dossier: 403 for Researcher role
4. Dossier: 403 for Regulatory Admin role
5. Dossier: 200 for IEC Member
6. Dossier: 200 for IEC Secretariat
7. Dossier: 404 for Non-Existent Study
8. Dossier: Structure completeness (study, researcher, protocol, documents, quality_gate, ai_review_summary, iec_member_reviews, existing_decision)
9. Submit Decision: 401 on Missing/Invalid Token
10. Submit Decision: 403 for Researcher
11. Submit Decision: 400 on Empty Request Body
12. Submit Decision: 400 on Missing or Invalid Decision Outcome
13. Submit Decision: 400 on Missing Remarks/Comments
14. Submit Decision: 400 when Study has not completed IEC Member review
15. Submit Decision: 200 Approved -> Study status updated to 'approved'
16. Submit Decision: 409 Conflict when attempting to overwrite finalized decision
17. Submit Decision: 200 Modify -> Study status updated to 'modification_required'
18. Submit Decision: 200 Not Approved -> Study status updated to 'not_approved'
19. Get Decision: 200 retrieves finalized decision and verifies persisted file data
20. Cross-study isolation verified
"""

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
from routes.iec_decision import iec_decision_bp
from services.iec_member_service import save_study_review
from services.iec_decision_service import load_study_decision, _get_study_decision_file_path


class IECDecisionTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True

        if "iec_decision" not in cls.app.blueprints:
            cls.app.register_blueprint(iec_decision_bp)

        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # 1. Users
            member = User.query.filter_by(role="iec_member").first()
            if not member:
                member = User(full_name="Dr. Decision Member", email="dec_member@test.com", role="iec_member", is_active=True)
                member.set_password("Pass123!")
                db.session.add(member)
                db.session.commit()
            cls.member_id = member.id
            cls.member_name = member.full_name
            cls.member_email = member.email

            secretariat = User.query.filter_by(role="iec_secretariat").first()
            if not secretariat:
                secretariat = User(full_name="Secretariat Lead", email="dec_secretariat@test.com", role="iec_secretariat", is_active=True)
                secretariat.set_password("Pass123!")
                db.session.add(secretariat)
                db.session.commit()
            cls.secretariat_id = secretariat.id
            cls.secretariat_name = secretariat.full_name
            cls.secretariat_email = secretariat.email

            researcher = User.query.filter_by(role="researcher").first()
            if not researcher:
                researcher = User(full_name="Dr. Principal Investigator", email="dec_researcher@test.com", role="researcher", is_active=True)
                researcher.set_password("Pass123!")
                db.session.add(researcher)
                db.session.commit()
            cls.researcher_id = researcher.id

            admin = User.query.filter_by(role="regulatory_admin").first()
            if not admin:
                admin = User(full_name="Regulatory Officer", email="dec_admin@test.com", role="regulatory_admin", is_active=True)
                admin.set_password("Pass123!")
                db.session.add(admin)
                db.session.commit()
            cls.admin_id = admin.id

            # Tokens
            cls.token_member = create_access_token(identity=str(cls.member_id))
            cls.token_secretariat = create_access_token(identity=str(cls.secretariat_id))
            cls.token_researcher = create_access_token(identity=str(cls.researcher_id))
            cls.token_admin = create_access_token(identity=str(cls.admin_id))

            # 2. Test Studies
            # Study 1: Reviewed and ready for approval
            s1 = Study.query.filter_by(study_id="IEC-DEC-TEST-001").first()
            if not s1:
                s1 = Study(
                    study_id="IEC-DEC-TEST-001",
                    title="Herbal Formulations in Diabetes Management",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    research_objective="Evaluate herbal formulation efficacy in diabetes",
                    status="under_iec_review",
                    researcher_id=cls.researcher_id,
                )
                db.session.add(s1)
                db.session.commit()
            else:
                s1.status = "under_iec_review"
                db.session.commit()
            cls.study1_id = s1.study_id
            cls.study1_db_id = s1.id

            # Protocol for Study 1
            p1 = Protocol.query.filter_by(study_id=s1.id).first()
            if not p1:
                p1 = Protocol(
                    study_id=s1.id,
                    protocol_title="Evaluating herbal formulation efficacy",
                    study_design="Randomized Controlled Trial",
                    sample_size=60,
                    primary_objective="HbA1c reduction",
                )
                db.session.add(p1)
                db.session.commit()

            # Seed a completed member review for Study 1
            save_study_review(
                s1.study_id,
                {
                    "review_id": "rev_test_dec_1",
                    "study_id": s1.study_id,
                    "reviewer_id": cls.member_id,
                    "reviewer_name": cls.member_name,
                    "reviewer_email": cls.member_email,
                    "recommendation": "approved",
                    "recommendation_label": "Approved",
                    "comments": "Comprehensive study with strong ethical safeguards.",
                    "review_timestamp": datetime.utcnow().isoformat() + "Z",
                },
            )

            # Study 2: Reviewed, will be tested with 'modify'
            s2 = Study.query.filter_by(study_id="IEC-DEC-TEST-002").first()
            if not s2:
                s2 = Study(
                    study_id="IEC-DEC-TEST-002",
                    title="Ayurvedic Formulation in Arthritis",
                    study_type="interventional",
                    study_design="parallel_group",
                    research_objective="Evaluate joint mobility with herbal oil",
                    status="iec_recommendation_submitted",
                    researcher_id=cls.researcher_id,
                )
                db.session.add(s2)
                db.session.commit()
            else:
                s2.status = "iec_recommendation_submitted"
                db.session.commit()
            cls.study2_id = s2.study_id
            cls.study2_db_id = s2.id

            save_study_review(
                s2.study_id,
                {
                    "review_id": "rev_test_dec_2",
                    "study_id": s2.study_id,
                    "reviewer_id": cls.member_id,
                    "reviewer_name": cls.member_name,
                    "reviewer_email": cls.member_email,
                    "recommendation": "modify",
                    "recommendation_label": "Modify / Revisions Required",
                    "comments": "Informed consent needs clearer vernacular translation.",
                    "review_timestamp": datetime.utcnow().isoformat() + "Z",
                },
            )

            # Study 3: Reviewed, will be tested with 'not_approved'
            s3 = Study.query.filter_by(study_id="IEC-DEC-TEST-003").first()
            if not s3:
                s3 = Study(
                    study_id="IEC-DEC-TEST-003",
                    title="Unregulated Metal Bhasma Toxicity Trial",
                    study_type="interventional",
                    study_design="single_arm",
                    research_objective="Assess safety thresholds of heavy metal preparations",
                    status="under_iec_review",
                    researcher_id=cls.researcher_id,
                )
                db.session.add(s3)
                db.session.commit()
            else:
                s3.status = "under_iec_review"
                db.session.commit()
            cls.study3_id = s3.study_id
            cls.study3_db_id = s3.id

            save_study_review(
                s3.study_id,
                {
                    "review_id": "rev_test_dec_3",
                    "study_id": s3.study_id,
                    "reviewer_id": cls.member_id,
                    "reviewer_name": cls.member_name,
                    "reviewer_email": cls.member_email,
                    "recommendation": "rejected",
                    "recommendation_label": "Not Approved",
                    "comments": "Significant safety and toxicological hazards identified.",
                    "review_timestamp": datetime.utcnow().isoformat() + "Z",
                },
            )

            # Study 4: Draft / Not yet reviewed
            s4 = Study.query.filter_by(study_id="IEC-DEC-UNREVIEWED").first()
            if not s4:
                s4 = Study(
                    study_id="IEC-DEC-UNREVIEWED",
                    title="Early Draft Botanical Study",
                    study_type="observational",
                    study_design="cohort",
                    research_objective="Monitor botanical dietary habits",
                    status="draft",
                    researcher_id=cls.researcher_id,
                )
                db.session.add(s4)
                db.session.commit()
            else:
                s4.status = "draft"
                db.session.commit()
            cls.study_unreviewed_id = s4.study_id
            cls.study_unreviewed_db_id = s4.id

        # Clean any old test decision files
        for sid in ["IEC-DEC-TEST-001", "IEC-DEC-TEST-002", "IEC-DEC-TEST-003", "IEC-DEC-UNREVIEWED"]:
            fpath = _get_study_decision_file_path(sid)
            if os.path.exists(fpath):
                os.remove(fpath)

    @classmethod
    def tearDownClass(cls):
        for sid in ["IEC-DEC-TEST-001", "IEC-DEC-TEST-002", "IEC-DEC-TEST-003", "IEC-DEC-UNREVIEWED"]:
            fpath = _get_study_decision_file_path(sid)
            if os.path.exists(fpath):
                try:
                    os.remove(fpath)
                except Exception:
                    pass

    # -------------------------------------------------------------------------
    # DOSSIER TESTS
    # -------------------------------------------------------------------------

    def test_01_dossier_missing_token(self):
        res = self.client.get(f"/api/iec/studies/{self.study1_id}/decision-dossier")
        self.assertEqual(res.status_code, 401)

    def test_02_dossier_invalid_token(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision-dossier",
            headers={"Authorization": "Bearer invalid.mock.token"},
        )
        self.assertEqual(res.status_code, 401)

    def test_03_dossier_researcher_blocked(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision-dossier",
            headers={"Authorization": f"Bearer {self.token_researcher}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_04_dossier_admin_blocked(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision-dossier",
            headers={"Authorization": f"Bearer {self.token_admin}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_05_dossier_iec_member_success(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision-dossier",
            headers={"Authorization": f"Bearer {self.token_member}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        d = data["data"]
        self.assertIn("study", d)
        self.assertIn("protocol", d)
        self.assertIn("documents", d)
        self.assertIn("quality_gate", d)
        self.assertIn("ai_review_summary", d)
        self.assertIn("iec_member_reviews", d)
        self.assertIn("readiness", d)

    def test_06_dossier_iec_secretariat_success(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision-dossier",
            headers={"Authorization": f"Bearer {self.token_secretariat}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

    def test_07_dossier_study_not_found(self):
        res = self.client.get(
            "/api/iec/studies/NON-EXISTENT-STUDY-999/decision-dossier",
            headers={"Authorization": f"Bearer {self.token_member}"},
        )
        self.assertEqual(res.status_code, 404)

    # -------------------------------------------------------------------------
    # DECISION SUBMISSION VALIDATION TESTS
    # -------------------------------------------------------------------------

    def test_08_submit_missing_token(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            json={"decision": "approved", "comments": "Approved"},
        )
        self.assertEqual(res.status_code, 401)

    def test_09_submit_researcher_blocked(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_researcher}"},
            json={"decision": "approved", "comments": "Approved"},
        )
        self.assertEqual(res.status_code, 403)

    def test_10_submit_empty_body(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Decision outcome is mandatory", res.get_json()["message"])

    def test_11_submit_invalid_decision_choice(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={"decision": "invalid_choice", "comments": "Valid comments"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid decision", res.get_json()["message"])

    def test_12_submit_missing_comments(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={"decision": "approved", "comments": "   "},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("remarks", res.get_json()["message"])

    def test_13_submit_unreviewed_study_rejected(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study_unreviewed_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={"decision": "approved", "comments": "Premature attempt"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("has not completed the required IEC Member Review", res.get_json()["message"])

    # -------------------------------------------------------------------------
    # RECORD OFFICIAL DECISION WORKFLOW TESTS
    # -------------------------------------------------------------------------

    def test_14_submit_decision_approved_success(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={
                "decision": "approved",
                "comments": "Full ethical clearance granted after committee deliberation.",
                "conditions": "Submit quarterly safety reports and CTRI registration receipt.",
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["decision"]["decision"], "approved")
        self.assertEqual(data["data"]["decision"]["study_status"], "approved")
        self.assertIn("quarterly safety reports", data["data"]["decision"]["conditions"])

        # Check Study status updated in DB
        with self.app.app_context():
            updated = db.session.get(Study, self.study1_db_id)
            self.assertEqual(updated.status, "approved")

    def test_15_overwrite_guard_409_conflict(self):
        # Attempting to re-submit decision on study1 should return 409 Conflict
        res = self.client.post(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_secretariat}"},
            json={
                "decision": "modify",
                "comments": "Attempting to change decision",
            },
        )
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("cannot be overwritten", data["message"])

    def test_16_get_existing_decision(self):
        res = self.client.get(
            f"/api/iec/studies/{self.study1_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["has_decision"])
        self.assertEqual(data["decision"]["decision"], "approved")
        self.assertEqual(data["decision"]["decided_by"]["email"], self.member_email)

    def test_17_submit_decision_modify_success(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study2_id}/decision",
            headers={"Authorization": f"Bearer {self.token_secretariat}"},
            json={
                "decision": "modify",
                "comments": "Patient information sheet requires simplification for rural participants.",
                "conditions": "Revise ICF within 14 days and resubmit.",
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["data"]["decision"]["decision"], "modification_required")
        self.assertEqual(data["data"]["decision"]["study_status"], "modification_required")

        with self.app.app_context():
            updated = db.session.get(Study, self.study2_db_id)
            self.assertEqual(updated.status, "modification_required")

    def test_18_submit_decision_not_approved_success(self):
        res = self.client.post(
            f"/api/iec/studies/{self.study3_id}/decision",
            headers={"Authorization": f"Bearer {self.token_member}"},
            json={
                "decision": "not_approved",
                "comments": "High risk of heavy metal toxicity without standardized bhasma purification certificates.",
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["data"]["decision"]["decision"], "not_approved")
        self.assertEqual(data["data"]["decision"]["study_status"], "not_approved")

        with self.app.app_context():
            updated = db.session.get(Study, self.study3_db_id)
            self.assertEqual(updated.status, "not_approved")

    def test_19_cross_study_isolation(self):
        dec1 = load_study_decision(self.study1_id)
        dec2 = load_study_decision(self.study2_id)
        dec3 = load_study_decision(self.study3_id)

        self.assertIsNotNone(dec1)
        self.assertIsNotNone(dec2)
        self.assertIsNotNone(dec3)

        self.assertEqual(dec1["study_id"], self.study1_id)
        self.assertEqual(dec2["study_id"], self.study2_id)
        self.assertEqual(dec3["study_id"], self.study3_id)

        self.assertEqual(dec1["decision"], "approved")
        self.assertEqual(dec2["decision"], "modification_required")
        self.assertEqual(dec3["decision"], "not_approved")


if __name__ == "__main__":
    unittest.main()
