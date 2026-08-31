# AIIA AYURVEDA – API CONTRACT

## 1. General API Rules

Base URL during development:

`http://localhost:5000/api`

All APIs use JSON unless the endpoint is specifically for file upload.

Authentication:

`Authorization: Bearer <JWT_TOKEN>`

Standard success response:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Standard error response:

```json
{
  "success": false,
  "message": "Error description"
}
```

Frontend and backend developers must follow these endpoint names and response formats.

---

# 2. Authentication APIs

## Register

`POST /auth/register`

Request:

```json
{
  "name": "Researcher Name",
  "email": "researcher@example.com",
  "phone": "9999999999",
  "password": "password",
  "role": "researcher"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 1,
    "role": "researcher"
  }
}
```

## Login

`POST /auth/login`

Request:

```json
{
  "email": "researcher@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "user_id": 1,
      "name": "Researcher Name",
      "email": "researcher@example.com",
      "role": "researcher"
    }
  }
}
```

## Current User

`GET /auth/me`

Requires JWT.

---

# 3. Study APIs

## Create Study

`POST /studies`

Request:

```json
{
  "study_title": "Ayurvedic Clinical Study",
  "study_type": "Interventional",
  "objectives": "Study objectives"
}
```

Response:

```json
{
  "success": true,
  "message": "Study created",
  "data": {
    "study_id": 1,
    "study_status": "Draft"
  }
}
```

## Get Researcher's Studies

`GET /studies`

## Get Study

`GET /studies/{study_id}`

## Update Study

`PUT /studies/{study_id}`

## Submit Study for AI Quality Check

`POST /studies/{study_id}/submit-ai-check`

---

# 4. Protocol APIs

## Create Protocol

`POST /studies/{study_id}/protocol`

Request:

```json
{
  "objectives": "Study objectives",
  "methodology": "Study methodology",
  "participant_criteria": "Eligibility criteria",
  "intervention": "Intervention details",
  "outcomes": "Expected outcomes",
  "statistical_plan": "Statistical plan"
}
```

## Get Protocol

`GET /studies/{study_id}/protocol`

## Update Protocol

`PUT /studies/{study_id}/protocol`

## Create New Protocol Version

`POST /studies/{study_id}/protocol/version`

---

# 5. Document APIs

## Upload Document

`POST /studies/{study_id}/documents`

Use `multipart/form-data`.

Fields:

* file
* document_type

## Get Study Documents

`GET /studies/{study_id}/documents`

## Delete Document

`DELETE /documents/{document_id}`

---

# 6. AI Quality Gate APIs

## Run Quality Check

`POST /ai/studies/{study_id}/quality-check`

Response:

```json
{
  "success": true,
  "data": {
    "study_id": 1,
    "overall_status": "Issues Found",
    "completeness": {
      "status": "Pass",
      "issues": []
    },
    "consistency": {
      "status": "Warning",
      "issues": [
        "Participant count differs between documents"
      ]
    },
    "cross_document": {
      "status": "Pass",
      "issues": []
    },
    "quality_risk": {
      "risk_level": "Medium",
      "flags": [
        "Missing safety monitoring details"
      ]
    }
  }
}
```

Possible overall statuses:

* Pass
* Issues Found

Possible risk levels:

* Low
* Medium
* High
* Critical

---

# 7. AI Resubmission

After issues are fixed:

`POST /ai/studies/{study_id}/resubmit`

The study is checked again by the AI Quality Gate.

---

# 8. IEC APIs

## Submit to IEC

`POST /studies/{study_id}/submit-iec`

## IEC Studies

`GET /iec/studies`

## Get Study for IEC Review

`GET /iec/studies/{study_id}`

## Verify Documents

`POST /iec/studies/{study_id}/document-verification`

Request:

```json
{
  "status": "verified",
  "comments": "All required documents verified"
}
```

## IEC Review

`POST /iec/studies/{study_id}/review`

Request:

```json
{
  "comments": "Review comments"
}
```

---

# 9. AI Review Summary

## Generate IEC Review Summary

`POST /ai/studies/{study_id}/iec-summary`

Response:

```json
{
  "success": true,
  "data": {
    "summary": "AI-generated review summary",
    "key_findings": [],
    "risk_flags": [],
    "recommendation": "Review Required"
  }
}
```

The AI summary is an aid for reviewers and does not replace the IEC's decision.

---

# 10. IEC Decision

`POST /iec/studies/{study_id}/decision`

Request:

```json
{
  "decision": "approved",
  "comments": "IEC decision comments"
}
```

Allowed decisions:

* approved
* modification_required
* not_approved

If:

`modification_required`

the study returns to the researcher for modification and resubmission.

---

# 11. Regulatory & CTRI APIs

## Get Regulatory Status

`GET /studies/{study_id}/regulatory`

## Update Regulatory Status

`PUT /studies/{study_id}/regulatory`

Request:

```json
{
  "regulatory_status": "Submitted",
  "ctri_status": "Registered",
  "registration_number": "CTRI/XXXX/XXXX"
}
```

---

# 12. Study Activation

`POST /studies/{study_id}/activate`

Study can only be activated after the required approvals and regulatory conditions are satisfied.

---

# 13. Participant APIs

## Add Participant

`POST /studies/{study_id}/participants`

Request:

```json
{
  "participant_code": "P001"
}
```

## Get Participants

`GET /studies/{study_id}/participants`

## Participant Details

`GET /participants/{participant_id}`

---

# 14. Informed Consent APIs

## Record Consent

`POST /participants/{participant_id}/consent`

Request:

```json
{
  "consent_version": "1.0",
  "consent_status": "consented"
}
```

## Get Consent

`GET /participants/{participant_id}/consent`

---

# 15. Screening & Eligibility

## Screening

`POST /participants/{participant_id}/screening`

Request:

```json
{
  "eligibility_status": "eligible",
  "eligibility_reason": "Meets all inclusion criteria"
}
```

## Get Screening

`GET /participants/{participant_id}/screening`

---

# 16. Enrollment / Randomization

## Enroll Participant

`POST /participants/{participant_id}/enrollment`

Request:

```json
{
  "randomization_status": "not_applicable"
}
```

For applicable randomized studies:

```json
{
  "randomization_status": "randomized",
  "treatment_group": "Group A"
}
```

---

# 17. Clinical Visit APIs

## Create Visit

`POST /participants/{participant_id}/visits`

Request:

```json
{
  "visit_number": 1,
  "visit_type": "Baseline",
  "scheduled_date": "2026-09-01"
}
```

## Update Visit

`PUT /visits/{visit_id}`

## Get Visits

`GET /participants/{participant_id}/visits`

---

# 18. Clinical Data APIs

## Record Clinical Data

`POST /visits/{visit_id}/clinical-data`

Request:

```json
{
  "data_type": "Blood Pressure",
  "data_value": "120/80",
  "unit": "mmHg"
}
```

## Get Clinical Data

`GET /participants/{participant_id}/clinical-data`

---

# 19. CDISC / FHIR Validation

## Validate Clinical Data

`POST /clinical-data/{data_id}/validate`

Request:

```json
{
  "standard_type": "FHIR"
}
```

Allowed standards:

* CDISC
* FHIR

Response:

```json
{
  "success": true,
  "data": {
    "validation_status": "valid",
    "errors": []
  }
}
```

---

# 20. Pharmacovigilance APIs

## Report Safety Event

`POST /participants/{participant_id}/safety-events`

Request:

```json
{
  "event_type": "AE",
  "description": "Event description",
  "severity": "Moderate",
  "seriousness": "Non-Serious"
}
```

Allowed event types:

* AE
* SAE
* ADR

## Get Safety Events

`GET /studies/{study_id}/safety-events`

---

# 21. Safety Review & Alerts

## Review Safety Event

`POST /safety-events/{safety_event_id}/review`

## Generate Safety Alert

`POST /safety-events/{safety_event_id}/alert`

Alert levels:

* Low
* Medium
* High
* Critical

---

# 22. Real-Time Monitoring

## Study Monitoring

`GET /studies/{study_id}/monitoring`

Returns:

* Enrollment progress
* Visit completion
* Data completion
* Missing data
* Safety events
* Protocol deviations
* Study status

---

# 23. KPI Dashboard

## Get KPIs

`GET /studies/{study_id}/kpis`

Response:

```json
{
  "success": true,
  "data": {
    "total_participants": 100,
    "enrolled": 75,
    "completed": 40,
    "active": 35,
    "safety_events": 5
  }
}
```

The dashboard must be role-based.

---

# 24. AI Risk & Quality Insights

## Generate Risk Insights

`POST /ai/studies/{study_id}/risk-insights`

Response:

```json
{
  "success": true,
  "data": {
    "overall_risk": "Medium",
    "insights": [],
    "recommendations": []
  }
}
```

AI-generated insights are decision-support information and require human review.

---

# 25. Data Analysis

## Generate Analysis

`POST /studies/{study_id}/analysis`

Request:

```json
{
  "analysis_type": "Descriptive Statistics"
}
```

## Get Analysis

`GET /studies/{study_id}/analysis`

---

# 26. Final Study Report

## Generate Final Report

`POST /studies/{study_id}/report`

## Get Final Report

`GET /studies/{study_id}/report`

---

# 27. Study Close-Out

## Close Study

`POST /studies/{study_id}/closeout`

Request:

```json
{
  "comments": "Study completed successfully"
}
```

---

# 28. Archive

## Archive Study

`POST /studies/{study_id}/archive`

The study should only be archived after the required close-out steps are completed.

---

# 29. Audit Trail

## Get Audit Trail

`GET /studies/{study_id}/audit`

Audit records should capture important actions such as:

* Login
* Study creation
* Protocol changes
* Document upload
* AI checks
* IEC submission
* IEC decisions
* Participant actions
* Consent
* Clinical data changes
* Safety events
* Report generation
* Study close-out
* Archive

---

# 30. API Development Rules

1. Frontend developers must not change endpoint names without backend team agreement.
2. Backend developers must not change response structures without informing the frontend team.
3. Database field names must follow `DATABASE_SCHEMA.md`.
4. Workflow must follow `PROJECT_WORKFLOW.md`.
5. Authentication-protected APIs must require JWT authentication.
6. Role-based authorization must be enforced on the backend.
7. Participant data must be handled securely.
8. AI outputs must be treated as decision-support information and not as a replacement for qualified human review.
9. All important study actions must be recorded in the audit trail.
10. All six developers must follow these documents when generating code with ChatGPT.
