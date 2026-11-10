# Customer Registration API — QA Portfolio Case Study

> **Status: Evidence collection in progress.** The Postman collection and SQL checks are prepared, but a completed manual end-to-end run with exported results is not yet documented. This page does not claim test execution results that have not been recorded.

## Project Context

**QA Commerce Lab** is a personal, non-production learning and portfolio project. It uses a TypeScript/Express backend with PostgreSQL, Mailpit, Redis, Docker Compose and Postman. The first implemented workflow is customer registration.

**System under test:** `POST /api/v1/auth/register`

**My QA focus:** requirements and API-contract review, risk-based test analysis, positive/negative and boundary-value scenarios, API response assertions, database verification, email-delivery checks and defect reporting.

## Scope: What Is and Is Not Implemented

- **Implemented:** Registration endpoint and related validation, user/token persistence, hashing, and documented email-delivery-failure response handling.
- **Prepared for manual QA:** Postman Registration collection (26 normal requests plus an isolated mail-failure request), local environment, SQL validation queries, test scenarios and UAT cases.
- **Not yet documented as executed:** A complete Postman run with Actual Results, PostgreSQL and Mailpit evidence.
- **Planned, not implemented in this case study:** Login, verification confirmation, password recovery, checkout, inventory, orders and invoices.

## Requirement-to-Test Examples

| Requirement / risk | Example verification | Expected behavior |
| --- | --- | --- |
| Valid customer registration | Register with valid body | `201`, verification required; no login tokens issued |
| Required fields and input validation | Omit required fields / malformed JSON | `400 VALIDATION_ERROR` |
| Duplicate account prevention | Repeat a registered email, including case variation | `409 EMAIL_ALREADY_REGISTERED` |
| Privilege escalation protection | Include user-supplied `role: ADMIN` or `status` | `400 VALIDATION_ERROR`; caller cannot set privileges |
| Boundary conditions | Valid and invalid name / password lengths | Enforce documented length and format policies |
| Data integrity | Query users and email-verification-token records | Correct `CUSTOMER` and `PENDING_VERIFICATION` state; hashed secrets; expected relationship |
| Mail delivery failure (isolated) | Temporarily disable local Mailpit before a single request | Documented `503 EMAIL_DELIVERY_FAILED` recovery response |

The table lists **planned assertions**, not observed pass results.

## QA Deliverables (Source Files)

1. [Test scenarios](../qa/test-scenarios/authentication-test-scenarios-v1.0.md)
2. [UAT scenarios](../qa/uat/authentication-uat-v1.0.md)
3. [Registration Postman collection](../qa/postman/QA-Commerce-Lab-Registration.postman_collection.json)
4. [Local Postman environment](../qa/postman/QA-Commerce-Lab-Local.postman_environment.json)
5. [How to run the Postman suite](../qa/postman/README.md)
6. [SQL database validation](../qa/sql/registration-validation.sql)
7. [Authentication API contract](../api-contract/authentication-api-contract-v1.0.md)
8. [Registration HTTP developer tests](../backend/tests/auth/register-customer.http.test.ts)

The backend also has developer-level automated tests. These are **separate from** executing the Postman manual QA suite.

## Evidence Checklist

- [ ] Run the Health Check successfully.
- [ ] Execute the 26 normal Registration requests **in sequence** and record results.
- [ ] Export or capture the test-run summary, with the run date and environment.
- [ ] Validate the relevant user row and verification-token row in PostgreSQL using the SQL queries.
- [ ] Inspect the local Mailpit verification email.
- [ ] Execute the isolated mail-failure scenario separately, if safe in the local environment.
- [ ] Record any defects with steps, actual vs expected result, environment and severity.
- [ ] Add a concise Test Summary showing passed, failed, blocked and not-run counts.
- [ ] Remove personal data, passwords, raw verification links/tokens and secrets from evidence.

## Portfolio Reporting Rules

- Do not claim a test has passed until it has been executed and evidence has been reviewed.
- Clearly separate application code, developer tests, test designs and personally executed QA checks.
- Do not share real customer data or production credentials; use only synthetic local test data.

## Next Milestone

Once the manual Registration run is complete, replace the pending status with a dated Test Execution Summary and link redacted screenshots or exported results. The result will be a concise, verifiable case study for freelance QA clients.
