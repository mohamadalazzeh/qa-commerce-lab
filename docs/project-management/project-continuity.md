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
→ Detailed Test Cases during real execution
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

Do not wait until every module is complete before testing. Finish one module's contract, build it, test it, then continue incrementally.

---

## Current Workstream

Current module: **Authentication**.

Authentication business behavior is substantially complete. Current work is the final API-contract/design consistency pass before backend implementation.

Detailed Test Cases remain intentionally deferred until the Authentication backend is running and Postman/PostgreSQL/Mailpit execution begins.

**Before backend implementation starts, stop and discuss the backend plan with the user first.**

---

## Customer Registration / Verification

Public Customer Registration assigns:

```text
role = CUSTOMER
status = PENDING_VERIFICATION
```

No role/status is accepted from the client. Successful registration does not issue Access/Refresh Tokens.

Customer email verification uses a secure opaque link token, not a numeric OTP.

```text
Verification link lifetime = 24 hours
Verification resend cooldown = 60 seconds
```

Successful verification:

```text
PENDING_VERIFICATION → ACTIVE
→ no auto-login
→ frontend proceeds to Login
```

Verification resend supports both:

```text
email context from Registration/Login flow
OR
expired verification-token context
```

Exactly one of email/token is supplied. Backend enforces the 60-second cooldown even if frontend controls are bypassed.

```text
Cooldown rejection → 429 / VERIFICATION_RESEND_COOLDOWN
Successful resend  → old token invalid immediately; fresh 24-hour link
```

The public email-driven path must not leak unknown-account existence; final response wording is normalized during the final contract pass.

---

## Login / Account State

Same Login endpoint is used by Customer and Admin.

```text
Invalid email/password                     → 401 / INVALID_CREDENTIALS
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary account lock active              → 423 / ACCOUNT_LOCKED
Rate limit exceeded                         → 429 / RATE_LIMIT_EXCEEDED
```

Wrong credentials do not disclose whether the account exists or its state.

Customer Login:

```text
ACTIVE + correct credentials
→ Access + Refresh
→ no OTP in Version 1
```

Admin Login:

```text
ACTIVE + correct credentials
→ create Admin Login OTP challenge
→ no normal tokens yet
→ OTP verification
→ normal session only after second factor succeeds
```

---

## Account Lockout / Login Rate Limiting

Account Lockout applies to Customer and Admin password authentication:

```text
5 consecutive failed passwords
→ temporary lock for 15 minutes
```

A correct password is still rejected while the lock is active. A successful password authentication before the fifth failure resets the sequence.

Temporary lock is not the same as account status `DISABLED`.

Rate-limit baseline:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
Exceeded          → 429 Too Many Requests
```

Thresholds are configurable rather than hard-coded.

---

## Admin Login OTP — Frozen

Persistent PostgreSQL table:

```text
admin_login_otp_challenges
```

Conceptual fields:

```text
id / challengeId
user_id
otp_hash
expires_at
attempt_count
last_sent_at
used_at
revoked_at
revocation_reason
created_at
```

The table is persistent; each row represents a temporary Login challenge. Raw OTP values are not stored or logged.

Approved rules:

```text
Format                  → 6 digits
Validity                → 5 minutes
Max wrong attempts      → 5 per challenge
Resend cooldown         → 60 seconds
Newest OTP only         → yes
One-time use            → yes
Resend challengeId      → same challengeId
Resend resets attempts  → no
```

Verify behavior:

```text
Wrong OTP                 → 401 / INVALID_OTP; increment attempt_count
Expired OTP               → 401 / OTP_EXPIRED
Attempts exhausted        → 423 / OTP_CHALLENGE_LOCKED
Already-used challenge    → 409 / OTP_CHALLENGE_ALREADY_USED
Valid OTP                 → mark challenge used; continue authentication
```

At five wrong OTP attempts, only the challenge is invalidated. The Admin account is not disabled or password-locked. Full Login must be restarted.

Resend before 60 seconds:

```text
429 / OTP_RESEND_COOLDOWN
Retry-After where practical
```

Successful resend:

```text
same challengeId
new OTP
old OTP invalid immediately
fresh 5-minute expiry
attempt_count unchanged
```

A used/revoked/max-attempt challenge cannot be revived through Resend.

A new full Admin Login invalidates any previous still-active Admin Login challenge for that Admin.

Concurrent verification must be atomic so a one-time challenge cannot succeed twice.

---

## First Administrator Bootstrap / Temporary Password

The first Admin is created through secure operator bootstrap, not public registration.

```text
role = ADMIN
status = ACTIVE
must_change_password = true
```

Credentials come from environment/secret configuration. The bootstrap is idempotent and does not log the temporary password.

First Login flow:

```text
Email + Temporary Password
→ Admin Login OTP
→ OTP verified
→ no normal Admin session yet
→ issue restricted passwordChangeToken
→ mandatory temporary-password replacement
→ must_change_password = false
→ issue Access + Refresh
```

`passwordChangeToken`:

```text
validity = 10 minutes
one-time use = yes
purpose = CHANGE_TEMPORARY_PASSWORD
```

It cannot authorize normal privileged endpoints.

The successful password change replaces `users.password_hash`; the temporary-password hash is not kept as a second password.

Additional invited Admins do not use this forced temporary-password flow because they choose their own password during invitation acceptance.

---

## Additional Administrator Invitation

Only an authenticated `ADMIN` can create/manage Admin invitations. There is no public Admin registration.

Persistent PostgreSQL table:

```text
admin_invitations
```

Conceptual fields include:

```text
id
user_id nullable
first_name
last_name
email
token_hash
status
expires_at
used_at
created_at
updated_at
```

Approved rules:

```text
Invitation lifetime                    → 24 hours
One active/PENDING invitation/email   → maximum one
Create invitation                      → new invitation resource
Resend                                → update same row
Resend cooldown                        → 60 seconds
Resend                                → new token; old token invalid
Cancel                                → PENDING → CANCELLED; record retained
Already ADMIN                          → no invitation
```

For a new email, successful acceptance creates a `users` row with `role = ADMIN`, `status = ACTIVE`, and the invitee's chosen password. It does not auto-login.

For an existing `ACTIVE` Customer:

```text
invite accepted
→ UPDATE same users row
→ CUSTOMER → ADMIN
→ same user_id
→ same password_hash
→ historical orders/data remain linked
→ all existing Customer sessions revoked
→ next Login uses Admin password + OTP
```

`PENDING_VERIFICATION` and `DISABLED` Customers are not eligible for promotion until their state is resolved.

Exact invitation API request/response/error schemas remain in the final contract pass.

---

## Session / Refresh / Logout

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Access Token is used as a Bearer token. Refresh Token is stored in an `HttpOnly`, `Secure` cookie. SameSite/CSRF configuration will be finalized against the eventual frontend/deployment origin model.

Persistent PostgreSQL tables:

```text
auth_sessions
refresh_tokens
```

Raw Refresh Tokens are not stored; only a token verifier/hash is persisted.

Refresh uses rotation:

```text
valid Refresh
→ old Refresh becomes used/invalid
→ new Access
→ new Refresh
```

Reuse of an already-rotated Refresh Token is rejected and revokes the entire associated session.

A `DISABLED` account cannot refresh. Customer→Admin role promotion revokes existing Customer sessions.

Logout:

```text
current session only
→ session revoked
→ associated Refresh Tokens revoked
→ cookie cleared
→ 204 No Content
```

---

## Password Recovery / Reset — Frozen

Password Recovery applies to Customer and Admin and is separate from Customer Email Verification and Admin Login OTP.

Forgot Password uses a generic public `200` response to avoid account enumeration.

Eligible accounts:

```text
ACTIVE Customer ✅
ACTIVE Admin ✅
PENDING_VERIFICATION Customer ✅
DISABLED account ❌ no challenge/email, but same generic public response
Unknown email ❌ no challenge/email, but same generic public response
```

Resetting the password of a pending Customer does not activate the account.

Persistent PostgreSQL table:

```text
password_reset_challenges
```

OTP rules:

```text
6 digits
5-minute lifetime
5 wrong attempts maximum
60-second resend cooldown
newest OTP only
one-time use
resend does not reset attempt_count
```

At five wrong attempts, only the current Reset challenge is invalidated.

Password-reset OTP resend keeps a generic public response for eligible, unknown, disabled and per-account-cooldown cases, so the response does not reveal account existence. General source-IP abuse protection may still return `429` independently.

Valid recovery OTP issues a one-time Reset Token.

Persistent PostgreSQL table:

```text
password_reset_tokens
```

Reset Token:

```text
validity = 10 minutes
one-time use = yes
raw token returned to client
hash/verifier stored in DB
```

Successful reset:

```text
validate Reset Token
→ validate password policy
→ reject same-as-current password
→ replace users.password_hash
→ invalidate Reset Token
→ revoke ALL auth_sessions and Refresh Tokens
→ no auto-login
→ return to Login
```

Admin still completes the normal Admin Login OTP step on the next sign-in.

---

## Security / Persistence Fundamentals

Whenever a security artifact is issued:

```text
Password              → password_hash only
Verification token    → raw token to user; hash/verifier in DB
Invitation token      → raw token to user; hash/verifier in DB
OTP                    → raw code by email; non-plaintext verifier in DB
Refresh Token          → raw token held by client cookie; hash/verifier in DB
Reset Token            → raw token to client; hash/verifier in DB
```

Do not log raw passwords, OTPs, verification tokens, invitation tokens, Refresh Tokens or Reset Tokens.

One-time token/challenge use must be protected with transactions/locking so concurrent requests cannot both succeed. Database UNIQUE constraints are a safety net, not the sole concurrency mechanism.

Use UTC consistently for stored timestamps.

---

## Frontend Future Option

Frontend is optional after the backend/API project, but the API should remain frontend-ready with stable business/error codes, clear success/failure responses and backend-enforced business/security rules.

---

## QA Working Style

Current phase:

```text
Requirement
→ Business Logic
→ Clarification
→ API Behavior
→ High-level Test Scenario
→ UAT
```

Later execution phase:

```text
Detailed Test Cases during real execution
→ Postman
→ SQL / DB Validation
→ Mailpit evidence
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

Finish the Authentication contract without reopening already-frozen OTP behavior:

```text
1. Finalize exact Admin Invitation request/response/error schemas.
2. Normalize remaining verification-resend public response/error details.
3. Review DB table relationships + transaction/concurrency boundaries.
4. Align Authentication endpoint/error inventory with OpenAPI.
5. Freeze Authentication contract.
6. STOP and discuss backend implementation plan with the user before writing backend code.
```
