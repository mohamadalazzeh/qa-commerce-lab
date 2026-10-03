# Authentication API Contract Draft v1.0

## Status

This is the current API-contract working draft for the Authentication module.

Authentication business behavior is substantially frozen. Exact request/response details that are still open are reviewed during the final contract consistency pass before backend implementation.

Detailed QA Test Cases remain intentionally deferred until the backend is implemented and Postman execution begins.

**Important:** After the Authentication contract is frozen, stop and discuss the backend plan before implementation starts.

---

## Endpoint Inventory

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification

POST /api/v1/auth/login
POST /api/v1/auth/admin-otp/verify
POST /api/v1/auth/admin-otp/resend
POST /api/v1/auth/change-temporary-password

POST /api/v1/auth/refresh
POST /api/v1/auth/logout

POST /api/v1/auth/forgot-password
POST /api/v1/auth/password-reset/resend
POST /api/v1/auth/password-reset/verify-otp
POST /api/v1/auth/reset-password

POST /api/v1/admin/admin-invitations
POST /api/v1/admin/admin-invitations/{invitationId}/resend
POST /api/v1/admin/admin-invitations/{invitationId}/cancel
POST /api/v1/auth/admin-invitations/accept
```

---

## 1. Customer Registration — Frozen

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "firstName": "Mohammad",
  "lastName": "Alazzeh",
  "email": "user@example.com",
  "password": "Example@123"
}
```

The caller does not submit `role` or `status`. The backend assigns:

```text
role = CUSTOMER
status = PENDING_VERIFICATION
```

Unexpected privileged fields such as `role` are rejected.

Success:

```text
201 Created
```

```json
{
  "message": "Registration successful. Please verify your email.",
  "verificationRequired": true
}
```

No Access/Refresh Tokens are issued.

Baseline errors:

```text
Missing/invalid field           → 400 / VALIDATION_ERROR
Unexpected privileged field     → 400 / VALIDATION_ERROR
Duplicate email                 → 409 / EMAIL_ALREADY_REGISTERED
```

---

## 2. Customer Email Verification — Frozen

```http
POST /api/v1/auth/verify-email
```

```json
{
  "token": "<verification-token>"
}
```

The token is a secure opaque raw token sent by email. Only its hash is stored in the database.

A valid latest token within 24 hours:

```text
PENDING_VERIFICATION → ACTIVE
token used_at → NOW
200 OK
```

```json
{
  "message": "Email verified successfully."
}
```

Verification does not log the Customer in and does not issue Access/Refresh Tokens. The frontend redirects to Login after success.

Errors:

```text
Missing token                 → 400 / VALIDATION_ERROR
Expired token                 → 400 / VERIFICATION_TOKEN_EXPIRED
Invalid/revoked/old token     → 400 / INVALID_VERIFICATION_TOKEN
```

---

## 3. Resend Verification — Frozen Direction

```http
POST /api/v1/auth/resend-verification
```

Verification link lifetime and resend cooldown are separate:

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
```

Two user flows use the same endpoint:

### A. Check-your-email / pending-login flow

The frontend already knows the email from Registration or Login and keeps it only as temporary flow state.

```json
{
  "email": "user@example.com"
}
```

### B. Expired verification-link flow

```json
{
  "token": "<expired-verification-token>"
}
```

Exactly one of `email` or `token` is accepted. Both or neither are validation errors.

Rules:

```text
0–59 seconds after issue                → resend blocked
60+ seconds                             → resend allowed if still PENDING_VERIFICATION
Successful resend                       → new secure token
New link lifetime                       → fresh 24 hours
Previous token                          → invalid immediately
Only newest verification link           → usable
Frontend button state                   → UX only; backend also enforces cooldown
```

Cooldown rejection:

```text
429 Too Many Requests
code = VERIFICATION_RESEND_COOLDOWN
Retry-After header where practical
```

For token-driven requests, invalid/old token returns `400 / INVALID_VERIFICATION_TOKEN`; already verified returns `409 / EMAIL_ALREADY_VERIFIED`; a disabled identified account returns `403 / ACCOUNT_DISABLED`.

For the public email-driven path, responses must not expose whether an unknown email exists. The final generic response wording will be normalized during the final consistency pass.

---

## 4. Login — Frozen Behavior

```http
POST /api/v1/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "Example@123"
}
```

Baseline outcomes:

```text
Invalid email/password                     → 401 / INVALID_CREDENTIALS
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary account lock active              → 423 / ACCOUNT_LOCKED
Rate limit exceeded                         → 429 / RATE_LIMIT_EXCEEDED
```

Wrong credentials do not disclose account existence or account state.

A pending Customer may be directed to the verification screen and resend a verification email using the email already entered during Login.

### Customer

```text
ACTIVE + valid credentials
→ Access Token + Refresh Token
→ no OTP in Version 1
```

### Admin

```text
ACTIVE + valid credentials
→ no normal Access/Refresh Tokens yet
→ create Admin Login OTP challenge
→ email OTP
→ return requiresTwoFactor + challengeId
```

Conceptual response:

```json
{
  "requiresTwoFactor": true,
  "challengeId": "<challenge-id>"
}
```

---

## 5. Login Protection — Frozen

### Account Lockout

Applies to Customer and Admin password authentication.

```text
5 consecutive failed passwords
→ temporary account lock for 15 minutes
```

A successful password authentication before the fifth failure resets the consecutive-failure sequence.

Suggested persistent account-security fields:

```text
users.failed_login_attempts
users.locked_until
```

`DISABLED` is a business/account state and is separate from the temporary security lock.

### Rate Limiting

Version 1 baseline:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
Exceeded          → 429 Too Many Requests
```

Thresholds are configurable, not hard-coded. Rate limiting rejects matching requests temporarily; it does not stop the server.

---

## 6. Admin Login OTP — Frozen

Persistent PostgreSQL table direction:

```text
admin_login_otp_challenges
```

Conceptual fields:

```text
id                  = challengeId
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

The table is persistent; each row represents a temporary Admin Login challenge. Raw OTP values are never stored or logged.

Rules:

```text
Format                    → 6 digits
Validity                  → 5 minutes
Maximum wrong attempts    → 5 per challenge
Resend cooldown           → 60 seconds
One-time use              → yes
Newest OTP only           → yes
Resend challengeId        → same challengeId
Resend resets attempts    → no
```

A new full Admin Login invalidates any previous still-active Admin Login challenge for that Admin.

### Verify

```http
POST /api/v1/auth/admin-otp/verify
```

```json
{
  "challengeId": "<challenge-id>",
  "otp": "482913"
}
```

Behavior:

```text
Missing/invalid request fields  → 400 / VALIDATION_ERROR
Wrong OTP                       → 401 / INVALID_OTP; attempt_count + 1
Expired OTP                     → 401 / OTP_EXPIRED
Fifth wrong OTP                 → challenge revoked/locked
Attempts exhausted              → 423 / OTP_CHALLENGE_LOCKED
Already-used challenge          → 409 / OTP_CHALLENGE_ALREADY_USED
Valid OTP                       → used_at = NOW; continue authentication
```

Five wrong OTP attempts invalidate only the current challenge. They do not disable or password-lock the Admin account. The Admin must restart Login to obtain a new challenge.

Concurrent verification of the same challenge must be atomic: only one request may succeed.

### Resend

```http
POST /api/v1/auth/admin-otp/resend
```

```json
{
  "challengeId": "<challenge-id>"
}
```

Before 60 seconds:

```text
429 / OTP_RESEND_COOLDOWN
Retry-After: <remaining-seconds>
```

After 60 seconds:

```text
same challengeId
→ generate new OTP
→ replace otp_hash
→ expires_at = NOW + 5 minutes
→ last_sent_at = NOW
→ previous OTP invalid immediately
→ attempt_count remains unchanged
```

A `USED` or max-attempt/revoked challenge cannot be revived by Resend.

---

## 7. First Bootstrap Admin — Temporary Password Change

The first Admin is created through secure operator bootstrap, not public registration.

Conceptual user state:

```text
role = ADMIN
status = ACTIVE
must_change_password = true
```

Flow:

```text
Email + Temporary Password
→ Admin OTP
→ OTP verified
→ do NOT issue normal Admin session yet
→ issue restricted passwordChangeToken
→ mandatory password change
→ must_change_password = false
→ issue normal Access + Refresh
```

The restricted `passwordChangeToken`:

```text
validity = 10 minutes
one-time use = yes
purpose = CHANGE_TEMPORARY_PASSWORD
```

It cannot authorize normal Admin APIs.

```http
POST /api/v1/auth/change-temporary-password
```

```json
{
  "newPassword": "NewStrong@123"
}
```

The token identifies the Admin internally. `confirmPassword` is a frontend concern and is not required by the API.

The new password must satisfy the normal password policy and must not equal the current temporary password. Success replaces `users.password_hash`; no second password row is kept.

---

## 8. Additional Admin Invitation — Approved Business Direction

Only an authenticated `ADMIN` may create/manage Admin invitations. There is no public Admin registration endpoint.

Persistent PostgreSQL table direction:

```text
admin_invitations
```

It stores invitation records independently from `users`, including records for new people and promotion invitations linked to an existing Customer.

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
Invitation lifetime                   → 24 hours
One active/PENDING invitation/email  → maximum one
Create invitation                     → 201 Created
Resend existing invitation            → update same row; 200 OK
Resend cooldown                       → 60 seconds
Resend                                → new token; old token invalid immediately
Cancel                                → PENDING → CANCELLED; row kept for history
Already ADMIN                         → no invitation; conflict
```

For a new email, acceptance creates a `users` row with `role = ADMIN`, `status = ACTIVE`, using the invitee's chosen password. Acceptance does not auto-login.

For an existing `ACTIVE` Customer, invitation acceptance promotes the same `users` row:

```text
CUSTOMER → ADMIN
same user_id
same password_hash
same historical orders/data
all existing Customer sessions revoked
next Login follows Admin password + OTP flow
```

`PENDING_VERIFICATION` and `DISABLED` Customers are not eligible for promotion until their account state is resolved.

Exact invitation request/response/error schemas remain part of the final contract consistency pass.

---

## 9. Session / Refresh — Frozen Direction

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Access Token is sent as a Bearer token. Refresh Token is held in an `HttpOnly`, `Secure` cookie. Final SameSite/CSRF settings are confirmed with the deployment/frontend origin model.

Persistent PostgreSQL table direction:

```text
auth_sessions
refresh_tokens
```

Raw Refresh Tokens are not stored; a token hash is stored.

### Refresh

```http
POST /api/v1/auth/refresh
```

Valid refresh behavior:

```text
validate cookie token + session + current user state
→ old Refresh Token becomes used/invalid
→ issue new Access Token
→ issue rotated Refresh Token
```

Reusing an already-rotated Refresh Token is rejected with a generic `401 / INVALID_REFRESH_TOKEN` direction and revokes the entire associated session.

A `DISABLED` account cannot refresh. A Customer→Admin role change revokes the Customer's existing sessions before the user logs in again as Admin.

### Logout

```http
POST /api/v1/auth/logout
```

Logout affects the current session only:

```text
auth_sessions.revoked_at = NOW
associated Refresh Tokens revoked
refresh cookie cleared
204 No Content
```

---

## 10. Password Recovery / Reset — Frozen Direction

Password Recovery applies to Customer and Admin and is separate from Customer Email Verification and Admin Login OTP.

### Start Recovery

```http
POST /api/v1/auth/forgot-password
```

```json
{
  "email": "user@example.com"
}
```

Public response is generic:

```text
200 OK
```

```json
{
  "message": "If an account exists for this email, a verification code has been sent."
}
```

Unknown or `DISABLED` accounts receive the same public response but do not get a Reset challenge/email.

`ACTIVE` Customer/Admin and `PENDING_VERIFICATION` Customer accounts may use recovery. Resetting a pending account does not activate it.

Persistent PostgreSQL table:

```text
password_reset_challenges
```

Conceptual fields:

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

At five wrong attempts, only the Reset challenge is invalidated; the account itself is not locked or disabled.

### Resend Recovery OTP

```http
POST /api/v1/auth/password-reset/resend
```

```json
{
  "email": "user@example.com"
}
```

To prevent account enumeration, the public response remains generic for existing, unknown, disabled, and per-account-cooldown cases. Internally, a new OTP is sent only when the account is eligible and the 60-second cooldown has passed. General source-IP abuse protection may still return `429` independently.

Successful resend invalidates the previous OTP immediately, starts a fresh 5-minute OTP lifetime, and preserves `attempt_count`.

### Verify Recovery OTP

```http
POST /api/v1/auth/password-reset/verify-otp
```

```json
{
  "email": "user@example.com",
  "otp": "482913"
}
```

Invalid/unknown combinations use generic invalid-OTP behavior rather than disclosing account existence.

Valid OTP:

```text
challenge becomes used/verified
→ issue one-time resetToken
```

Persistent PostgreSQL table:

```text
password_reset_tokens
```

The raw Reset Token is returned to the client; only its hash is stored.

```text
resetToken validity = 10 minutes
one-time use = yes
```

### Reset Password

```http
POST /api/v1/auth/reset-password
```

```json
{
  "resetToken": "<reset-token>",
  "newPassword": "NewStrong@123"
}
```

Success:

```text
validate resetToken
→ validate password policy
→ reject same-as-current password
→ replace users.password_hash
→ mark resetToken used
→ revoke all existing sessions and Refresh Tokens
→ no auto-login
→ user returns to Login
```

The project does not maintain full password history in Version 1; only reuse of the current password is rejected.

Admin users still complete the normal Admin Login OTP step on the next sign-in.

---

## Security / Concurrency Rules

```text
Passwords                     → hash only; never log plaintext
Verification/invitation token → raw sent to user; hash stored
OTP                           → raw emailed; non-plaintext verifier stored; never log raw OTP
Refresh/Reset tokens          → raw held by client; hash stored
Concurrent one-time use       → transaction/locking so only one request can succeed
Database UNIQUE constraints   → safety net, not sole concurrency control
```

---

## Current Contract Review Position

Substantially frozen:

```text
Customer Registration ✅
Email Verification / Resend ✅
Login states / Lockout / Rate Limit ✅
Admin Login OTP ✅
First Admin forced password change ✅
Session / Refresh / Logout ✅
Password Recovery / Reset OTP ✅
Admin invitation business direction ✅
```

Remaining before backend implementation:

```text
1. Finalize exact Admin Invitation request/response/error schemas.
2. Final consistency pass across verification resend + all error/status codes.
3. Confirm database table relationships/transactions and OpenAPI alignment.
4. Freeze Authentication contract.
5. STOP and discuss backend implementation plan with the user.
```
