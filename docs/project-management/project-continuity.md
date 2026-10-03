# QA Commerce Lab — Project Continuity

## Purpose

Use this document with `docs/project-management/current-checkpoint.md` to continue the project consistently across chats.

---

## Project Goal

Build a realistic portfolio-grade QA Engineering project around a working e-commerce backend with:

```text
REST APIs
PostgreSQL
Redis
Email flows
Authentication / Authorization
Transactions / Concurrency
Docker Compose
Postman execution
SQL validation
Defects / Retest / Regression
```

Planned backend stack:

```text
TypeScript
Node.js
Express.js
PostgreSQL
Redis
Mailpit
OpenAPI / Swagger
Docker Compose
```

Planned layering:

```text
Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

Architecture should be realistic/production-like rather than simplified into a teaching demo.

---

## Working Method

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

Per-module workflow:

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

Detailed Test Cases are intentionally deferred until the backend is running; they will be written/expanded while actually executing the APIs and collecting DB/Mailpit evidence.

**Critical:** Do not start backend implementation until the Authentication contract is frozen and the user explicitly discusses the backend implementation plan first.

---

## Current Workstream

Current module: **Authentication**.

Pre-backend finalization status:

```text
1. Admin Invitation API details                     ✅
2. Verification Resend response/security details    ✅
3. Authentication DB relationships/transactions     ✅
4. Final API Contract consistency/OpenAPI review     ⏳ NEXT — user + assistant together
```

After Step 4:

```text
Authentication Contract = FROZEN
→ STOP
→ discuss backend plan
→ then implement Authentication backend
```

Primary current contract:

```text
api-contract/authentication-api-contract-draft-v1.0.md
```

Data model review:

```text
docs/business-analysis/authentication-data-model-v1.0.md
```

---

## Customer Registration / Verification

Public Registration:

```text
firstName + lastName + email + password
→ backend assigns CUSTOMER
→ status = PENDING_VERIFICATION
→ no Access/Refresh Tokens
```

Email verification uses an opaque secure link token, not a numeric OTP.

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
Successful verification    = PENDING_VERIFICATION → ACTIVE
No auto-login              = redirect/proceed to Login
```

Verification Resend supports exactly one of:

```text
email context from Registration/Login flow
OR
expired verification-token context
```

Email-driven public path uses a generic `200` response that does not reveal whether the submitted email exists or is eligible.

The 60-second cooldown is applied uniformly to every valid normalized email input, including unknown emails, so cooldown behavior itself does not create an account-enumeration signal.

```text
Within cooldown → 429 / VERIFICATION_RESEND_COOLDOWN
```

Token-driven expired-link flow may return specific state errors because possession of the opaque token already supplies account context.

Successful resend always invalidates the previous verification token and creates a fresh 24-hour link.

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

Wrong credentials do not disclose account existence or state.

Customer:

```text
ACTIVE + correct password
→ Access + Refresh
→ no OTP in V1
```

Admin:

```text
ACTIVE + correct password
→ Admin Login OTP challenge
→ no normal tokens yet
→ OTP verification
→ then authenticated session
```

---

## Account Lockout / Rate Limiting

```text
5 consecutive failed passwords
→ temporary lock for 15 minutes
```

A correct password is still rejected while lock is active. A successful password authentication before failure #5 resets the sequence.

Persistent lock fields live on `users`:

```text
failed_login_attempts
locked_until
```

Rate-limit baseline:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
```

Rate-limit counters are runtime Redis state and thresholds are configurable.

---

## Admin Login OTP

Persistent table:

```text
admin_login_otp_challenges
```

Rules:

```text
6 digits
5-minute lifetime
5 wrong attempts maximum
60-second resend cooldown
same challengeId on resend
newest OTP only
one-time use
resend does not reset attempt_count
```

Five wrong OTP attempts invalidate only the current challenge, not the Admin account.

A new full Admin Login invalidates a previous still-active Admin Login challenge.

Concurrent verification must be atomic so the same challenge cannot succeed twice.

---

## First Administrator Bootstrap

No public Admin registration.

The first Admin is created through a trusted operator bootstrap using environment/secret configuration.

```text
role = ADMIN
status = ACTIVE
must_change_password = true
```

Flow:

```text
Temporary Password
→ Admin OTP
→ restricted passwordChangeToken
→ mandatory password replacement
→ must_change_password = false
→ normal Access + Refresh
```

`passwordChangeToken` is one-time, valid 10 minutes, and can authorize only the temporary-password-change endpoint.

Bootstrap must be idempotent and must not log the temporary password.

---

## Additional Admin Invitation

Endpoints:

```text
POST /api/v1/admin/admin-invitations
POST /api/v1/admin/admin-invitations/{invitationId}/resend
POST /api/v1/admin/admin-invitations/{invitationId}/cancel
POST /api/v1/auth/admin-invitations/inspect
POST /api/v1/auth/admin-invitations/accept
```

Core rules:

```text
Invitation lifetime        = 24 hours
Resend cooldown            = 60 seconds
One PENDING invite/email   = maximum one
Resend                     = same invitation row + new token
Old token                  = invalid immediately
Cancel                     = PENDING → CANCELLED; history retained
```

New email acceptance:

```text
invitee chooses password
→ create ADMIN / ACTIVE users row
→ no auto-login
→ normal Admin Login + OTP afterward
```

Existing `ACTIVE` Customer acceptance:

```text
same users row
CUSTOMER → ADMIN
same user_id
same password_hash
historical data remains
all old Customer sessions revoked
next Login requires Admin OTP
```

`PENDING_VERIFICATION` and `DISABLED` Customers cannot be promoted until their state is resolved.

Invitation acceptance is transactional/concurrency-safe.

---

## Session / Refresh / Logout

```text
Access Token lifetime  = 15 minutes
Refresh Token lifetime = 7 days
```

Refresh Token is stored client-side in an `HttpOnly`, `Secure` cookie. Access Token is used as Bearer authorization.

Persistent tables:

```text
auth_sessions
refresh_tokens
```

Refresh uses rotation. Old Refresh Token becomes invalid immediately. Reuse of an already-rotated token revokes the associated session.

Logout revokes current session only and clears the Refresh cookie.

Customer→Admin promotion, Password Reset, and account disablement revoke relevant existing sessions.

Final SameSite/CSRF setting is checked during the final API/deployment consistency review.

---

## Password Recovery / Reset

Forgot Password uses a generic public response to reduce account enumeration.

Eligible:

```text
ACTIVE Customer ✅
ACTIVE Admin ✅
PENDING_VERIFICATION Customer ✅
DISABLED ❌ no challenge/email; same public response
Unknown email ❌ no challenge/email; same public response
```

Reset OTP:

```text
6 digits
5-minute lifetime
5 wrong attempts maximum
60-second resend cooldown
newest OTP only
one-time use
resend does not reset attempt_count
```

Valid Reset OTP issues a one-time `resetToken` valid 10 minutes.

Successful Reset:

```text
replace users.password_hash
reject current-password reuse
mark reset token used
revoke ALL sessions + Refresh Tokens
no auto-login
return to Login
```

A pending Customer remains `PENDING_VERIFICATION` after password reset. Admin Login still requires Admin OTP afterward.

---

## Authentication Data Model

Persistent PostgreSQL tables:

```text
users
email_verification_tokens
admin_invitations
admin_login_otp_challenges
temporary_password_change_tokens
auth_sessions
refresh_tokens
password_reset_challenges
password_reset_tokens
audit_logs
```

Key relationship principles:

```text
users.email → normalized/case-insensitive UNIQUE
users → many verification tokens
users → many OTP/reset challenges
users → many auth sessions
auth_sessions → many refresh tokens
admin_invitations.user_id → nullable link to existing Customer
```

Runtime state such as IP/email rate-limit counters, generic unknown-email cooldown keys, and fast session-revocation lookup belongs in Redis.

Critical transactional boundaries:

```text
Email verification consume
Verification resend token replacement
Admin invitation acceptance / promotion
OTP one-time verification
Refresh Token rotation
Password Reset + all-session revocation
```

UNIQUE/FK/CHECK constraints are database safety nets; transactions/locking remain the primary concurrency controls.

---

## Security Baseline

```text
Passwords                     → hash only; never plaintext/logged
Verification/invitation token → raw sent to user; hash stored
OTP                           → raw emailed; non-plaintext verifier stored
Refresh/Reset tokens          → raw client-side; hash stored
One-time actions              → atomic consume/locking
```

Public APIs use generic responses where account existence/state would otherwise be exposed.

---

## QA Artifacts

```text
qa/test-scenarios/
qa/uat/
qa/test-cases/
qa/defects/
qa/execution-reports/
qa/regression/
```

Existing high-level Authentication Test Scenarios/UAT remain the baseline. Detailed Test Cases will be produced during live API execution.

---

## Immediate Next Step

Perform **Step 4 together with the user**:

```text
Final Authentication API Contract consistency/OpenAPI review
→ endpoint inventory
→ request schemas
→ success responses
→ HTTP statuses
→ business error codes
→ cross-flow contradictions
→ OpenAPI alignment
```

Then freeze Authentication, stop, and discuss the backend plan before implementation.