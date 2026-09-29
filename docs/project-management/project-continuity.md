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

Current review sequence:

```text
Customer Registration ✅
→ Email Verification ✅
→ Resend Verification ✅
→ First Admin Provisioning ✅
→ Additional Admin Invitation ✅
→ Admin Email OTP / second-step rules ✅
→ Login ← NEXT
→ Refresh Token
→ Logout
→ Password Recovery
→ OTP Verification
→ Password Reset
```

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

---

## Approved Role-Provisioning Model

Role assignment is determined by the trusted backend workflow rather than a generic client-supplied `role` field.

```text
Public Customer Registration
→ CUSTOMER

Administrator Customer Provisioning
→ CUSTOMER

Initial Administrator Bootstrap / Seed
→ ADMIN

Administrator Invitation Workflow
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
→ secure random raw verification token generated
→ token hash stored in database
→ raw token placed in verification email link
→ customer opens verification link
→ frontend obtains token from link
→ POST /api/v1/auth/verify-email
→ backend hashes received token and compares it to the stored hash
→ backend validates expiry / used / revoked state
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

```http
POST /api/v1/auth/resend-verification
```

Core rules:

- Resend cooldown: **60 seconds**.
- The cooldown is separate from the 24-hour token lifetime.
- A customer may request a new verification email before the current link reaches 24 hours once the cooldown has passed.
- Resend generates a new verification token.
- Resend invalidates the previously issued token.
- Only the newest verification link may activate the account.
- A customer with an expired link remains able to request a new verification email without re-registration.
- A successful resend must not create a duplicate customer account.

Important QA scenarios include:

> Verify that requesting a new verification email invalidates the previously issued verification link and only the latest verification link can activate the account.

> Verify that a successfully used verification link cannot be reused.

> Verify that a customer with an expired verification link can request a new verification email and activate the existing account without registering again.

---

## Approved Initial Administrator Bootstrap

The first Administrator is not publicly registered. The account is created through secure bootstrap / seed setup.

Approved behavior:

- Backend assigns `role = ADMIN`.
- Bootstrap must be idempotent and must not create duplicate initial Admin accounts.
- Initial credentials must come from secure environment configuration, not hard-coded source code.
- The initial password is temporary.
- The initial Admin must replace the temporary password during the first successful sign-in flow before receiving normal privileged access.
- After successful password replacement, the original temporary password becomes invalid.
- A database flag such as `must_change_password` may be used to enforce this lifecycle.
- Admin second-step email verification remains mandatory before an authenticated Admin session is issued.

Conceptual first-Admin flow:

```text
Secure bootstrap / seed
→ ADMIN account with temporary password
→ first sign-in credentials accepted
→ email OTP challenge
→ OTP verified
→ forced password change
→ temporary password invalidated
→ Access Token + Refresh Token issued
```

The exact ordering between OTP completion and forced password-change API calls will be frozen in the Login API contract, but neither step may be bypassed before privileged session issuance.

---

## Approved Additional Administrator Invitation Flow

Additional Admins are created through an authenticated Administrator invitation workflow.

Conceptual endpoint:

```http
POST /api/v1/admin/admin-invitations
Authorization: Bearer <admin-access-token>
```

Conceptual request:

```json
{
  "firstName": "Ahmad",
  "lastName": "Ali",
  "email": "ahmad@company.com"
}
```

Rules:

- Only an authenticated and authorized `ADMIN` may invite another Admin.
- An authenticated `CUSTOMER` attempting this operation is forbidden.
- The request does not contain a generic `role` field.
- The backend assigns `ADMIN` through the trusted invitation workflow.
- The inviting Admin does not choose the invited Admin's password.
- The invited person chooses their own password when accepting the invitation.
- Admin invitation lifetime is **24 hours**.
- The invitation is one-time use.
- Resend / new invitation invalidates the previously issued invitation immediately.
- Only the latest Admin invitation token is valid.
- Used, expired, invalid or revoked invitations cannot create an Admin account.
- Expiration of an invitation does not create an Admin account automatically.
- After expiry, an authorized Admin must send a new invitation.
- Invitation acceptance must not create duplicate accounts for the same email.

Conceptual flow:

```text
Existing ADMIN
→ create Admin invitation
→ raw invitation token sent by email
→ token hash stored in DB
→ invitee opens valid link within 24 hours
→ invitee chooses valid password
→ backend creates account
→ backend assigns role = ADMIN
→ invitation marked used
→ Admin account can later authenticate using password + mandatory email OTP
```

Expected status-code baseline for reviewed scenarios:

```text
Valid Admin invitation creation                → 201 Created
Authenticated CUSTOMER tries Admin invitation  → 403 Forbidden
Expired Admin invitation acceptance            → 400 Bad Request
Revoked/old invitation after resend             → 400 Bad Request
Valid invitation acceptance + account creation → 201 Created
Missing/invalid authentication on admin API     → 401 Unauthorized
```

For invalid / expired / used / revoked invitation tokens, the contract should use a generic error response such as `INVALID_INVITATION` rather than exposing unnecessary token-state details.

---

## Approved Admin Email OTP / Second-Step Authentication

For this project, Administrator second-step authentication uses a **6-digit verification code sent to the Administrator's email**. No authenticator application is required.

Important distinction:

```text
Admin Invitation Email
→ account provisioning / invitation acceptance

Admin Login Email OTP
→ second authentication step during login
```

Admin login behavior:

```text
Email + Password
→ credentials valid
→ backend detects role = ADMIN
→ generate 6-digit email OTP
→ store OTP hash / challenge state
→ send raw OTP by email
→ do NOT issue Access/Refresh tokens yet
→ Admin submits OTP
→ backend validates challenge / expiry / attempts / used state
→ if valid, authentication completes
→ Access Token + Refresh Token issued
```

Approved principles:

- Password success alone is not a completed Admin login.
- Access and Refresh Tokens are not issued until the email OTP step succeeds.
- The OTP is one-time use.
- A new OTP invalidates the previous OTP.
- OTP material should not be stored in plaintext when avoidable; a hash should be stored.
- Email delivery failure must never bypass the second authentication step.
- Admin second-step verification is required for every new login session in Version 1.
- Trusted-device / remember-this-device behavior is out of scope for Version 1.

The exact Admin login OTP lifetime, maximum failed attempts, resend cooldown and recovery rules will be frozen during the Login API contract review. The current design direction is a short-lived code with attempt limits and resend protection.

---

## Token Fundamentals Adopted for the Project

A token is a value used to prove or represent a specific action, authorization or state.

For opaque verification / invitation tokens:

```text
Backend generates secure random RAW TOKEN
→ RAW TOKEN is sent to the user in the email link
→ Backend hashes the token
→ Database stores TOKEN HASH, not raw token

User later submits RAW TOKEN
→ Backend hashes received token using the same algorithm
→ compares resulting hash with stored token_hash
→ if hash matches, then also checks expiry / used / revoked state
```

Example storage model:

```text
created_at  → when token/invitation was issued
expires_at  → last validity point
used_at     → when successfully consumed; NULL before use
revoked_at  → when explicitly invalidated; NULL while not revoked
```

Validity requires more than a matching hash:

```text
token hash matches
AND NOW < expires_at
AND used_at IS NULL
AND revoked_at IS NULL
```

Token hashes are one-way fingerprints and are not the same as encryption.

For invitation and verification flows, token expiry is controlled by backend business logic / configuration and persisted as `expires_at` in the database. Example configuration direction:

```text
EMAIL_VERIFICATION_EXPIRY_HOURS=24
ADMIN_INVITATION_EXPIRY_HOURS=24
RESEND_COOLDOWN_SECONDS=60
```

Backend calculation concept:

```text
created_at = current time
expires_at = current time + configured lifetime
```

Store server/database timestamps consistently, preferably UTC, and convert only for user-facing display when necessary.

For QA environments, expiry scenarios may be tested by controlled test data, adjusting test configuration, or setting `expires_at` into the past rather than physically waiting 24 hours.

---

## Authentication Token Distinction

Do not confuse token types:

```text
Email Verification Token
→ verifies customer email ownership
→ opaque random secret
→ one-time use
→ 24-hour lifetime

Admin Invitation Token
→ proves possession of a valid Admin invitation
→ opaque random secret
→ one-time use
→ 24-hour lifetime

Admin Login OTP
→ six-digit email verification code
→ second step for Admin login
→ short-lived and one-time use

Access Token
→ authenticates protected API requests
→ issued only after completed login
→ 15-minute lifetime

Refresh Token
→ obtains replacement Access Tokens
→ issued only after completed login
→ 7-day lifetime with rotation
```

An expired Access Token on a protected endpoint normally produces `401 Unauthorized`.

Expired email-verification or invitation credentials are not Access Token authentication failures; their exact API error responses are defined by their own endpoint contracts.

---

## QA Learning Focus

The project explicitly builds practical skill in:

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

Approved examples include:

**Test Scenario**

> Verify that requesting a new verification email invalidates the previously issued verification link.

**UAT Scenario**

> As an unverified customer, I can request a new verification email and use the latest link to activate my existing account without registering again.

**Admin UAT**

> As the initial Administrator, I must replace the temporary system-provided password with my own secure password before using privileged functionality.

> As an authorized Administrator, I can invite another Administrator without allowing public users or Customers to create Admin accounts.

> As an invited Administrator, I can accept a valid invitation, choose my password and create my Administrator account.

> As an Administrator, I must verify a code sent to my email before I can complete login and access administrative functionality.

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

The final Test Scenario and UAT files must consolidate approved scenarios from all completed modules rather than relying only on conversation history.

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

---

## Backend Engineering and Clean-Code Standard

When backend implementation begins, the backend source code must be maintained in GitHub and treated as a real software project rather than disposable demo code.

Expected engineering standards:

- TypeScript strict typing where practical.
- Clear module boundaries by business domain.
- Thin Routes and Controllers.
- Business rules primarily in Services.
- Database access isolated in Repositories.
- Request validation separated from Controllers.
- Authentication and Authorization enforced through dedicated middleware/services.
- Centralized error handling and consistent API error responses.
- No hard-coded secrets, passwords, tokens, connection strings or environment-specific credentials.
- Environment configuration loaded from environment variables with a safe `.env.example`.
- Secure password hashing and token handling.
- Database migrations and controlled seed/bootstrap scripts.
- Proper transactions for multi-step business operations.
- Meaningful names, small focused functions and minimal duplicated logic.
- ESLint / formatting standards applied consistently.
- OpenAPI contract and implementation kept aligned.
- Important backend behavior covered by developer-level automated tests where appropriate while QA remains independent.
- Docker setup must allow the full environment to start consistently.

Target module structure:

```text
src/
├── config/
├── db/
│   ├── migrations/
│   └── seeds/
├── modules/
│   ├── auth/
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

Backend repository visibility is **not yet finalized**. The backend will be version-controlled in GitHub, but the final choice between a public or private source repository will be made later. The public QA portfolio must not expose any hidden seeded-bug answer key.

---

## Next Step

Continue Authentication with the **Login API contract**.

The next review must cover both:

```text
Customer Login
→ Email + Password
→ successful authentication
→ Access Token + Refresh Token

Admin Login
→ Email + Password
→ Email OTP challenge
→ OTP verification
→ if initial bootstrap Admin and temporary password is still active: forced password replacement
→ Access Token + Refresh Token only after all required steps complete
```

Login review must include validation, account-state rules, generic credential failures, account-enumeration protection, lockout, rate limiting, Admin OTP behavior, token issuance and expected HTTP status codes.
