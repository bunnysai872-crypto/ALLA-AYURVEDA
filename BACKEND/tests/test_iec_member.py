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
from models.protocol import Protocol
from services.iec_member_service import load_study_reviews


class IECMemberTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Seed or retrieve all roles and store IDs
            member = User.query.filter_by(role="iec_member").first()
            if not member:
                member = User(
                    full_name="Dr. Member Reviewer",
                    email="member_reviewer_test@test.com",
                    role="iec_member",
                    is_active=True,
                )
                member.set_password("MemberPass123!")
                db.session.add(member)
                db.session.commit()
            cls.member_id = member.id
            cls.member_email = member.email
            cls.member_name = member.full_name

            researcher = User.query.filter_by(role="researcher").first()
            if not researcher:
                researcher = User(
                    full_name="Researcher Test",
                    email="researcher_test_unit@test.com",
                    role="researcher",
                    is_active=True,
                )
                researcher.set_password("ResearcherPass123!")
                db.session.add(researcher)
                db.session.commit()
            cls.researcher_id = researcher.id

            secretariat = User.query.filter_by(role="iec_secretariat").first()
            if not secretariat:
                secretariat = User(
                    full_name="Secretariat Test",
                    email="secretariat_test_unit@test.com",
                    role="iec_secretariat",
                    is_active=True,
                )
                secretariat.set_password("SecretariatPass123!")
                db.session.add(secretariat)
                db.session.commit()
            cls.secretariat_id = secretariat.id

            admin = User.query.filter_by(role="regulatory_admin").first()
            if not admin:
                admin = User(
                    full_name="Admin Test",
                    email="admin_test_unit@test.com",
                    role="regulatory_admin",
                    is_active=True,
                )
                admin.set_password("AdminPass123!")
                db.session.add(admin)
                db.session.commit()
            cls.admin_id = admin.id

            # Ensure a study in ready_for_iec_review status exists
            study = Study.query.filter_by(study_id="ALLA-MEMBER-TEST-001").first()
            if not study:
                study = Study(
                    study_id="ALLA-MEMBER-TEST-001",
                    researcher_id=cls.researcher_id,
                    title="Ayurvedic Formulation in Metabolic Health",
                    short_title="AyurMetabolic Trial",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    condition="Metabolic Syndrome",
                    ayurveda_intervention="Triphala & Guggulu formulation 500mg BID",
                    research_objective="Evaluate efficacy and safety in metabolic parameters",
                    status="ready_for_iec_review",
                )
                db.session.add(study)
                db.session.commit()
            else:
                study.status = "ready_for_iec_review"
                db.session.commit()

            cls.test_study_id = study.id
            cls.test_study_code = study.study_id

            # Attach a test protocol
            proto = Protocol.query.filter_by(study_id=cls.test_study_id).first()
            if not proto:
                proto = Protocol(
                    study_id=cls.test_study_id,
                    protocol_title="Ayurvedic Formulation in Metabolic Health Protocol",
                    protocol_version="1.0",
                    rationale="Ayurvedic classical texts demonstrate lipolytic action.",
                    primary_objective="Evaluate HbA1c reduction over 12 weeks.",
                    safety_monitoring="Liver and renal function tests every 4 weeks.",
                )
                db.session.add(proto)
                db.session.commit()

    def _get_token(self, user_id, role):
        with self.app.app_context():
            return create_access_token(
                identity=str(user_id),
                additional_claims={"role": role},
            )

    # 1. IEC Member dashboard authorized -> 200
    def test_01_member_dashboard_authorized_200(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            "/api/iec/member/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("metrics", data)
        m = data["metrics"]
        self.assertIn("ready_for_review", m)
        self.assertIn("under_review", m)
        self.assertIn("recommendations_submitted", m)
        self.assertIn("total_available", m)

    # 2. IEC Member review queue authorized -> 200
    def test_02_member_review_queue_authorized_200(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            "/api/iec/member/reviews",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["reviews"], list)
        self.assertGreaterEqual(data["count"], 1)

    # 3. IEC Member can access reviewable study -> 200
    def test_03_member_can_access_study_dossier_200(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/member/studies/{self.test_study_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        d = data["data"]
        self.assertEqual(d["study"]["study_id"], self.test_study_code)
        self.assertIn("protocol", d)
        self.assertIn("documents", d)
        self.assertIn("quality_gate", d)
        self.assertIn("review_domains", d)
        self.assertEqual(len(d["review_domains"]), 10)

    # 4. Researcher attempting IEC Member API -> 403
    def test_04_researcher_attempting_member_api_403(self):
        token = self._get_token(self.researcher_id, "researcher")
        res = self.client.get(
            "/api/iec/member/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    # 5. IEC Secretariat attempting IEC Member API -> 403
    def test_05_secretariat_attempting_member_api_403(self):
        token = self._get_token(self.secretariat_id, "iec_secretariat")
        res = self.client.get(
            "/api/iec/member/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    # 6. Regulatory Admin attempting IEC Member API -> 403
    def test_06_regulatory_admin_attempting_member_api_403(self):
        token = self._get_token(self.admin_id, "regulatory_admin")
        res = self.client.get(
            "/api/iec/member/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    # 7. Missing / invalid JWT -> 401
    def test_07_missing_or_invalid_jwt_401(self):
        res = self.client.get("/api/iec/member/dashboard")
        self.assertEqual(res.status_code, 401)

        res = self.client.get(
            "/api/iec/member/dashboard",
            headers={"Authorization": "Bearer invalid.token.value"},
        )
        self.assertEqual(res.status_code, 401)

    # 8. Start review changes appropriate status (ready_for_iec_review -> under_iec_review)
    def test_08_start_review_transitions_status(self):
        token = self._get_token(self.member_id, "iec_member")

        # Reset study to ready_for_iec_review for clean test
        with self.app.app_context():
            s = db.session.get(Study, self.test_study_id)
            s.status = "ready_for_iec_review"
            db.session.commit()

        res = self.client.post(
            f"/api/iec/member/studies/{self.test_study_code}/start-review",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["study"]["status"], "under_iec_review")

        with self.app.app_context():
            s = db.session.get(Study, self.test_study_id)
            self.assertEqual(s.status, "under_iec_review")

    # 9. Recommendation validation
    def test_09_recommendation_validation(self):
        token = self._get_token(self.member_id, "iec_member")

        # Missing recommendation option
        res = self.client.post(
            f"/api/iec/member/studies/{self.test_study_code}/recommendation",
            json={"comments": "Looks good"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 400)

        # Invalid recommendation option
        res = self.client.post(
            f"/api/iec/member/studies/{self.test_study_code}/recommendation",
            json={"recommendation": "invalid_recommendation", "comments": "Valid comments"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 400)

        # Missing comments
        res = self.client.post(
            f"/api/iec/member/studies/{self.test_study_code}/recommendation",
            json={"recommendation": "recommend_approval", "comments": ""},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 400)

    # 10. Recommendation submission works (under_iec_review -> iec_recommendation_submitted)
    # 11. Reviewer identity is recorded
    # 12. Study cannot be incorrectly approved by this module
    def test_10_11_12_recommendation_submission_audit_and_non_approval(self):
        token = self._get_token(self.member_id, "iec_member")

        # Ensure study is under_iec_review
        with self.app.app_context():
            s = db.session.get(Study, self.test_study_id)
            s.status = "under_iec_review"
            db.session.commit()

        payload = {
            "recommendation": "recommend_approval",
            "comments": "The clinical protocol adheres to classical Ayurvedic standards with adequate safety monitoring.",
            "sections": {
                "scientific_validity": {"rating": "satisfactory", "notes": "Solid Ayurvedic hypothesis."},
                "safety_monitoring": {"rating": "satisfactory", "notes": "Liver/renal tests specified."},
            },
            "reviewer_notes": "Recommend accelerated ethics committee consensus.",
        }

        res = self.client.post(
            f"/api/iec/member/studies/{self.test_study_code}/recommendation",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

        # Test 10: status is iec_recommendation_submitted
        self.assertEqual(data["data"]["study"]["status"], "iec_recommendation_submitted")

        # Test 12: study is NOT approved or activated
        self.assertNotEqual(data["data"]["study"]["status"], "approved")
        self.assertNotEqual(data["data"]["study"]["status"], "active")

        # Test 11: Reviewer identity recorded in audit trail
        review = data["data"]["review"]
        self.assertEqual(review["reviewer_id"], self.member_id)
        self.assertEqual(review["reviewer_email"], self.member_email)
        self.assertEqual(review["reviewer_name"], self.member_name)
        self.assertEqual(review["recommendation"], "recommend_approval")
        self.assertIn("review_timestamp", review)

        # Confirm persisted storage
        saved_reviews = load_study_reviews(self.test_study_code)
        self.assertGreaterEqual(len(saved_reviews), 1)
        last = saved_reviews[-1]
        self.assertEqual(last["reviewer_id"], self.member_id)

    # 13. Existing researcher APIs remain functional
    def test_13_existing_researcher_apis_remain_functional(self):
        token = self._get_token(self.researcher_id, "researcher")
        res = self.client.get(
            "/api/studies",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("studies", data)

    # 14. Existing IEC Secretariat APIs remain functional
    def test_14_existing_iec_secretariat_apis_remain_functional(self):
        token = self._get_token(self.secretariat_id, "iec_secretariat")
        res = self.client.get(
            "/api/iec/secretariat/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("metrics", data)


if __name__ == "__main__":
    unittest.main()
