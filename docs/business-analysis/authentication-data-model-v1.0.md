# Authentication Data Model v1.0

## Purpose

This document freezes the Authentication-module PostgreSQL data relationships, key constraints, and transaction/concurrency boundaries before backend implementation.

It intentionally describes **what must be persisted and protected**, not the final ORM/migration syntax.

---

## 1. Persistent PostgreSQL Tables

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

Redis is used later for short-lived runtime state such as rate-limit counters, source-IP counters, generic public resend cooldown keys, and fast session-revocation lookup. Redis is not the source of truth for durable account/session history.

---

## 2. users

Purpose: persistent source of truth for every Customer/Admin account.

Core fields:

```text
id
first_name
last_name
email
password_hash
role
status
must_change_password
failed_login_attempts
locked_until
created_at
updated_at
```

Approved values:

```text
role   = CUSTOMER | ADMIN
status = PENDING_VERIFICATION | ACTIVE | DISABLED
```

Rules:

- Email is normalized for lookup and enforced case-insensitively unique.
- Password plaintext is never persisted.
- `failed_login_attempts` and `locked_until` are durable so a server restart does not remove an active account lock.
- Customer→Admin promotion updates the same row; it never creates a duplicate account.
- Historical order/data ownership remains linked to the same `user_id` after promotion.

Important constraints/indexes:

```text
UNIQUE normalized email
INDEX role
INDEX status
```

---

## 3. email_verification_tokens

Purpose: persistent history/state for Customer email-verification links.

Core fields:

```text
id
user_id
token_hash
expires_at
used_at
revoked_at
created_at
```

Relationship:

```text
users 1 → many email_verification_tokens
```

Rules:

- Raw token is emailed; only the hash/verifier is persisted.
- Only the newest unrevoked token may verify the account.
- Successful resend revokes the previous token and inserts a fresh token.
- Verification lifetime = 24 hours.
- Expired token record remains available to identify the pending account for expired-link resend.

Important constraints/indexes:

```text
UNIQUE token_hash
INDEX user_id
INDEX expires_at
```

---

## 4. admin_invitations

Purpose: persistent invitation resource for both new Admins and existing-Customer promotion.

Core fields:

```text
id
user_id nullable
first_name
last_name
email
token_hash
status
expires_at
last_sent_at
used_at
cancelled_at
created_by_user_id
cancelled_by_user_id nullable
created_at
updated_at
```

Approved statuses:

```text
PENDING
EXPIRED
USED
CANCELLED
```

Relationships:

```text
admin_invitations.user_id → users.id (nullable)
admin_invitations.created_by_user_id → users.id
admin_invitations.cancelled_by_user_id → users.id (nullable)
```

Rules:

- One active/PENDING invitation per normalized email.
- Invitation lifetime = 24 hours.
- Resend updates the same invitation row, replaces `token_hash`, resets `expires_at`, and returns status to `PENDING`.
- Resend cooldown = 60 seconds.
- Cancel keeps the row for audit/history.
- Existing ACTIVE Customer promotion keeps the same `user_id` and `password_hash`.
- Acceptance re-resolves the invitation email inside the transaction to prevent duplicate users if account state changed after invitation creation.

Recommended constraint:

```text
partial UNIQUE normalized email WHERE status = 'PENDING'
UNIQUE token_hash
INDEX user_id
INDEX status
INDEX expires_at
```

Historical `CANCELLED` or `USED` rows do not prevent future invitation history where business rules allow it.

---

## 5. admin_login_otp_challenges

Purpose: persistent temporary second-factor Login challenge for Admin authentication.

Core fields:

```text
id = challengeId
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

Relationship:

```text
users 1 → many admin_login_otp_challenges
```

Rules:

- OTP = 6 digits.
- Validity = 5 minutes.
- Maximum wrong attempts = 5.
- Resend cooldown = 60 seconds.
- Resend keeps the same challenge row and does not reset `attempt_count`.
- Successful verify sets `used_at`.
- Max attempts set revocation state; the Admin account itself is not disabled.
- New full Admin Login revokes a previous still-active challenge.

Indexes:

```text
INDEX user_id
INDEX expires_at
```

Raw OTP is never persisted or logged.

---

## 6. temporary_password_change_tokens

Purpose: one-time restricted authorization after the bootstrap Admin completes OTP but must still replace the temporary password.

Core fields:

```text
id
user_id
token_hash
purpose
expires_at
used_at
revoked_at
created_at
```

Relationship:

```text
users 1 → many temporary_password_change_tokens
```

Rules:

```text
purpose = CHANGE_TEMPORARY_PASSWORD
validity = 10 minutes
one-time use = yes
```

The token cannot authorize normal Admin APIs.

---

## 7. auth_sessions

Purpose: persistent authenticated-session record for Customers/Admins.

Core fields:

```text
id
user_id
created_at
last_activity_at
expires_at
revoked_at
revocation_reason
```

Relationship:

```text
users 1 → many auth_sessions
```

Rules:

- Every successful full authentication creates a session.
- Access JWT should identify the session so current revocation can be enforced.
- Session state is persisted in PostgreSQL and may be mirrored/cached in Redis for fast authorization checks.
- Logout revokes current session only.
- Password reset revokes all sessions for the user.
- Customer→Admin promotion revokes all pre-promotion sessions.
- Disabling an account prevents refresh and should revoke active sessions.

Indexes:

```text
INDEX user_id
INDEX revoked_at
INDEX expires_at
```

---

## 8. refresh_tokens

Purpose: persistent Refresh Token rotation/reuse state.

Core fields:

```text
id
session_id
token_hash
expires_at
used_at
revoked_at
replaced_by_token_id nullable
created_at
```

Relationship:

```text
auth_sessions 1 → many refresh_tokens
```

Rules:

- Raw Refresh Token is stored only in the client HttpOnly/Secure cookie.
- Database stores only a verifier/hash.
- Validity = 7 days.
- Rotation marks old token used and inserts a new token in the same transaction.
- Reuse of a rotated/used token revokes the associated session.

Constraints/indexes:

```text
UNIQUE token_hash
INDEX session_id
INDEX expires_at
```

---

## 9. password_reset_challenges

Purpose: persistent OTP challenge for Forgot Password.

Core fields:

```text
id
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

Relationship:

```text
users 1 → many password_reset_challenges
```

Rules:

```text
OTP = 6 digits
validity = 5 minutes
max wrong attempts = 5
resend cooldown = 60 seconds
newest OTP only
one-time use
resend does not reset attempt_count
```

A new valid recovery challenge supersedes/revokes an older active challenge for the same account.

---

## 10. password_reset_tokens

Purpose: short-lived one-time authorization after a Recovery OTP is verified.

Core fields:

```text
id
user_id
challenge_id
token_hash
expires_at
used_at
revoked_at
created_at
```

Relationships:

```text
password_reset_tokens.user_id → users.id
password_reset_tokens.challenge_id → password_reset_challenges.id
```

Rules:

```text
validity = 10 minutes
one-time use = yes
```

Successful Password Reset marks the reset token used, replaces `users.password_hash`, and revokes all sessions/Refresh Tokens.

Constraints/indexes:

```text
UNIQUE token_hash
INDEX user_id
INDEX challenge_id
INDEX expires_at
```

---

## 11. audit_logs

Purpose: append-oriented security/business audit trail for privileged Authentication actions.

Core fields:

```text
id
actor_user_id nullable
action
resource_type
resource_id nullable
metadata jsonb
created_at
```

Examples:

```text
FIRST_ADMIN_BOOTSTRAPPED
ADMIN_INVITATION_CREATED
ADMIN_INVITATION_RESENT
ADMIN_INVITATION_CANCELLED
CUSTOMER_PROMOTED_TO_ADMIN
ACCOUNT_SESSIONS_REVOKED
```

`actor_user_id` may be null for trusted system/bootstrap actions.

Audit logs are not used as the source of truth for current authorization state; they preserve evidence/history.

---

## 12. Redis / Non-Persistent Runtime State

Expected runtime keys include:

```text
Login rate limit by normalized account/email
Login rate limit by source IP
Verification-resend cooldown key for any normalized email input
Password-reset public-request abuse/cooldown keys
Fast session-revocation/session-state cache
```

Why this is separate from PostgreSQL:

- Request counters expire naturally.
- Unknown-email public flows still need uniform cooldown behavior without creating fake DB users/challenges.
- PostgreSQL remains the durable source of truth for real account/token/session records.

---

## 13. Transaction / Locking Boundaries

### Customer Registration

```text
BEGIN
→ normalize/check email uniqueness
→ insert users row
→ insert first email_verification_tokens row
COMMIT
→ send verification email
```

Database state remains valid even if email delivery fails; Resend provides recovery.

### Verify Email

```text
BEGIN
→ lock verification token/user state
→ validate newest + expiry + unused/unrevoked
→ PENDING_VERIFICATION → ACTIVE
→ mark token used
COMMIT
```

Only one concurrent verification can succeed.

### Resend Verification

```text
BEGIN
→ lock pending user/latest verification-token state
→ re-check cooldown/account state
→ revoke previous token
→ insert fresh token
COMMIT
→ send email
```

The generic cooldown for unknown public emails is runtime/Redis state, not a fake DB record.

### Admin Invitation Acceptance

```text
BEGIN
→ lock invitation row
→ validate token/status/expiry
→ re-resolve normalized email against users
→ new person: create ADMIN user
   OR active Customer: update same user CUSTOMER → ADMIN
→ on promotion revoke existing sessions/Refresh Tokens
→ mark invitation USED
COMMIT
```

This transaction prevents double acceptance and duplicate-account races.

### OTP Verification

Use row locking or an atomic conditional update so two simultaneous verifies cannot both consume the same one-time challenge. Wrong-attempt increment and max-attempt revocation must also be atomic.

### Refresh Rotation

```text
BEGIN
→ lock refresh token + session
→ validate token/session/user state
→ mark old Refresh used
→ insert replacement Refresh
COMMIT
```

If a previously-used Refresh Token is presented later, revoke the associated session.

### Password Reset

```text
BEGIN
→ lock reset token/user
→ validate one-time token
→ replace users.password_hash
→ mark reset token used
→ revoke every auth_session for user
→ revoke every Refresh Token for those sessions
COMMIT
```

No previous session may remain valid after commit.

---

## 14. Database Safety-Net Constraints

Constraints protect the database even when application logic has a bug, but they do not replace business transactions/locking.

Baseline:

```text
users.email                         → normalized/case-insensitive UNIQUE
all token_hash columns              → UNIQUE within their table
foreign-key columns                 → indexed
attempt_count                       → non-negative CHECK
role/status/invitation status       → enum/CHECK constrained
admin invitation PENDING email      → one active row per normalized email
```

The backend must translate expected constraint conflicts into the approved API/business errors rather than leaking raw database errors.

---

## 15. Review Outcome

The Authentication data-model review is complete for the pre-backend contract phase.

The next step is **not** backend implementation. The user and assistant will first perform the final API-contract consistency/OpenAPI review together.