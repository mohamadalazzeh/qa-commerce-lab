# Sprint 0 — Discovery & Test Analysis

> **Tracking note (13 Nov 2026):** This file records the original Sprint 0 plan and currently still shows **In Progress**. Actual Authentication implementation and Registration API/DB/Gmail testing progressed beyond the original Sprint 0 out-of-scope boundary. Do not silently infer that those activities were done inside this sprint. See [QCL-011](https://github.com/mohamadalazzeh/qa-commerce-lab/issues/5) to reconcile tracking and determine a formal sprint transition.

## Sprint Goal

Establish a shared understanding of the system before API execution begins.

The QA focus for this sprint is to review the available product documentation, identify missing or ambiguous information, prepare requirement questions, and review the API contract before designing executable API tests.

## Scope

- System overview review
- Product requirements review
- User story and acceptance criteria review
- Requirement questions and ambiguity log
- Initial risk identification
- API contract / OpenAPI review
- Initial test condition preparation
- Business Requirements Document (BRD) drafting and scope clarification

## Out of Scope

- Postman execution
- Database validation
- Defect execution evidence
- Regression testing
- Automation

These activities begin in later sprints after the analysis baseline is completed.

## Backlog

| ID | Task | Status |
|---|---|---|
| QCL-001 | Review System Overview | Done |
| QCL-002 | Review Authentication Requirements | In Progress |
| QCL-003 | Review Product Requirements | To Do |
| QCL-004 | Review Order Requirements | To Do |
| QCL-005 | Review Invoice Requirements | To Do |
| QCL-006 | Prepare Requirement Questions Log | To Do |
| QCL-007 | Review OpenAPI Contract | To Do |
| QCL-008 | Prepare Initial Test Conditions | To Do |
| [QCL-009](https://github.com/mohamadalazzeh/qa-commerce-lab/issues/3) | Review and baseline e-commerce BRD | In Progress — Draft ready for review |
| [QCL-010](https://github.com/mohamadalazzeh/qa-commerce-lab/issues/4) | Confirm future website vs API-only V1 scope | To Do |
| [QCL-011](https://github.com/mohamadalazzeh/qa-commerce-lab/issues/5) | Reconcile Sprint 0 tracker with actual Authentication progress | To Do |

## Current QA Assignment

### QCL-002 — Authentication Requirement Review

Review the Authentication requirements before writing test cases.

Expected analysis areas:

- Missing information
- Ambiguous requirements
- Questions for Product / Business Analysis
- Questions for Backend when contract-level clarification is needed
- Potential risks
- Requirement contradictions

### Deliverable

Prepare requirement questions for Registration and Login and identify at least five findings.

Do not execute the API during this task.

## Sprint Deliverables

- Requirement Review / Questions Log
- Reviewed User Stories and Acceptance Criteria
- Reviewed API Contract / OpenAPI specification
- Initial Test Conditions
- Sprint learning notes
- [E-commerce BRD v0.1 (draft)](../business-analysis/ecommerce-business-requirements-document-v0.1.md), pending business review
- GitHub project documentation

## Environment

| Field | Value |
|---|---|
| Environment | QA |
| Build | `0.9.0-RC1` |
| Sprint Status | In Progress |

## Sprint 0 Review Notes (13 Nov 2026)

- The BRD has been drafted based on the existing product requirements and business-rule documents; it is **not approved or signed off**.
- The target *e-commerce website* is a future business vision. The detailed Product Requirements v1.0 explicitly place full customer/admin frontend implementation **out of scope** for that release.
- Tasks QCL-001 to QCL-008 remain listed with their original tracking statuses. Their present completion state needs an evidence-based reconciliation under QCL-011 before closing Sprint 0.
- Only QCL-002 was previously represented as a named GitHub Issue; the other legacy backlog items were present in this document, so they have not been duplicated blindly as new GitHub Issues.
