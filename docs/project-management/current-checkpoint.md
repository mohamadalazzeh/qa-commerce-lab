# QA Commerce Lab — Current Checkpoint

## How to Resume in a New Chat

Use this file together with `docs/project-management/project-continuity.md` as the source of truth for project continuity.

Suggested message:

> Continue my QA Commerce Lab project from GitHub repository `mohamadalazzeh/qa-commerce-lab`. Read `docs/project-management/project-continuity.md` and `docs/project-management/current-checkpoint.md` first. Authentication business behavior is substantially frozen. Continue the final Authentication API-contract consistency pass, especially Admin Invitation request/response/error schemas, verification-resend response normalization, DB relationships/transactions, and OpenAPI alignment. Detailed Test Cases stay deferred until backend/Postman execution. Do not start backend implementation until I explicitly discuss the backend plan first.

---

## Current Module Status

Current module: **Authentication**.

Authentication requirements/business behavior are substantially complete. Current work is the final **Authentication API Contract / design consistency pass** before backend implementation.

Detailed Test Cases remain intentionally deferred until the backend exists and Postman/PostgreSQL/Mailpit execution begins.

Current delivery strategy:

```text
Requirements
→ Business Rules / Clarifications
→ API Contract
→ Test Scenarios / UAT
→ Backend Implementation
→ Detailed Test Cases during real execution
→ Postman API Testing
→ SQL / DB Validation
→ Bugs
→ Retest
→ Regression
```

**Important:** Before backend implementation begins, stop and discuss the backend plan with the user first.

---

## Authentication — Frozen / Approved Behavior

```text
Customer Registration ✅
Customer Email Verification ✅
Verification link lifetime = 24 hours ✅
Verification resend cooldown = 60 seconds ✅
Verification resend backend enforcement = 429 cooldown ✅
Login account-state behavior ✅
Account Lockout = 5 failed passwords / 15 minutes ✅
Login Rate Limiting baseline ✅
Admin Login OTP ✅
First Admin restricted password-change flow ✅
Access / Refresh / Rotation / Logout ✅
Password Recovery / Reset OTP ✅
Admin invitation business direction ✅
Existing ACTIVE Customer → Admin promotion direction ✅
```

---

## Login / Account State Summary

```text
Invalid email/password                     → 401 / INVALID_CREDENTIALS
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary password lock active             → 423 / ACCOUNT_LOCKED
Rate limit exceeded                         → 429 / RATE_LIMIT_EXCEEDED
```

Wrong credentials must not reveal account existence or account state.

Pending Customers can be directed back into the verification-resend flow using the email already entered in Login.

---

## Account Lockout / Rate Limiting

```text
5 consecutive failed passwords
→ temporary lock for 15 minutes
→ correct password is still rejected while lock is active
→ successful password authentication before failure #5 resets the sequence
```

Version 1 rate-limit baseline:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
Exceeded          → 429 Too Many Requests
```

Thresholds remain configurable rather than hard-coded.

---

## Admin Login OTP — Frozen

Persistent PostgreSQL table direction:

```text
admin_login_otp_challenges
```

Core fields:

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

Rules:

```text
OTP                       → 6 digits
Lifetime                  → 5 minutes
Wrong attempts            → max 5 per challenge
Resend cooldown           → 60 seconds
Resend challengeId        → same challengeId
Resend resets attempts    → no
Newest OTP only           → yes
One-time use              → yes
```

Behavior:

```text
Wrong OTP                → 401 / INVALID_OTP; attempt_count + 1
Expired OTP              → 401 / OTP_EXPIRED
Attempts exhausted       → 423 / OTP_CHALLENGE_LOCKED
Already used             → 409 / OTP_CHALLENGE_ALREADY_USED
Resend before 60 sec     → 429 / OTP_RESEND_COOLDOWN + Retry-After
```

At five wrong OTP attempts, only the current challenge is invalidated. The Admin account is not disabled or password-locked. Full Login must be restarted.

Resend generates a new OTP, invalidates the old OTP immediately, starts a fresh 5-minute OTP lifetime, and preserves `attempt_count`.

A new full Admin Login invalidates a previous still-active Admin Login challenge for the same Admin.

Raw OTP values must not be stored or logged.

---

## First Bootstrap Admin — Frozen Direction

```text
Email + Temporary Password
→ Admin OTP
→ OTP verified
→ no normal Admin session yet
→ restricted passwordChangeToken
→ change temporary password
→ must_change_password = false
→ Access + Refresh issued
```

`passwordChangeToken`:

```text
valid for 10 minutes
one-time use
purpose = CHANGE_TEMPORARY_PASSWORD
cannot authorize normal Admin APIs
```

The successful change replaces the same `users.password_hash`; no second password is stored.

---

## Session / Refresh / Logout — Frozen Direction

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Refresh Token is held in an `HttpOnly`, `Secure` cookie. Final SameSite/CSRF configuration is aligned with the eventual frontend/deployment origin model.

Persistent PostgreSQL table direction:

```text
auth_sessions
refresh_tokens
```

Refresh uses rotation:

```text
valid Refresh
→ old Refresh invalid/used
→ new Access
→ new Refresh
```

Detected reuse of an already-rotated Refresh Token revokes the entire associated session.

Logout affects the current session only and returns `204 No Content` after revoking session/Refresh state and clearing the cookie.

A `DISABLED` user cannot refresh. `CUSTOMER → ADMIN` promotion revokes the Customer's old sessions before the next Admin Login + OTP.

---

## Password Recovery / Reset — Frozen Direction

Public Forgot Password response is generic regardless of whether an eligible account exists.

Persistent PostgreSQL tables:

```text
password_reset_challenges
password_reset_tokens
```

Recovery OTP:

```text
6 digits
5-minute lifetime
5 wrong attempts maximum
60-second resend cooldown
newest OTP only
one-time use
resend does not reset attempt_count
```

Password-reset resend also keeps a generic public response for eligible, unknown, disabled, and per-account-cooldown cases to avoid account enumeration. General source-IP abuse controls may still return `429` independently.

Valid Reset OTP issues a one-time `resetToken` valid for 10 minutes.

Successful password reset:

```text
replace users.password_hash
reject reuse of current password
invalidate resetToken
revoke ALL sessions and Refresh Tokens
no auto-login
return user to Login
```

A `PENDING_VERIFICATION` Customer may reset the password but remains `PENDING_VERIFICATION`. A `DISABLED` account does not receive a Reset challenge/email.

Admin still completes normal Admin Login OTP after password reset.

---

## Admin Invitation — Approved Business Direction

Persistent PostgreSQL table direction:

```text
admin_invitations
```

Approved behavior includes:

```text
Invitation lifetime = 24 hours
One active/PENDING invitation per email
Create → new persistent invitation resource
Resend → update same invitation row; new token; old token invalid
Resend cooldown = 60 seconds
Cancel → PENDING → CANCELLED; record retained
New invitee → creates ADMIN account on acceptance
Existing ACTIVE Customer → same user_id promoted CUSTOMER → ADMIN
Promotion → old Customer sessions revoked
PENDING_VERIFICATION / DISABLED Customer → not eligible for promotion
```

Exact Admin Invitation request/response/error schemas are still part of the final contract pass.

---

## Immediate Next Work

Before backend implementation:

```text
1. Finalize exact Admin Invitation request/response/error schemas.
2. Normalize remaining verification-resend public response/error details.
3. Review Authentication DB table relationships + transaction/concurrency boundaries.
4. Align endpoint inventory and errors with OpenAPI.
5. Final Authentication contract freeze.
6. STOP and discuss backend implementation plan with the user.
```

After that discussion, build the full Authentication backend and begin Postman + PostgreSQL + Mailpit execution, writing detailed Test Cases during real testing rather than pre-writing a large static suite.
