# QA Commerce Lab — Current Checkpoint

## How to Resume

Use this file with `docs/project-management/project-continuity.md`.

Suggested message:

> Continue QA Commerce Lab from `mohamadalazzeh/qa-commerce-lab`. Authentication pre-backend steps 1–3 are complete: Admin Invitation API details are frozen, Verification Resend details are frozen, and the Authentication DB model/transaction review is complete. Continue with Step 4 only: final API-contract consistency/OpenAPI review with me. Do not start backend implementation until we explicitly discuss the backend plan first.

---

## Current Module

```text
Authentication
```

Detailed Test Cases remain intentionally deferred until the backend is running and real Postman/PostgreSQL/Mailpit execution begins.

Delivery sequence remains:

```text
Requirements
→ Business Rules / Clarifications
→ API Contract
→ Test Scenarios / UAT
→ Backend Implementation
→ Detailed Test Cases during execution
→ Postman
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

---

## Pre-Backend Finalization Status

```text
1. Admin Invitation API details                     ✅ DONE
2. Verification Resend response/security details    ✅ DONE
3. Authentication DB relationships/transactions     ✅ DONE
4. Final API Contract consistency/OpenAPI review     ⏳ NEXT — user + assistant together
```

After Step 4:

```text
Authentication Contract = FROZEN
→ STOP
→ discuss backend architecture/implementation plan with user
→ only then start backend implementation
```

---

## Step 1 — Admin Invitation API Frozen

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
Invitation lifetime          = 24 hours
Resend cooldown              = 60 seconds
One PENDING invite/email     = maximum one
Resend                       = same invitation row + new token
Old token after resend       = invalid immediately
Cancel                       = PENDING → CANCELLED; history retained
```

New invitee:

```text
Accept invitation
→ choose password
→ create users row ADMIN / ACTIVE
→ no auto-login
→ next Login requires Admin OTP
```

Existing ACTIVE Customer:

```text
Accept invitation
→ same users row
→ CUSTOMER → ADMIN
→ same user_id/password/history
→ revoke old Customer sessions
→ next Login requires Admin OTP
```

`PENDING_VERIFICATION` or `DISABLED` Customers are not eligible for promotion.

An invitation-inspection endpoint returns only whether password setup is required; it does not expose account details.

---

## Step 2 — Verification Resend Frozen

Same endpoint supports exactly one of:

```text
email context
OR
expired verification-token context
```

```http
POST /api/v1/auth/resend-verification
```

Timing:

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
```

Email-driven public path:

```text
200 generic response for eligible/ineligible account state
unknown/ACTIVE/DISABLED email does not reveal existence/state
```

Cooldown is enforced uniformly for every syntactically valid normalized email input, including unknown emails, so `429` itself does not become an enumeration signal.

```text
Within cooldown → 429 / VERIFICATION_RESEND_COOLDOWN
```

Token-driven path may return specific state errors because possession of the opaque token supplies account context.

Successful resend always invalidates the previous token and creates a fresh 24-hour link.

---

## Step 3 — Authentication DB Review Complete

Detailed design:

```text
docs/business-analysis/authentication-data-model-v1.0.md
```

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

Redis/runtime state:

```text
Login account/email rate-limit counters
Login source-IP counters
Public verification-resend cooldown keys
Public password-reset abuse/cooldown keys
Fast session/revocation lookup
```

Critical transactional operations:

```text
Email verification consume
Verification resend token replacement
Admin invitation accept/promotion
OTP one-time verification
Refresh rotation/reuse handling
Password reset + all-session revocation
```

Database UNIQUE/foreign-key/CHECK constraints are safety nets; application transactions/locking remain the primary concurrency control.

---

## Previously Frozen Authentication Behavior

```text
Customer Registration / Email Verification ✅
Login account-state behavior ✅
Account Lockout: 5 wrong passwords / 15 min ✅
Login Rate Limiting baseline ✅
Admin OTP: 6 digits / 5 min / 5 tries / 60 sec resend ✅
First Admin restricted password-change flow ✅
Access 15 min / Refresh 7 days / rotation ✅
Logout current session ✅
Forgot Password / Reset OTP / Reset Token ✅
Password reset revokes all sessions ✅
```

---

## Immediate Next Step

Do **Step 4 together with the user**:

```text
Final API Contract consistency review
→ endpoint inventory
→ request bodies
→ success responses
→ HTTP statuses
→ business error codes
→ cross-flow contradictions
→ OpenAPI alignment
```

Do not begin backend implementation during or before this review.