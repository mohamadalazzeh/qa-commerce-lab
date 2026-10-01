# QA Commerce Lab — Project Continuity

## Purpose

This document keeps the current project direction, approved decisions, active workstream and planned QA deliverables in one place so the project can continue consistently across future sessions.

Use it together with `docs/project-management/current-checkpoint.md`.

---

## Project Goal

Build a realistic portfolio-grade QA project around a working e-commerce backend with API, PostgreSQL, authentication, authorization, email flows, transactions, concurrency, Dockerized services and realistic QA execution.

The project is intentionally incremental by module:

```text
Requirements
→ Business Rules / Clarifications
→ API Contract
→ Test Scenarios / UAT
→ Backend Implementation
→ Detailed Test Cases
→ Postman API Testing
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

Module sequence:

```text
Authentication
→ Products
→ Cart
→ Orders
→ Invoices
→ Returns / Refunds
→ Bulk Import
```

Do not wait until every module's requirements are finished before testing. Finish one module's contract, build it, test it, then continue incrementally.

---

## Current Workstream

Current module: **Authentication**.

Requirements/business behavior are substantially complete. Current work is the **Authentication API Contract**, reviewed endpoint-by-endpoint before backend implementation.

Completed/frozen at the current contract level:

```text
Customer Registration ✅
Customer Email Verification ✅
Verification link lifetime = 24 hours ✅
Customer verification resend cooldown = 60 seconds ✅
Expired-link Verification Resend UX ✅
```

Detailed Test Cases remain intentionally deferred until the Authentication backend is running and Postman execution begins.

**Before backend implementation starts, stop and discuss the backend plan with the user first.**

---

## Customer Registration

Endpoint:

```http
POST /api/v1/auth/register
```

Request fields:

- `firstName`
- `lastName`
- `email`
- `password`

The public caller does not submit `role` or `status`. The backend assigns:

```text
role = CUSTOMER
status = PENDING_VERIFICATION
```

Core validation:

- First/Last Name required, length 1–50.
- Version 1 supports Arabic and English letters; spaces, hyphens and apostrophes are allowed.
- Numeric-only names, unsupported symbols and unsupported scripts are rejected.
- Email required, valid format, case-insensitive uniqueness.
- Password required, 8–64 characters, uppercase + lowercase + number + special character.
- Backend validation is mandatory even if frontend validation exists.
- Unexpected privileged fields such as `role` are rejected.

Success:

```text
201 Created
→ CUSTOMER account created
→ PENDING_VERIFICATION
→ verification email/link sent
→ no Access/Refresh Tokens
```

Duplicate email baseline:

```text
409 / EMAIL_ALREADY_REGISTERED
```

---

## Customer Email Verification

Customer registration uses an **email verification link**, not a numeric OTP.

Endpoint:

```http
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "token": "<verification-token>"
}
```

Token rules:

- secure random opaque token;
- raw token sent in email link;
- hash stored in DB;
- one-time use;
- 24-hour lifetime;
- expired link does not delete the account;
- account remains `PENDING_VERIFICATION` until successful verification;
- successful verification changes account to `ACTIVE`;
- no Access/Refresh Tokens are issued by email verification.

Error direction:

```text
Missing token                 → 400 / VALIDATION_ERROR
Expired token                 → 400 / VERIFICATION_TOKEN_EXPIRED
Invalid/revoked/old token     → 400 / INVALID_VERIFICATION_TOKEN
```

Expired is intentionally distinguishable so a future frontend can show the replacement-link action.

---

## Verification Resend — Version 1 Rule

Verification-link lifetime and resend cooldown are separate concepts:

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
```

The verification link does not expire after 60 seconds. The 60 seconds only control when the Customer may request another verification email.

User-facing behavior:

```text
Verification email sent
→ Resend button disabled for 60 seconds
→ after 60 seconds, Resend becomes available if account is still PENDING_VERIFICATION
```

This is useful when the first email is delayed, lost, deleted or not noticed, and it also keeps QA testing practical without waiting 24 hours.

If the link itself expires after 24 hours:

```text
Customer opens expired verification link
→ verify-email returns VERIFICATION_TOKEN_EXPIRED
→ frontend displays "Verification link expired"
→ frontend displays [Resend Verification Email]
→ Customer clicks the button only
→ Customer does not re-enter the email
→ backend identifies the pending account from the expired token record/context
→ replacement link is sent to the email already stored on that account
```

Conceptual endpoint/request:

```http
POST /api/v1/auth/resend-verification
```

```json
{
  "token": "<verification-token>"
}
```

Success baseline:

```text
200 OK
```

```json
{
  "message": "A new verification email has been sent."
}
```

Rules:

- resend before 60 seconds is rejected;
- resend after 60 seconds is allowed if the account remains `PENDING_VERIFICATION`;
- successful resend creates a new verification token with a fresh 24-hour lifetime;
- successful resend invalidates the previous verification token immediately;
- only the newest verification link may activate the account;
- the same Customer account is reused; no duplicate account is created;
- the destination email cannot be changed from the expired-link resend flow;
- frontend disabling is only UX; backend must enforce the cooldown against direct API calls.

The exact HTTP status/business code for a resend attempt during the cooldown remains to be frozen in the API-contract review.

---

## Role Provisioning

Role assignment comes from trusted backend workflows, not a generic client-supplied role field:

```text
Public Customer Registration → CUSTOMER
Admin Customer Provisioning  → CUSTOMER
Initial Admin Bootstrap      → ADMIN
Admin Invitation Workflow    → ADMIN
```

---

## First Administrator Bootstrap

The first Admin is created through secure bootstrap/seed, not public registration.

Rules:

- backend assigns `ADMIN`;
- bootstrap is idempotent;
- credentials come from environment configuration, not hard-coded source;
- initial password is temporary;
- `must_change_password` may track the required first password change;
- Admin Email OTP remains mandatory during login.

First Admin user-facing flow:

```text
Email + Temporary Password
→ Admin Email OTP
→ OTP verified
→ mandatory Change Password screen
→ Current Password + New Password + Confirm New Password
→ temporary password invalidated
→ must_change_password = false
→ normal privileged Admin session
```

The first Admin cannot access normal privileged functions before replacing the temporary password.

---

## Additional Administrator Invitation

Only an authenticated `ADMIN` can invite another Admin.

Conceptual endpoint:

```http
POST /api/v1/admin/admin-invitations
Authorization: Bearer <admin-access-token>
```

Invitation rules:

- no public Admin registration;
- Customer cannot create Admin invitation;
- invitee does not submit a generic `role` field;
- backend assigns `ADMIN` through the trusted invitation workflow;
- inviter does not choose the invitee password;
- invitee chooses their own password while accepting the invitation;
- invitation lifetime = 24 hours;
- invitation is one-time use;
- newest invitation only;
- expired/used/revoked/invalid invitation cannot create an Admin;
- accepting a valid invitation creates the Admin account but does not automatically log it in.

After account creation, normal Admin login still requires Email + Password + Admin Email OTP.

---

## Login Account-State Behavior

Customer normal login:

```text
ACTIVE + valid credentials
→ Access + Refresh Tokens
→ no OTP in Version 1
```

Baseline outcomes:

```text
Invalid email/password                     → 401 Unauthorized / generic failure
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary account lock active              → 423 Locked
Rate limit exceeded                         → 429 Too Many Requests
```

Wrong credentials must not disclose account existence or account state.

---

## Account Lockout and Login Rate Limiting

Account Lockout applies to Customer and Admin password authentication:

```text
5 consecutive failed passwords
→ temporary lock for 15 minutes
```

Successful authentication before the fifth failure resets the failure sequence.

Temporary lock is separate from business status `DISABLED`.

Login Rate Limiting:

```text
Per account/email → 10 login requests / minute
Per source IP     → 60 login requests / minute
Exceeded          → 429 Too Many Requests
```

---

## Admin Login OTP

Admin login adds a mandatory second authentication step after correct Email + Password.

```text
Email + Password
→ Login Rate Limiting / Account Lockout protections
→ credentials valid
→ generate/send 6-digit Email OTP
→ no normal Access/Refresh Tokens yet
→ Admin verifies OTP
→ authentication completes
```

Approved Admin Login OTP rules:

```text
Format              → 6 digits
Validity            → 5 minutes
Max failed attempts → 5
Resend cooldown     → 60 seconds
Newest OTP only     → yes
One-time use        → yes
```

Five wrong OTP attempts invalidate the current OTP challenge; they do not set the Admin account to `DISABLED`.

---

## Refresh Token and Logout

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Refresh uses rotation:

```text
Valid Refresh Token
→ old Refresh Token invalidated
→ new Access Token
→ new Refresh Token
```

A rotated/used Refresh Token cannot be reused. A `DISABLED` account cannot refresh.

Logout applies to Customer and Admin:

```text
Logout
→ current session invalidated
→ current Refresh Token invalidated
→ full authentication required for a new session
```

---

## Password Recovery / Reset

Password Recovery applies to Customer and Admin and is separate from Customer Email Verification and Admin Login OTP.

Password Recovery OTP:

```text
Format              → 6 digits
Validity            → 5 minutes
Max failed attempts → 5
Resend cooldown     → 60 seconds
Newest OTP only     → yes
One-time use        → yes
```

Successful reset invalidates the old password, existing sessions and existing Refresh Tokens. Admin still completes the normal Admin Email OTP step on the next login.

---

## Token Fundamentals

For opaque verification/invitation tokens:

```text
Backend generates RAW TOKEN
→ raw token sent to user
→ hash stored in DB

User submits raw token
→ backend hashes submitted token
→ compares against stored hash
→ checks expiry / used / revoked state
```

Common token state fields:

```text
created_at
expires_at
used_at
revoked_at
```

Use UTC consistently for stored timestamps.

Configuration direction:

```text
EMAIL_VERIFICATION_EXPIRY_HOURS=24
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
ADMIN_INVITATION_EXPIRY_HOURS=24
ADMIN_OTP_RESEND_COOLDOWN_SECONDS=60
PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS=60
```

---

## Frontend Future Option

Frontend is optional after the backend/API project, but the API should remain frontend-ready with stable business/error codes, clear success/failure responses and backend-enforced business/security rules.

---

## QA Working Style

Current phase is fast-track:

```text
Requirement
→ Business Logic
→ Clarification
→ API Behavior
→ Test Scenario
→ UAT
```

Later execution phase:

```text
Detailed Test Cases
→ Postman
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

---

## Planned Final QA Artifacts

```text
qa/test-scenarios/
qa/uat/
qa/test-cases/
qa/defects/
qa/execution-reports/
qa/regression/
```

---

## Backend Direction

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

Layering:

```text
Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

Backend source will be version-controlled in GitHub. Public/private visibility remains undecided. The public QA portfolio must not expose hidden seeded-bug answer keys.

---

## Immediate Next Step

Continue the Authentication API Contract from `POST /api/v1/auth/resend-verification` and freeze the cooldown error behavior.

Then continue endpoint-by-endpoint through Admin provisioning, Login, Admin OTP, temporary-password change, Refresh, Logout and Password Recovery/Reset.

After the Authentication API Contract is frozen, **stop for discussion before starting backend implementation**.