# QA Commerce Lab — Project Continuity

## Purpose

This document keeps the current project direction, approved decisions, active workstream and planned QA deliverables in one place so the project can continue consistently across future work sessions.

---

## Project Goal

Build a realistic portfolio-grade QA project around a working e-commerce backend with API, PostgreSQL, email verification, authentication, authorization, transactions, concurrency, Dockerized services and realistic seeded defects.

Primary QA flow:

```text
Requirements
→ User Stories / Acceptance Criteria
→ API Contract Review
→ Test Conditions / Test Scenarios
→ Test Cases
→ API Execution
→ Database Validation
→ Defect Reporting
→ Retest
→ Regression
→ QA Reporting
→ Portfolio Artifacts
```

The project follows a module-by-module approach:

```text
Authentication
→ Products
→ Cart
→ Orders
→ Invoices
→ Returns / Refunds
→ Bulk Import
```

---

## Current Module

**Authentication**

Current API review sequence:

```text
Customer Registration
→ Email Verification
→ Resend Verification
→ Login
→ Refresh Token
→ Logout
→ Password Recovery
→ OTP Verification
→ Password Reset
→ Administrator / 2FA Flows
```

Current active discussion: **Email Verification / Resend Verification behavior and related QA scenarios.**

---

## Approved Customer Registration Decisions

Public customer registration:

```http
POST /api/v1/auth/register
```

Request fields:

- `firstName`
- `lastName`
- `email`
- `password`

Public callers do not select a role. Successful public registration is assigned `CUSTOMER` by the backend.

Registration rules:

- First Name and Last Name are required.
- Name length: 1–50 characters.
- Version 1 supports Arabic and English letters.
- Spaces, hyphens and apostrophes are allowed.
- Numeric-only names, unsupported symbols and unsupported writing systems are rejected.
- Email is required and must use a valid format.
- Email uniqueness is case-insensitive.
- Password is required.
- Password length: 8–64 characters.
- Password requires uppercase, lowercase, number and special character.
- Backend validation is mandatory even if frontend validation is also implemented.

Successful registration:

```text
Account created
→ role = CUSTOMER
→ status = PENDING_VERIFICATION
→ email-verification token generated
→ verification email sent
```

Registration must not automatically issue Access or Refresh Tokens.

The registration success response does not need to expose the user's role. It should communicate that email verification is required.

---

## Approved Role-Provisioning Model

Role selection is determined by trusted backend workflow rather than a generic client-supplied role field.

```text
Public Customer Registration
→ CUSTOMER

Administrator Customer-Provisioning Flow
→ CUSTOMER

Administrator Invitation Flow
→ ADMIN

Initial Bootstrap / Seed
→ ADMIN
```

Customer and Administrator provisioning remain separate backend workflows because their account lifecycles and security requirements differ.

---

## Approved Email Verification Design

Customer registration uses an **email verification link** rather than a numeric OTP.

Password recovery uses a separate **6-digit OTP** flow.

Email verification flow:

```text
Register
→ account = PENDING_VERIFICATION
→ secure random verification token generated
→ token hash stored in database
→ original token placed in verification email
→ customer opens verification link
→ frontend obtains token from link
→ POST /api/v1/auth/verify-email
→ backend validates token
→ account becomes ACTIVE
→ token becomes used
```

Conceptual verification request:

```http
POST /api/v1/auth/verify-email
Content-Type: application/json
```

```json
{
  "token": "<verification-token>"
}
```

Approved token rules:

- Verification token is secure and random.
- Token is one-time use.
- Verification link validity is **24 hours**.
- Expired verification links do not delete the account.
- Expired accounts remain `PENDING_VERIFICATION` until verification succeeds.
- A customer does not need to register again after a verification link expires.
- Only the latest issued verification token is valid.
- Requesting a new verification email invalidates the previously issued verification token immediately.
- Successful verification changes `PENDING_VERIFICATION` to `ACTIVE`.

---

## Approved Resend Verification Behavior

Resend is available for an unverified customer.

```http
POST /api/v1/auth/resend-verification
```

Core rules:

- Resend cooldown: **60 seconds**.
- The 60-second cooldown controls how soon another email may be requested; it is separate from the 24-hour verification-link lifetime.
- A customer may request a new verification email before the current link reaches 24 hours, after the resend cooldown passes.
- Resend generates a new verification token.
- Resend invalidates the previously issued token.
- Only the newest verification link may activate the account.
- A customer with an expired link remains able to request a new verification email without re-registration.

Important QA scenario:

> Verify that requesting a new verification email invalidates the previously issued verification link and only the latest verification link can activate the account.

Example execution flow:

```text
Register
→ Token A issued
→ wait until resend is permitted
→ Resend Verification
→ Token B issued
→ Token A must fail
→ Token B must succeed
```

---

## Authentication Token Distinction

Do not confuse the following token types:

```text
Email Verification Token
→ verifies email ownership
→ one-time use
→ 24-hour lifetime

Access Token
→ authenticates protected API requests
→ issued after successful login
→ 15-minute lifetime

Refresh Token
→ obtains replacement Access Tokens
→ issued after successful login
→ 7-day lifetime with rotation
```

An expired Access Token on a protected endpoint normally produces `401 Unauthorized`.

An expired Email Verification Token is not an authentication failure; its exact error response is defined by the verification API contract.

---

## QA Learning Focus

The project should explicitly build practical skill in:

- Test Conditions
- Test Scenarios
- Test Cases
- Positive Testing
- Negative Testing
- Boundary Testing
- Security Testing
- API Status Codes
- Database Validation
- UAT Scenarios
- Requirements / Acceptance Criteria traceability

Test Scenario principle:

> A Test Scenario describes the behavior or business condition that QA needs to validate.

UAT principle:

> A UAT Scenario validates whether the delivered behavior satisfies the real business or end-user need without depending on low-level technical implementation details.

Example:

**Test Scenario**

> Verify that requesting a new verification email invalidates the previously issued verification link.

**UAT Scenario**

> As an unverified customer, I can request a new verification email and use the latest link to activate my existing account without registering again.

---

## Planned Final QA Artifacts

Before project completion, create and commit dedicated portfolio-ready files for at least:

```text
qa/test-scenarios/
qa/uat/
qa/test-cases/
qa/defects/
qa/execution-reports/
qa/regression/
```

The final Test Scenario and UAT files must consolidate the approved scenarios from all completed project modules rather than relying only on conversation history.

---

## Environment Direction

Planned stack:

- TypeScript
- Node.js
- Express.js
- REST
- OpenAPI / Swagger
- PostgreSQL
- Redis
- Mailpit
- Docker Compose

Backend layering:

```text
Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

The public QA repository should contain requirements, API contracts, QA artifacts, Postman content, SQL and environment instructions. Seeded backend defect implementation should not expose the hidden defect answer key in the public repository.

---

## Backend Engineering and Clean-Code Standard

When backend implementation begins, the backend source code must also be maintained in GitHub and treated as a real software project rather than disposable demo code.

Expected engineering standards:

- TypeScript strict typing where practical.
- Clear module boundaries by business domain.
- Thin Routes and Controllers.
- Business rules live primarily in Services.
- Database access is isolated in Repositories.
- Request validation is separated from Controllers.
- Authentication and Authorization are enforced through dedicated middleware/services.
- Centralized error handling and consistent API error responses.
- No hard-coded secrets, passwords, tokens, connection strings or environment-specific credentials.
- Environment configuration is loaded from environment variables with a safe `.env.example`.
- Secure password hashing and token handling.
- Database migrations and controlled seed/bootstrap scripts.
- Proper transactions for multi-step business operations.
- Reusable utilities only when they remove real duplication; avoid unnecessary abstractions.
- Meaningful names, small focused functions and minimal duplicated logic.
- ESLint / formatting standards should be applied consistently.
- OpenAPI contract and implementation should remain aligned.
- Important backend behavior should have automated developer-level tests where appropriate, while QA testing remains independent.
- Docker setup must allow the full environment to be started consistently.

Target module structure:

```text
src/
├── config/
├── db/
│   ├── migrations/
│   └── seeds/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.validation.ts
│   │   └── auth.types.ts
│   ├── users/
│   ├── products/
│   ├── cart/
│   ├── inventory/
│   ├── orders/
│   ├── invoices/
│   ├── returns/
│   ├── payments/
│   └── bulk-import/
├── middleware/
├── services/
├── utils/
├── app.ts
└── server.ts
```

Backend repository strategy:

- The backend should be version-controlled in GitHub.
- If seeded implementation defects are intentionally hidden from students or public portfolio readers, keep the source in a private backend repository and expose a runnable Docker image or controlled environment to the public QA project.
- The public QA repository must not contain a hidden-bug answer key.
- Commit history should remain readable and professional.
- Backend implementation decisions should be documented enough that the project can continue across future work sessions.

Before considering the backend complete, perform a code-quality review for architecture, naming, duplication, error handling, security, database consistency and contract alignment.

---

## Next Step

Continue the Authentication module with:

```text
POST /api/v1/auth/resend-verification
```

Review the Developer Draft as QA and derive:

- Functional Test Scenarios
- Negative Test Scenarios
- Boundary / Timing Scenarios
- Security Scenarios
- Expected HTTP status codes
- UAT Scenarios

Then continue to Login after the verification/resend contract is finalized.
