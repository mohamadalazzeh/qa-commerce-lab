# Authentication API Contract Draft v1.0

## Status

This is the current API-contract working draft for the Authentication module.

Authentication business behavior is frozen at a high level. Exact request/response bodies and final error schemas are reviewed endpoint-by-endpoint before backend implementation.

Detailed QA Test Cases remain intentionally deferred until the backend is implemented and Postman execution begins.

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
POST /api/v1/auth/password-reset/verify-otp
POST /api/v1/auth/reset-password

POST /api/v1/admin/admin-invitations
POST /api/v1/auth/admin-invitations/accept
```

---

## 1. Customer Registration — Frozen Contract

### Request

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

Unexpected privileged fields such as `role` are rejected rather than silently accepted.

### Success

```text
201 Created
```

```json
{
  "message": "Registration successful. Please verify your email.",
  "verificationRequired": true
}
```

Registration does not issue Access or Refresh Tokens.

### Baseline Errors

```text
Missing required field          → 400 / VALIDATION_ERROR
Invalid email format            → 400 / VALIDATION_ERROR
Invalid First/Last Name         → 400 / VALIDATION_ERROR
Weak/invalid password           → 400 / VALIDATION_ERROR
Unexpected field such as role   → 400 / VALIDATION_ERROR
Duplicate email                 → 409 / EMAIL_ALREADY_REGISTERED
```

Validation errors may include field-level details for frontend use.

---

## 2. Customer Email Verification — Frozen Contract

### Request

```http
POST /api/v1/auth/verify-email
Content-Type: application/json
```

```json
{
  "token": "<verification-token>"
}
```

The verification token identifies the existing pending account. The backend hashes the supplied raw token, locates the corresponding verification record, and validates token state.

### Success

A valid latest token within its 24-hour lifetime changes the account from `PENDING_VERIFICATION` to `ACTIVE` and marks the token as used.

```text
200 OK
```

```json
{
  "message": "Email verified successfully."
}
```

Email verification does not automatically log the Customer in and does not issue Access or Refresh Tokens.

### Error Behavior

```text
Missing token                    → 400 / VALIDATION_ERROR
Expired token                    → 400 / VERIFICATION_TOKEN_EXPIRED
Invalid / revoked / old token    → 400 / INVALID_VERIFICATION_TOKEN
```

An expired verification link is intentionally distinguishable from an unknown/invalid link so that a future frontend can guide the Customer to request a replacement verification email.

---

## 3. Resend Verification — Expiry-Only V1 Flow

### User Experience

For Version 1, a replacement verification email is available only after the currently valid verification link expires.

While the latest verification link is still inside its 24-hour validity window, the frontend does not offer an active Resend Verification Email action.

```text
Registration
→ verification email/link issued
→ link remains valid for 24 hours
→ resend is unavailable while latest link is valid
```

After expiry:

```text
Customer opens expired verification link
→ frontend calls verify-email
→ backend returns VERIFICATION_TOKEN_EXPIRED
→ frontend displays "Verification link expired"
→ frontend displays [Resend Verification Email]
→ Customer clicks the button only
→ Customer does NOT type the email again
```

The resend action uses the expired verification token/context to identify the original pending account. The destination email is the email already stored on that account and cannot be changed from this flow.

### Request Direction

```http
POST /api/v1/auth/resend-verification
Content-Type: application/json
```

```json
{
  "token": "<expired-verification-token>"
}
```

The expired token cannot activate the account, but its stored record can still identify which pending account it belonged to.

### Success

```text
200 OK
```

```json
{
  "message": "A new verification email has been sent."
}
```

Successful resend:

```text
latest verification token must be expired
→ generate a new verification token
→ new link is valid for 24 hours
→ previous token remains unusable
→ same existing Customer account remains
→ no duplicate account
→ resend becomes unavailable again while the new latest link is valid
```

An old expired token must not be reusable to repeatedly trigger replacement emails while a newer verification link is active.

### Superseded Rule

The earlier Customer Email Verification rule of a **60-second resend cooldown** is no longer applicable to verification links. The 60-second resend cooldown remains applicable to short-lived OTP flows where separately defined, such as Admin Login OTP and Password Recovery OTP.

The exact HTTP status/business code for an attempted resend while a newer verification link is still valid will be frozen next.

---

## Customer Login — Frozen Behavior

```text
ACTIVE + valid credentials
+ no temporary lock
+ no active rate limit
→ 200 OK
→ Access Token + Refresh Token
→ normal application access
```

Normal Customer login does not require OTP in Version 1.

Baseline outcomes:

```text
Invalid email/password                     → 401 Unauthorized
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary account lock active              → 423 Locked
Rate limit exceeded                         → 429 Too Many Requests
```

Wrong credentials must not reveal whether the account exists or disclose account state.

---

## Admin Login — Frozen Behavior

Admin login uses the same password protections as Customer login plus a mandatory email OTP step.

```text
Email + Password
→ Login Rate Limiting
→ Account Lockout protection
→ credentials valid
→ generate/send 6-digit Email OTP
→ do not issue normal Access/Refresh tokens yet
→ Admin submits OTP
→ OTP valid
→ authentication completes
→ Access Token + Refresh Token
```

Admin Login OTP rules:

```text
Format              → 6 digits
Validity            → 5 minutes
Max failed attempts → 5
Resend cooldown     → 60 seconds
Newest OTP only     → yes
One-time use        → yes
```

Five failed OTP attempts invalidate the current OTP challenge; they do not change the Admin account status to `DISABLED`.

---

## Login Protection — Customer and Admin

Account Lockout:

```text
5 consecutive failed password attempts
→ account temporarily locked for 15 minutes
```

A successful authentication before the fifth failure resets the failed-attempt sequence.

Rate Limiting:

```text
Per account/email → 10 login requests / minute
Per source IP     → 60 login requests / minute
Exceeded          → 429 Too Many Requests
Retry-After       → include where practical
```

The system does not rely on IP-only rate limiting as the sole protection. Rate-limit thresholds are configurable rather than hard-coded.

`DISABLED` is a business/account status and is separate from temporary security lock state.

---

## First Bootstrap Admin — Special First Login

Only the first Admin created through bootstrap begins with a temporary password.

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

The first Admin must not access normal privileged functionality before the temporary password has been replaced.

Additional Admins created through the invitation workflow choose their own password during invitation acceptance, so this forced temporary-password flow does not apply to them.

---

## Additional Admin Invitation

```text
Existing authenticated ADMIN
→ creates Admin invitation
→ invitation link emailed to invitee
→ invitee accepts valid invitation
→ invitee chooses password
→ backend creates account with role = ADMIN
→ success confirmation is shown
→ invitee can proceed to normal Admin login
```

Account creation does not automatically log the invited Admin in. The subsequent Admin login still requires Email + Password + Email OTP.

---

## Refresh Token

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Refresh Token Rotation:

```text
Valid Refresh Token
→ old Refresh Token invalidated
→ new Access Token issued
→ new Refresh Token issued
```

A rotated/used Refresh Token cannot be reused. A `DISABLED` account cannot refresh its session.

---

## Logout

Applies to Customer and Admin:

```text
Logout
→ current session invalidated
→ current Refresh Token invalidated
→ a new session requires full authentication again
```

Server-side revocation/session support may use Redis or equivalent implementation state.

---

## Password Recovery and Reset

Password Recovery applies to both Customer and Admin.

Forgot-password responses must be generic enough to reduce account-enumeration risk.

Password Recovery OTP:

```text
Format              → 6 digits
Validity            → 5 minutes
Max failed attempts → 5
Resend cooldown     → 60 seconds
Newest OTP only     → yes
One-time use        → yes
```

Successful Password Reset:

```text
new password stored securely
→ old password becomes invalid
→ existing sessions invalidated
→ existing Refresh Tokens invalidated
→ user signs in again using the new password
```

An Admin who resets the password must still complete the normal Admin Email OTP step on the next login.

---

## Frontend-Ready Direction

A frontend is optional and may be implemented after the backend/API project is complete.

The Authentication API should remain frontend-ready with stable business/error codes, clear success/failure responses, and flows that map cleanly to future UI screens.

---

## Current Contract Review Position

Completed/frozen in the current endpoint-by-endpoint review:

```text
Customer Registration ✅
Customer Email Verification ✅
Expired-link resend request/success behavior ✅
Verification resend availability only after latest-link expiry ✅
```

Next:

```text
Freeze resend-verification remaining error response
→ First Admin / Admin invitation contract details
→ Login
→ Admin OTP
→ Temporary password change
→ Refresh
→ Logout
→ Password Recovery / Reset
```

After the Authentication API/OpenAPI contract is frozen, stop for discussion before backend implementation begins.