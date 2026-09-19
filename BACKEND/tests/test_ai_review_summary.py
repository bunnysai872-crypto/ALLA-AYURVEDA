"""
ALLA AYURVEDA — AI REVIEW SUMMARY TEST SUITE
Comprehensive Automated Tests for Isolated AI Review Summary Module.

Tests:
1. Valid IEC Member access -> 200
2. Valid IEC Secretariat access -> 200
3. Researcher blocked -> 403
4. Invalid token blocked -> 401
5. Missing token blocked -> 401
6. Study not found -> 404
7. Review not yet submitted -> 409
8. Correct study information
9. Correct protocol information
10. Correct document information
11. Correct Quality Gate information
12. Correct IEC Member recommendation
13. Missing fields handled safely
14. No fabricated information
15. No database writes
16. No Study status changes
17. No final IEC decision generated
18. Cross-study isolation
"""

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
from models.quality_check import QualityCheck
from routes.ai_review_summary import ai_review_summary_bp
from services.iec_member_service import save_study_review


class AIReviewSummaryTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config["TESTING"] = True

        # Dynamically register isolated blueprint for testing without modifying app.py
        if "ai_review_summary" not in cls.app.blueprints:
            cls.app.register_blueprint(ai_review_summary_bp)

        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # 1. Users
            member = User.query.filter_by(role="iec_member").first()
            if not member:
                member = User(full_name="Dr. Summary Member", email="summary_member@test.com", role="iec_member", is_active=True)
                member.set_password("Pass123!")
                db.session.add(member)
                db.session.commit()
            cls.member_id = member.id
            cls.member_name = member.full_name
            cls.member_email = member.email

            secretariat = User.query.filter_by(role="iec_secretariat").first()
            if not secretariat:
                secretariat = User(full_name="Secretariat Lead", email="summary_secretariat@test.com", role="iec_secretariat", is_active=True)
                secretariat.set_password("Pass123!")
                db.session.add(secretariat)
                db.session.commit()
            cls.secretariat_id = secretariat.id

            researcher = User.query.filter_by(role="researcher").first()
            if not researcher:
                researcher = User(full_name="Research PI", email="summary_researcher@test.com", role="researcher", is_active=True)
                researcher.set_password("Pass123!")
                db.session.add(researcher)
                db.session.commit()
            cls.researcher_id = researcher.id

            # 2. Study A: Fully completed study ready for summary (with IEC Member review)
            study_a = Study.query.filter_by(study_id="ALLA-AI-SUM-001").first()
            if not study_a:
                study_a = Study(
                    study_id="ALLA-AI-SUM-001",
                    researcher_id=cls.researcher_id,
                    title="Clinical Trial of Brahmi Rasayana in Cognitive Function",
                    short_title="Brahmi Cognition Study",
                    study_type="interventional",
                    study_design="randomized_controlled_trial",
                    condition="Mild Cognitive Impairment",
                    ayurveda_intervention="Brahmi Rasayana 5g twice daily with warm milk",
                    research_objective="Evaluate memory score improvement over 24 weeks",
                    primary_objective="Measure change in cognitive assessment score",
                    secondary_objectives="Monitor sleep quality and daytime alertness",
                    study_duration="24 weeks",
                    target_population="Adults aged 50-75",
                    estimated_sample_size=120,
                    status="iec_recommendation_submitted",
                )
                db.session.add(study_a)
                db.session.commit()
            else:
                study_a.status = "iec_recommendation_submitted"
                db.session.commit()
            cls.study_a_id = study_a.id
            cls.study_a_code = study_a.study_id

            # Protocol for Study A
            proto_a = Protocol.query.filter_by(study_id=cls.study_a_id).first()
            if not proto_a:
                proto_a = Protocol(
                    study_id=cls.study_a_id,
                    protocol_title="Brahmi Rasayana Cognitive Evaluation Protocol",
                    protocol_version="1.2",
                    protocol_date="2026-03-01",
                    rationale="Charaka Samhita references Brahmi as Medhya Rasayana with neuroprotective activity.",
                    primary_objective="Assess cognitive score improvement",
                    inclusion_criteria="Adults 50-75 with baseline cognitive score 22-26",
                    exclusion_criteria="Severe dementia or psychiatric comorbidities",
                    intervention_name="Brahmi Rasayana",
                    dosage="5g BID",
                    route="Oral",
                    frequency="Twice daily",
                    safety_monitoring="Bi-weekly clinical evaluation and baseline/midpoint liver function tests",
                    adverse_event_reporting="Expedited reporting within 24 hours to Ethics Committee",
                )
                db.session.add(proto_a)
                db.session.commit()

            # Documents for Study A
            doc_proto = Document.query.filter_by(study_id=cls.study_a_id, document_type="protocol").first()
            if not doc_proto:
                doc_proto = Document(
                    study_id=cls.study_a_id,
                    uploaded_by=cls.researcher_id,
                    original_filename="Brahmi_Protocol_v1.2.pdf",
                    storage_path="/tmp/brahmi_proto.pdf",
                    document_type="protocol",
                    mime_type="application/pdf",
                    file_size=204800,
                    status="verified",
                )
                db.session.add(doc_proto)

            doc_icf = Document.query.filter_by(study_id=cls.study_a_id, document_type="informed_consent").first()
            if not doc_icf:
                doc_icf = Document(
                    study_id=cls.study_a_id,
                    uploaded_by=cls.researcher_id,
                    original_filename="Brahmi_ICF_English_Hindi.pdf",
                    storage_path="/tmp/brahmi_icf.pdf",
                    document_type="informed_consent",
                    mime_type="application/pdf",
                    file_size=102400,
                    status="verified",
                )
                db.session.add(doc_icf)
            db.session.commit()

            # Quality Check for Study A
            qc_a = QualityCheck.query.filter_by(study_id=cls.study_a_id).first()
            if not qc_a:
                qc_a = QualityCheck(
                    study_id=cls.study_a_id,
                    status="passed",
                    score=94,
                    summary="All sections verified with high consistency.",
                    checked_by=cls.researcher_id,
                    risk_flags=["Minor: Verify GMP batch certificate expiration"],
                    recommendations=["Ensure batch tracking documentation is archived"],
                )
                db.session.add(qc_a)
                db.session.commit()

            # Persist IEC Member Review for Study A
            save_study_review(
                cls.study_a_code,
                {
                    "review_id": f"rev_test_a",
                    "study_id": cls.study_a_code,
                    "reviewer_id": cls.member_id,
                    "reviewer_name": cls.member_name,
                    "reviewer_email": cls.member_email,
                    "recommendation": "recommend_approval",
                    "recommendation_label": "Recommend Approval",
                    "comments": "The study possesses robust scientific rationale grounded in Ayurvedic classical texts and appropriate safety safeguards.",
                    "sections": {
                        "scientific_validity": {"rating": "satisfactory", "notes": "Strong Medhya Rasayana justification."},
                        "safety_monitoring": {"rating": "satisfactory", "notes": "Liver function monitoring protocol is adequate."},
                    },
                    "reviewer_notes": "Recommend unanimous committee endorsement.",
                    "review_timestamp": "2026-09-08T10:00:00Z",
                },
            )

            # 3. Study B: Has no IEC Member review yet
            study_b = Study.query.filter_by(study_id="ALLA-AI-SUM-002").first()
            if not study_b:
                study_b = Study(
                    study_id="ALLA-AI-SUM-002",
                    researcher_id=cls.researcher_id,
                    title="Study Without Review",
                    study_type="observational",
                    study_design="cohort",
                    research_objective="Track lifestyle parameters",
                    status="ready_for_iec_review",
                )
                db.session.add(study_b)
                db.session.commit()
            cls.study_b_code = study_b.study_id

            # 4. Study C: Minimal/Sparse study (testing fallback handling)
            study_c = Study.query.filter_by(study_id="ALLA-AI-SUM-003").first()
            if not study_c:
                study_c = Study(
                    study_id="ALLA-AI-SUM-003",
                    researcher_id=cls.researcher_id,
                    title="Minimal Fields Study",
                    study_type="exploratory",
                    study_design="pilot",
                    research_objective="Basic pilot research",
                    status="under_iec_review",
                )
                db.session.add(study_c)
                db.session.commit()
            cls.study_c_code = study_c.study_id
            save_study_review(
                cls.study_c_code,
                {
                    "review_id": "rev_test_c",
                    "study_id": cls.study_c_code,
                    "reviewer_id": cls.member_id,
                    "reviewer_name": cls.member_name,
                    "reviewer_email": cls.member_email,
                    "recommendation": "recommend_modification",
                    "recommendation_label": "Recommend Modification",
                    "comments": "Need additional details on intervention and sample size.",
                    "sections": {},
                    "review_timestamp": "2026-09-08T11:00:00Z",
                },
            )

    def _get_token(self, user_id, role):
        with self.app.app_context():
            return create_access_token(
                identity=str(user_id),
                additional_claims={"role": role},
            )

    # --------------------------------------------------------------------------
    # 1. Valid IEC Member access -> 200
    # --------------------------------------------------------------------------
    def test_01_valid_iec_member_access(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)

    # --------------------------------------------------------------------------
    # 2. Valid IEC Secretariat access -> 200
    # --------------------------------------------------------------------------
    def test_02_valid_iec_secretariat_access(self):
        token = self._get_token(self.secretariat_id, "iec_secretariat")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

    # --------------------------------------------------------------------------
    # 3. Researcher blocked -> 403
    # --------------------------------------------------------------------------
    def test_03_researcher_blocked(self):
        token = self._get_token(self.researcher_id, "researcher")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    # --------------------------------------------------------------------------
    # 4. Invalid token blocked -> 401
    # --------------------------------------------------------------------------
    def test_04_invalid_token_blocked(self):
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        self.assertEqual(res.status_code, 401)

    # --------------------------------------------------------------------------
    # 5. Missing token blocked -> 401
    # --------------------------------------------------------------------------
    def test_05_missing_token_blocked(self):
        res = self.client.get(f"/api/iec/review-summary/{self.study_a_code}")
        self.assertEqual(res.status_code, 401)

    # --------------------------------------------------------------------------
    # 6. Study not found -> 404
    # --------------------------------------------------------------------------
    def test_06_study_not_found_404(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            "/api/iec/review-summary/NON-EXISTENT-STUDY-9999",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 404)

    # --------------------------------------------------------------------------
    # 7. Review not yet submitted -> 409
    # --------------------------------------------------------------------------
    def test_07_review_not_yet_submitted_409(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_b_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("IEC recommendation not yet available", data["message"])

    # --------------------------------------------------------------------------
    # 8. Correct study information
    # --------------------------------------------------------------------------
    def test_08_correct_study_information(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        overview = res.get_json()["data"]["study_overview"]
        self.assertEqual(overview["study_id"], self.study_a_code)
        self.assertEqual(overview["title"], "Clinical Trial of Brahmi Rasayana in Cognitive Function")
        self.assertEqual(overview["study_type"], "interventional")
        self.assertEqual(overview["sample_size"], 120)

    # --------------------------------------------------------------------------
    # 9. Correct protocol information
    # --------------------------------------------------------------------------
    def test_09_correct_protocol_information(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        proto = res.get_json()["data"]["protocol_summary"]
        self.assertTrue(proto["protocol_available"])
        self.assertEqual(proto["protocol_version"], "1.2")
        self.assertIn("Charaka Samhita", proto["background_and_rationale"])
        self.assertEqual(proto["intervention"]["name"], "Brahmi Rasayana")
        self.assertEqual(proto["intervention"]["dosage"], "5g BID")

    # --------------------------------------------------------------------------
    # 10. Correct document information
    # --------------------------------------------------------------------------
    def test_10_correct_document_information(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        docs = res.get_json()["data"]["document_readiness"]
        self.assertGreaterEqual(docs["total_documents"], 2)
        self.assertGreaterEqual(docs["verified_count"], 2)
        self.assertTrue(docs["mandatory_documents_present"])

    # --------------------------------------------------------------------------
    # 11. Correct Quality Gate information
    # --------------------------------------------------------------------------
    def test_11_correct_quality_gate_information(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        qg = res.get_json()["data"]["quality_gate"]
        self.assertTrue(qg["evaluated"])
        self.assertEqual(qg["score"], 94)
        self.assertEqual(qg["status"], "passed")
        self.assertIn("Minor: Verify GMP batch certificate expiration", qg["risk_flags"])

    # --------------------------------------------------------------------------
    # 12. Correct IEC Member recommendation
    # --------------------------------------------------------------------------
    def test_12_correct_iec_member_recommendation(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        rev = res.get_json()["data"]["iec_member_review"]
        self.assertEqual(rev["recommendation"], "recommend_approval")
        self.assertEqual(rev["recommendation_label"], "Recommend Approval")
        self.assertEqual(rev["reviewer"]["id"], self.member_id)
        self.assertIn("Ayurvedic classical texts", rev["comments"])

    # --------------------------------------------------------------------------
    # 13. Missing fields handled safely ("Not available in the current study dossier.")
    # --------------------------------------------------------------------------
    def test_13_missing_fields_handled_safely(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_c_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        # Study C has no condition or estimated_sample_size
        self.assertEqual(data["study_overview"]["condition"], "Not available in the current study dossier.")
        self.assertEqual(data["study_overview"]["sample_size"], "Not available in the current study dossier.")
        # Protocol is missing
        self.assertFalse(data["protocol_summary"]["protocol_available"])
        self.assertEqual(data["protocol_summary"]["background_and_rationale"], "Not available in the current study dossier.")

    # --------------------------------------------------------------------------
    # 14. No fabricated information
    # --------------------------------------------------------------------------
    def test_14_no_fabricated_information(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_c_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        # In Study C, Quality gate was never run
        self.assertFalse(data["quality_gate"]["evaluated"])
        self.assertIsNone(data["quality_gate"]["score"])
        self.assertEqual(data["quality_gate"]["summary"], "AI Quality Gate evaluation has not been performed on this study.")

    # --------------------------------------------------------------------------
    # 15. No database writes
    # --------------------------------------------------------------------------
    def test_15_no_database_writes(self):
        token = self._get_token(self.member_id, "iec_member")

        with self.app.app_context():
            initial_count = Study.query.count()
            s_before = db.session.get(Study, self.study_a_id)
            updated_before = s_before.updated_at

        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)

        with self.app.app_context():
            after_count = Study.query.count()
            self.assertEqual(initial_count, after_count)
            s_after = db.session.get(Study, self.study_a_id)
            self.assertEqual(s_after.updated_at, updated_before)

    # --------------------------------------------------------------------------
    # 16. No Study status changes
    # --------------------------------------------------------------------------
    def test_16_no_study_status_changes(self):
        token = self._get_token(self.member_id, "iec_member")
        with self.app.app_context():
            s_before = db.session.get(Study, self.study_a_id)
            status_before = s_before.status

        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)

        with self.app.app_context():
            s_after = db.session.get(Study, self.study_a_id)
            self.assertEqual(s_after.status, status_before)

    # --------------------------------------------------------------------------
    # 17. No final IEC decision generated
    # --------------------------------------------------------------------------
    def test_17_no_final_iec_decision_generated(self):
        token = self._get_token(self.member_id, "iec_member")
        res = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]

        # Final decision keys must not exist
        self.assertNotIn("final_decision", data)
        self.assertNotIn("decision", data)
        self.assertNotIn("committee_decision", data)

        # Must explicitly contain transparency and decision disclaimers
        self.assertIn("does not replace independent IEC judgment", data["meta"]["transparency_notice"])
        self.assertIn("does not replace independent IEC judgment or constitute the final IEC decision", data["meta"]["decision_disclaimer"])

        # Recommendation must be labeled as IEC Member Recommendation
        self.assertEqual(data["iec_member_review"]["recommendation_label"], "Recommend Approval")

    # --------------------------------------------------------------------------
    # 18. Cross-study isolation
    # --------------------------------------------------------------------------
    def test_18_cross_study_isolation(self):
        token = self._get_token(self.member_id, "iec_member")

        res_a = self.client.get(
            f"/api/iec/review-summary/{self.study_a_code}",
            headers={"Authorization": f"Bearer {token}"},
        )
        res_c = self.client.get(
            f"/api/iec/review-summary/{self.study_c_code}",
            headers={"Authorization": f"Bearer {token}"},
        )

        data_a = res_a.get_json()["data"]
        data_c = res_c.get_json()["data"]

        # Study A review should not leak into Study C
        self.assertNotEqual(data_a["study_overview"]["study_id"], data_c["study_overview"]["study_id"])
        self.assertEqual(data_a["iec_member_review"]["recommendation"], "recommend_approval")
        self.assertEqual(data_c["iec_member_review"]["recommendation"], "recommend_modification")
        self.assertNotIn("Brahmi Rasayana", data_c["study_overview"]["title"])


if __name__ == "__main__":
    unittest.main()
