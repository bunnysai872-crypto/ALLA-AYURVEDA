# AIIA AYURVEDA – DATABASE SCHEMA

## 1. Users

Stores all platform users.

* user_id
* name
* email
* phone
* password_hash
* role
* status
* created_at

Roles:

* Researcher
* IEC Secretariat
* IEC Reviewer
* Administrator

## 2. Studies

Stores clinical research studies.

* study_id
* researcher_id
* study_title
* study_type
* objectives
* study_status
* created_at
* updated_at

Study status:

* Draft
* AI Review
* Submitted to IEC
* Under IEC Review
* Modification Required
* Approved
* Not Approved
* Regulatory Tracking
* Activated
* Completed
* Closed
* Archived

## 3. Protocols

Stores research protocols.

* protocol_id
* study_id
* version
* objectives
* methodology
* participant_criteria
* intervention
* outcomes
* statistical_plan
* protocol_status
* created_at
* updated_at

## 4. Documents

Stores study-related documents.

* document_id
* study_id
* document_name
* document_type
* file_path
* version
* uploaded_by
* upload_status
* uploaded_at

## 5. AI Quality Checks

Stores AI Quality Gate results.

* ai_check_id
* study_id
* protocol_id
* check_type
* result
* issues_found
* recommendations
* risk_level
* checked_at

Check types:

* Completeness
* Consistency
* Cross-Document
* Quality/Risk

## 6. IEC Reviews

Stores IEC review information.

* review_id
* study_id
* reviewer_id
* review_status
* comments
* review_date

Review status:

* Pending
* Under Review
* Approved
* Modification Required
* Not Approved

## 7. IEC Decisions

Stores final IEC decisions.

* decision_id
* study_id
* decision
* comments
* decided_by
* decision_date

Decisions:

* Approved
* Modify
* Not Approved

## 8. Regulatory & CTRI Tracking

Stores regulatory and CTRI progress.

* tracking_id
* study_id
* regulatory_status
* ctri_status
* registration_number
* submission_date
* approval_date
* updated_at

## 9. Participants

Stores study participants.

* participant_id
* study_id
* participant_code
* enrollment_status
* enrollment_date
* created_at

Use participant codes instead of unnecessary personally identifiable information.

## 10. Informed Consent

Stores consent records.

* consent_id
* participant_id
* consent_version
* consent_status
* consent_date
* recorded_by

Consent status:

* Pending
* Consented
* Declined
* Withdrawn

## 11. Screening & Eligibility

Stores participant screening.

* screening_id
* participant_id
* screening_date
* eligibility_status
* eligibility_reason
* screened_by

Eligibility status:

* Eligible
* Not Eligible
* Pending

## 12. Enrollment & Randomization

Stores enrollment information.

* enrollment_id
* participant_id
* enrollment_date
* treatment_group
* randomization_status
* randomization_code

Randomization is optional and is used only when applicable to the study.

## 13. Clinical Visits

Stores participant visit information.

* visit_id
* participant_id
* visit_number
* visit_type
* scheduled_date
* actual_date
* visit_status
* recorded_by

## 14. Clinical Data

Stores collected study data.

* data_id
* participant_id
* visit_id
* data_type
* data_value
* unit
* recorded_by
* recorded_at
* validation_status

## 15. Data Validation

Stores CDISC/FHIR validation results.

* validation_id
* study_id
* data_id
* standard_type
* validation_status
* validation_errors
* validated_at

Standard types:

* CDISC
* FHIR

## 16. Safety Events

Stores pharmacovigilance events.

* safety_event_id
* participant_id
* study_id
* event_type
* description
* severity
* seriousness
* onset_date
* resolution_date
* reported_by
* reported_at

Event types:

* AE
* SAE
* ADR

## 17. Safety Reviews & Alerts

Stores safety review and alert information.

* alert_id
* safety_event_id
* study_id
* alert_level
* alert_message
* review_status
* reviewed_by
* reviewed_at

Alert levels:

* Low
* Medium
* High
* Critical

## 18. Study Monitoring

Stores real-time monitoring information.

* monitoring_id
* study_id
* metric_name
* metric_value
* status
* recorded_at

## 19. KPI Metrics

Stores role-based dashboard metrics.

* kpi_id
* study_id
* role
* metric_name
* metric_value
* calculated_at

## 20. AI Risk & Quality Insights

Stores AI-generated study insights.

* insight_id
* study_id
* risk_type
* risk_level
* insight
* recommendation
* generated_at

## 21. Data Analysis

Stores analysis information.

* analysis_id
* study_id
* analysis_type
* analysis_result
* generated_by
* created_at

## 22. Final Study Reports

Stores final study reports.

* report_id
* study_id
* report_version
* report_path
* report_status
* generated_by
* generated_at

## 23. Study Close-Out

Stores study completion information.

* closeout_id
* study_id
* completion_date
* closeout_status
* completed_by
* comments

## 24. Archive

Stores archived study information.

* archive_id
* study_id
* archive_location
* archived_by
* archived_at
* retention_status

## 25. Audit Trail

Records important actions performed on the platform.

* audit_id
* user_id
* study_id
* action
* module
* old_value
* new_value
* timestamp
* ip_address

Important actions include:

* Login
* Study Creation
* Protocol Update
* Document Upload
* AI Check
* IEC Submission
* IEC Decision
* Participant Creation
* Consent
* Data Update
* Safety Event
* Report Generation
* Study Close-Out
* Archive

## Database Relationship Overview

Users
→ Studies
→ Protocols
→ Documents
→ AI Quality Checks
→ IEC Reviews
→ IEC Decisions
→ Regulatory/CTRI
→ Study Activation
→ Participants
→ Consent
→ Screening
→ Enrollment
→ Clinical Visits
→ Clinical Data
→ CDISC/FHIR Validation
→ Safety Events
→ Safety Alerts
→ Monitoring
→ KPI
→ AI Risk Insights
→ Data Analysis
→ Final Report
→ Close-Out
→ Archive
→ Audit Trail
