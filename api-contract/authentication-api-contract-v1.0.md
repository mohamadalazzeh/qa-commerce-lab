# Authentication API Contract v1.0

## Status

**FROZEN — ready for backend planning.**

This document is the Version 1 source of truth for the externally observable Authentication API behavior. Backend implementation details and PostgreSQL relationships are documented separately in `docs/business-analysis/authentication-data-model-v1.0.md`.

Detailed QA Test Cases remain intentionally deferred until the backend is running and the APIs are executed through Postman, PostgreSQL, and Mailpit.

**Backend implementation must not begin until the backend plan is explicitly discussed with the user.**

---

## 1. API Conventions

Base path:

```text
/api/v1
```

JSON endpoints use:

```http
Content-Type: application/json
```

Standard error shape:

```json
{
  "code": "BUSINESS_ERROR_CODE",
  "message": "Human-readable message."
}
```

Validation errors may additionally include:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid."
    }
  ]
}
```

An error may include a small `details` object when the client needs safe recovery context. Sensitive credentials, raw tokens, OTP values, password hashes, and internal database details are never returned.

All durations named `expiresIn` are expressed in seconds. Stored timestamps use UTC; API timestamps use ISO-8601 UTC when exposed.

---

## 2. Token / Session Conventions

```text
Access Token lifetime                  = 15 minutes / 900 seconds
Refresh Token lifetime                 = 7 days / 604800 seconds
Email verification link lifetime       = 24 hours / 86400 seconds
Verification resend cooldown           = 60 seconds
Admin invitation lifetime              = 24 hours / 86400 seconds
Admin invitation resend cooldown       = 60 seconds
Admin Login OTP lifetime               = 5 minutes / 300 seconds
Admin OTP resend cooldown              = 60 seconds
Password Reset OTP lifetime            = 5 minutes / 300 seconds
Password Reset OTP resend cooldown     = 60 seconds
Password Change Token lifetime         = 10 minutes / 600 seconds
Password Reset Token lifetime          = 10 minutes / 600 seconds
```

Access Tokens are sent by the client as Bearer tokens.

Refresh Tokens are opaque credentials stored in an `HttpOnly` cookie. Production/default cookie direction:

```text
HttpOnly = true
Secure = true
SameSite = Lax
```

`Secure` may be disabled only for local HTTP development through environment configuration. If a future frontend deployment requires a cross-site cookie (`SameSite=None`), explicit CSRF protection/origin validation must be added before that deployment model is accepted.

Refresh Tokens use rotation. Raw Refresh Tokens are not persisted.

---

## 3. Endpoint Inventory

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

GET  /api/v1/admin/admin-invitations
POST /api/v1/admin/admin-invitations
POST /api/v1/admin/admin-invitations/{invitationId}/resend
POST /api/v1/admin/admin-invitations/{invitationId}/cancel
POST /api/v1/auth/admin-invitations/inspect
POST /api/v1/auth/admin-invitations/accept
```

The `GET /admin/admin-invitations` endpoint was added during the final consistency review because the approved Manage Invitations UX requires an API for viewing invitation state before Resend/Cancel actions can be selected.

---

# Customer Registration and Verification

## 4. Register Customer

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "firstName": "Mohammad",
  "lastName": "Alazzeh",
  "email": "user@example.com",
  "password": "Example@123"
}
```

The client does not submit `role` or `status`. The backend assigns:

```text
role = CUSTOMER
status = PENDING_VERIFICATION
```

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

No Access or Refresh Token is issued.

Errors:

```text
400 VALIDATION_ERROR
409 EMAIL_ALREADY_REGISTERED
```

Unexpected privileged fields such as `role` or `status` are rejected with `400 VALIDATION_ERROR`.

Email uniqueness is case-insensitive.

If account creation and verification-token creation succeed but verification-email delivery fails, the Customer account remains `PENDING_VERIFICATION`; it is not deleted. The endpoint returns:

```text
503 EMAIL_DELIVERY_FAILED
```

with safe recovery context indicating that the account was created and verification is still required. The Customer can use the Resend Verification flow instead of registering again.

---

## 5. Verify Customer Email

```http
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "token": "<verification-token>"
}
```

Success:

```text
200 OK
```

```json
{
  "message": "Email verified successfully."
}
```

Successful verification changes the Customer from `PENDING_VERIFICATION` to `ACTIVE`. It does not create an authenticated session and does not issue Access/Refresh Tokens. The frontend proceeds to Login.

Errors:

```text
400 VALIDATION_ERROR
400 VERIFICATION_TOKEN_EXPIRED
400 INVALID_VERIFICATION_TOKEN
403 ACCOUNT_DISABLED
409 EMAIL_ALREADY_VERIFIED
```

Rules:

```text
Expired latest token                         → VERIFICATION_TOKEN_EXPIRED
Old token invalidated by Resend              → INVALID_VERIFICATION_TOKEN
Random/revoked token                         → INVALID_VERIFICATION_TOKEN
Already-used token for now-ACTIVE account    → EMAIL_ALREADY_VERIFIED
Identified account became DISABLED           → ACCOUNT_DISABLED
```

Only one concurrent consume of the same one-time verification token may succeed.

---

## 6. Resend Verification Email

```http
POST /api/v1/auth/resend-verification
```

Exactly one of `email` or `token` is accepted.

### 6.1 Email-driven flow

Used after Registration or after correct credentials identify a `PENDING_VERIFICATION` Customer during Login.

```json
{
  "email": "user@example.com"
}
```

Public response:

```text
200 OK
```

```json
{
  "message": "If an eligible unverified account exists, a verification email has been sent."
}
```

The same public `200` response is used for:

```text
eligible PENDING_VERIFICATION account
unknown email
already verified account
DISABLED account
confirmed email-delivery failure
```

This prevents account/state enumeration.

The 60-second cooldown is applied uniformly to syntactically valid normalized email input, including unknown emails, so the cooldown response itself does not reveal account existence.

```text
Within cooldown → 429 VERIFICATION_RESEND_COOLDOWN
```

`Retry-After` is included where practical.

### 6.2 Expired-token flow

```json
{
  "token": "<expired-verification-token>"
}
```

The expired token may still identify the original account for resend purposes.

```text
Eligible pending account     → 200
Within cooldown              → 429 VERIFICATION_RESEND_COOLDOWN
Invalid/random/old token     → 400 INVALID_VERIFICATION_TOKEN
Already verified             → 409 EMAIL_ALREADY_VERIFIED
Disabled identified account  → 403 ACCOUNT_DISABLED
Confirmed delivery failure   → 503 EMAIL_DELIVERY_FAILED
```

Success body:

```json
{
  "message": "A new verification email has been sent."
}
```

Common rules:

```text
New verification token          → fresh 24-hour lifetime
Previous token                  → invalid immediately after successful replacement
Only newest link                → usable
Both email and token supplied   → 400 VALIDATION_ERROR
Neither supplied                → 400 VALIDATION_ERROR
```

On a confirmed send failure, a token replacement must not leave the Customer with a newly committed unusable token while unnecessarily invalidating a previously usable token.

---

# Login and Session

## 7. Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "Example@123"
}
```

Security precedence:

```text
Unknown email / wrong password          → always 401 INVALID_CREDENTIALS
Correct password + PENDING_VERIFICATION → 403 EMAIL_VERIFICATION_REQUIRED
Correct password + DISABLED             → 403 ACCOUNT_DISABLED
Correct password + active temp lock     → 423 ACCOUNT_LOCKED
Applicable request rate limit exceeded  → 429 RATE_LIMIT_EXCEEDED
```

Wrong credentials do not disclose whether an account exists, is pending, disabled, or temporarily locked.

Account Lockout applies to both Customer and Admin password authentication:

```text
5 consecutive wrong passwords → temporary lock for 15 minutes
successful password authentication before attempt #5 → reset failure sequence
```

While the lock is active, even the correct password cannot establish Login. The lock expires automatically; it does not change account status to `DISABLED`.

Rate-limit baseline, configurable by environment:

```text
Per normalized email input → 10 Login requests / minute
Per source IP              → 60 Login requests / minute
```

The email-input limiter is applied consistently even for unknown emails so it does not become an enumeration oracle. The source-IP threshold is intentionally configurable because shared-NAT environments may require tuning.

### 7.1 Customer success

```text
200 OK
Set-Cookie: refreshToken=<opaque>; HttpOnly; ...
```

```json
{
  "accessToken": "<access-token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Normal Customer Login does not require OTP in V1.

### 7.2 Admin first-factor success

Correct Admin email/password does not issue normal Access/Refresh Tokens yet.

```text
200 OK
```

```json
{
  "requiresTwoFactor": true,
  "challengeId": "<challenge-id>",
  "otpExpiresIn": 300
}
```

If the OTP email cannot be delivered, no privileged session is issued and the endpoint returns:

```text
503 OTP_DELIVERY_FAILED
```

---

## 8. Verify Admin Login OTP

```http
POST /api/v1/auth/admin-otp/verify
```

Request:

```json
{
  "challengeId": "<challenge-id>",
  "otp": "482913"
}
```

Rules:

```text
OTP format              = 6 digits
OTP lifetime            = 5 minutes
Max wrong attempts      = 5 per challenge
One-time use            = yes
Newest OTP only         = yes
```

Errors:

```text
400 VALIDATION_ERROR
401 INVALID_OTP
401 OTP_EXPIRED
423 OTP_CHALLENGE_LOCKED
409 OTP_CHALLENGE_ALREADY_USED
```

Each wrong OTP increments the challenge attempt counter. The fifth wrong OTP invalidates only the OTP challenge; it does not disable or password-lock the Admin account. The Admin must restart full Login to obtain a new challenge.

Concurrent verification is one-time and atomic: only one request can succeed.

### 8.1 Normal Admin success

```text
200 OK
Set-Cookie: refreshToken=<opaque>; HttpOnly; ...
```

```json
{
  "accessToken": "<access-token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### 8.2 Bootstrap Admin requiring password replacement

If `must_change_password = true`, normal Access/Refresh Tokens are not issued.

```text
200 OK
```

```json
{
  "passwordChangeRequired": true,
  "passwordChangeToken": "<restricted-token>",
  "expiresIn": 600
}
```

The restricted token can authorize only the temporary-password change endpoint.

---

## 9. Resend Admin Login OTP

```http
POST /api/v1/auth/admin-otp/resend
```

Request:

```json
{
  "challengeId": "<challenge-id>"
}
```

Success:

```text
200 OK
```

```json
{
  "message": "A new verification code has been sent."
}
```

Behavior:

```text
Resend cooldown               = 60 seconds
Within cooldown               → 429 OTP_RESEND_COOLDOWN + Retry-After
Successful resend             → same challengeId
Successful resend             → new OTP with fresh 5-minute expiry
Previous OTP                  → invalid immediately
attempt_count                 → unchanged
Used/revoked/locked challenge → cannot be revived
```

Invalid or unavailable challenge state returns a stable challenge-related error without issuing a code. Confirmed email-delivery failure returns `503 OTP_DELIVERY_FAILED` and does not create a usable authentication session.

---

## 10. Change Bootstrap Temporary Password

```http
POST /api/v1/auth/change-temporary-password
Authorization: Bearer <passwordChangeToken>
```

Request:

```json
{
  "newPassword": "NewStrong@123"
}
```

`confirmPassword` is a frontend-only concern.

Success:

```text
200 OK
Set-Cookie: refreshToken=<opaque>; HttpOnly; ...
```

```json
{
  "accessToken": "<access-token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Success replaces the temporary password hash, sets `must_change_password = false`, consumes the restricted token, and creates the normal Admin session.

Errors:

```text
400 VALIDATION_ERROR
400 PASSWORD_REUSE_NOT_ALLOWED
401 INVALID_PASSWORD_CHANGE_TOKEN
409 PASSWORD_CHANGE_NOT_REQUIRED
```

The `passwordChangeToken` is one-time and valid for 10 minutes. It cannot authorize normal Admin endpoints.

---

## 11. Refresh Session

```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<opaque>
```

Success:

```text
200 OK
Set-Cookie: refreshToken=<new-opaque-token>; HttpOnly; ...
```

```json
{
  "accessToken": "<new-access-token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Rules:

```text
Valid Refresh Token      → rotate token and issue new Access Token
Old rotated token        → unusable immediately
Detected token reuse     → 401 INVALID_REFRESH_TOKEN + revoke associated session
Expired/invalid token    → 401 INVALID_REFRESH_TOKEN
Revoked session          → 401 INVALID_REFRESH_TOKEN
DISABLED account         → 403 ACCOUNT_DISABLED + revoke session
```

No password or Admin OTP is required for ordinary Access Token refresh inside a still-valid authenticated session.

---

## 12. Logout

```http
POST /api/v1/auth/logout
```

Logout applies to the current session only.

```text
204 No Content
```

The backend revokes the current session and associated Refresh Tokens and clears the Refresh cookie.

Logout is idempotent from the client perspective: a missing/already-invalid current Refresh cookie still results in the cookie being cleared and `204 No Content`.

---

# Password Recovery

## 13. Start Forgot Password

```http
POST /api/v1/auth/forgot-password
```

Request:

```json
{
  "email": "user@example.com"
}
```

Public response:

```text
200 OK
```

```json
{
  "message": "If an account exists for this email, a verification code has been sent."
}
```

The public response is the same for:

```text
ACTIVE Customer
ACTIVE Admin
PENDING_VERIFICATION Customer
DISABLED account
unknown email
confirmed delivery failure
```

Only eligible accounts receive an actual recovery challenge/email. Resetting a `PENDING_VERIFICATION` Customer password does not activate the account.

---

## 14. Resend Password Reset OTP

```http
POST /api/v1/auth/password-reset/resend
```

Request:

```json
{
  "email": "user@example.com"
}
```

Public response remains generic:

```text
200 OK
```

```json
{
  "message": "If an account exists for this email, a verification code has been sent."
}
```

Rules:

```text
OTP resend cooldown       = 60 seconds
Successful resend         → new OTP
Previous OTP              → invalid immediately
New OTP validity          → 5 minutes
attempt_count             → unchanged
```

Eligible, unknown, disabled, per-account-cooldown, and confirmed delivery-failure states receive the same public response. General source-IP abuse protection may independently return `429 RATE_LIMIT_EXCEEDED`.

---

## 15. Verify Password Reset OTP

```http
POST /api/v1/auth/password-reset/verify-otp
```

Request:

```json
{
  "email": "user@example.com",
  "otp": "482913"
}
```

Rules:

```text
OTP format             = 6 digits
OTP lifetime           = 5 minutes
Maximum wrong attempts = 5
One-time use           = yes
Newest OTP only        = yes
Resend resets attempts = no
```

To avoid turning recovery state into an account-enumeration channel, wrong, unknown-email, expired, revoked, used, or exhausted recovery challenges use the same externally visible authentication failure:

```text
401 INVALID_OTP
```

Success:

```text
200 OK
```

```json
{
  "resetToken": "<one-time-reset-token>",
  "expiresIn": 600
}
```

The successful OTP challenge is consumed. The Reset Token is one-time and valid for 10 minutes.

---

## 16. Reset Password

```http
POST /api/v1/auth/reset-password
```

Request:

```json
{
  "resetToken": "<reset-token>",
  "newPassword": "NewStrong@123"
}
```

Success:

```text
200 OK
```

```json
{
  "message": "Password reset successfully. Please sign in again."
}
```

Success replaces the current password hash, consumes the Reset Token, revokes all existing sessions/Refresh Tokens, does not auto-login, and returns the user to Login.

Errors:

```text
400 VALIDATION_ERROR
400 PASSWORD_REUSE_NOT_ALLOWED
401 INVALID_RESET_TOKEN
403 ACCOUNT_DISABLED
409 RESET_TOKEN_ALREADY_USED
```

V1 does not maintain full password history; only reuse of the current password is rejected.

An Admin still completes the normal Admin email-OTP step on the next full Login.

---

# Administrator Provisioning

## 17. List / Manage Admin Invitations

```http
GET /api/v1/admin/admin-invitations?status=PENDING&page=1&pageSize=20
Authorization: Bearer <admin-access-token>
```

Only authenticated Admins may use this endpoint.

Success:

```text
200 OK
```

```json
{
  "items": [
    {
      "invitationId": "<uuid>",
      "firstName": "Ahmad",
      "lastName": "Saleh",
      "email": "ahmad@example.com",
      "type": "NEW_ADMIN",
      "status": "PENDING",
      "expiresAt": "2026-10-04T17:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

`type` is one of:

```text
NEW_ADMIN
CUSTOMER_PROMOTION
```

`status` is one of:

```text
PENDING
EXPIRED
USED
CANCELLED
```

Errors:

```text
400 VALIDATION_ERROR
401 unauthenticated
403 authenticated but not ADMIN
```

---

## 18. Create Admin Invitation

```http
POST /api/v1/admin/admin-invitations
Authorization: Bearer <admin-access-token>
```

Request:

```json
{
  "firstName": "Ahmad",
  "lastName": "Saleh",
  "email": "ahmad@example.com"
}
```

For a new email, the supplied names are stored with the invitation and are used when acceptance creates the Admin account. For an existing Customer, the existing Customer profile remains authoritative; supplied names must never overwrite it.

Success:

```text
201 Created
```

```json
{
  "invitationId": "<uuid>",
  "message": "Admin invitation created successfully.",
  "expiresIn": 86400
}
```

Errors:

```text
400 VALIDATION_ERROR
401 unauthenticated
403 authenticated but not ADMIN
409 ADMIN_ALREADY_EXISTS
409 ADMIN_INVITATION_ALREADY_PENDING
409 ADMIN_INVITATION_REQUIRES_RESEND
409 ADMIN_PROMOTION_NOT_ALLOWED
503 EMAIL_DELIVERY_FAILED
```

Rules:

```text
Maximum one active PENDING invitation per email
Existing ACTIVE Customer → invitation linked to same user_id; role remains CUSTOMER until acceptance
Existing PENDING_VERIFICATION Customer → promotion not allowed
Existing DISABLED Customer → promotion not allowed
Already ADMIN → no invitation
Cancelled historical invitation → does not block a fresh invitation
```

If the invitation resource is created but email delivery fails, the invitation remains available to the authorized Admin for Resend; the failure response may safely include the `invitationId` in `details`.

---

## 19. Resend Admin Invitation

```http
POST /api/v1/admin/admin-invitations/{invitationId}/resend
Authorization: Bearer <admin-access-token>
```

Success:

```text
200 OK
```

```json
{
  "invitationId": "<uuid>",
  "message": "Admin invitation resent successfully.",
  "expiresIn": 86400
}
```

Rules/errors:

```text
PENDING after 60-second cooldown      → resend allowed
EXPIRED                               → resend allowed
Successful resend                     → same invitation record
Successful resend                     → new token; old token invalid immediately
Successful resend                     → expires_at = now + 24 hours; status PENDING
Within cooldown                       → 429 ADMIN_INVITATION_RESEND_COOLDOWN
Not found                             → 404 ADMIN_INVITATION_NOT_FOUND
USED                                  → 409 ADMIN_INVITATION_ALREADY_USED
CANCELLED                             → 409 ADMIN_INVITATION_CANCELLED
Target already ADMIN                  → 409 ADMIN_ALREADY_EXISTS
Promotion target no longer ACTIVE     → 409 ADMIN_PROMOTION_NOT_ALLOWED
Confirmed delivery failure            → 503 EMAIL_DELIVERY_FAILED
```

A confirmed send failure must not leave a newly committed unusable token while unnecessarily invalidating the last usable invitation token.

---

## 20. Cancel Admin Invitation

```http
POST /api/v1/admin/admin-invitations/{invitationId}/cancel
Authorization: Bearer <admin-access-token>
```

Success:

```text
200 OK
```

```json
{
  "message": "Admin invitation cancelled successfully."
}
```

Behavior/errors:

```text
PENDING → CANCELLED
Current token → unusable
Record → retained for history/audit
Not found → 404 ADMIN_INVITATION_NOT_FOUND
Already cancelled → 409 ADMIN_INVITATION_CANCELLED
Already used → 409 ADMIN_INVITATION_ALREADY_USED
```

Expired invitations are already unusable and do not require cancellation.

---

## 21. Inspect Admin Invitation

```http
POST /api/v1/auth/admin-invitations/inspect
```

Request:

```json
{
  "token": "<invitation-token>"
}
```

Valid new-person invitation:

```json
{
  "valid": true,
  "requiresPasswordSetup": true
}
```

Valid existing-Customer promotion:

```json
{
  "valid": true,
  "requiresPasswordSetup": false
}
```

No email or private account details are returned.

Errors:

```text
400 INVALID_ADMIN_INVITATION_TOKEN
400 ADMIN_INVITATION_EXPIRED
409 ADMIN_INVITATION_ALREADY_USED
409 ADMIN_INVITATION_CANCELLED
409 ADMIN_PROMOTION_NOT_ALLOWED
```

The backend rechecks current user state; inspection never reserves the invitation and does not guarantee that a later acceptance will still succeed.

---

## 22. Accept Admin Invitation

```http
POST /api/v1/auth/admin-invitations/accept
```

New-person invitation request:

```json
{
  "token": "<invitation-token>",
  "newPassword": "Strong@123"
}
```

Existing-Customer promotion request:

```json
{
  "token": "<invitation-token>"
}
```

For a new person, `newPassword` is required and must satisfy the normal password policy. For an existing `ACTIVE` Customer, the existing password is preserved and no new password is requested.

New-person success:

```text
201 Created
```

```json
{
  "message": "Admin account created successfully."
}
```

Existing-Customer promotion success:

```text
200 OK
```

```json
{
  "message": "Admin access activated successfully."
}
```

Acceptance never auto-logs the user in.

New person:

```text
create ADMIN / ACTIVE account
mark invitation USED
next step → normal Admin Login + OTP
```

Existing ACTIVE Customer:

```text
same user_id
same password_hash
same historical data
role CUSTOMER → ADMIN
all existing Customer sessions revoked
mark invitation USED
next Login → Admin password + OTP
```

Errors:

```text
400 VALIDATION_ERROR
400 INVALID_ADMIN_INVITATION_TOKEN
400 ADMIN_INVITATION_EXPIRED
409 ADMIN_INVITATION_ALREADY_USED
409 ADMIN_INVITATION_CANCELLED
409 ADMIN_PROMOTION_NOT_ALLOWED
409 ADMIN_ALREADY_EXISTS
```

At acceptance time, the backend re-resolves the invitation email and current account state. If the invitation meaning changed between Inspect and Accept (for example, a formerly-new email became an existing Customer), the backend must never overwrite the Customer password/profile. It either safely applies promotion semantics when the request is compatible or rejects the stale request so the client can re-inspect and retry with the correct flow.

Two simultaneous acceptance requests cannot both create/promote the same user.

---

# Cross-Flow Security / Consistency Rules

## 23. Account-State and Credential Rules

```text
PENDING_VERIFICATION → may not establish normal Login session
ACTIVE               → normal role-specific authentication allowed
DISABLED             → may not Login or Refresh
```

A Password Reset does not activate a pending Customer.

A Customer→Admin promotion does not create a second account, does not change historical ownership, and revokes all old Customer sessions before a new Admin Login.

---

## 24. Secret Handling

```text
Passwords                      → never stored/logged as plaintext
Verification tokens            → raw delivered to user; hash/verifier persisted
Admin invitation tokens        → raw delivered to user; hash/verifier persisted
OTP values                     → raw delivered by email; non-plaintext verifier persisted
Refresh Tokens                 → raw held by client; hash/verifier persisted
Password Change / Reset Tokens → raw held by client; hash/verifier persisted
```

---

## 25. One-Time / Concurrency Rules

One-time operations must behave atomically from the API caller's perspective:

```text
Email Verification consume
Admin Invitation accept
Admin OTP verify
Refresh Token rotation
Password Reset Token consume
```

A concurrent duplicate request may not succeed twice.

---

## 26. OpenAPI / Swagger Alignment Outcome

No separate frozen OpenAPI YAML/JSON document existed before this consistency review. Therefore this Version 1 contract is the authoritative input for the backend's OpenAPI/Swagger definition.

The backend-generated or repository OpenAPI document must match this contract one-to-one for:

```text
paths and HTTP methods
request schemas and required fields
security requirements
success response status/body
error status/business codes
cookie/Bearer-token behavior
public generic-response behavior
```

A mismatch between implementation/OpenAPI and this frozen contract is treated as a contract defect and must be resolved before the Authentication API is considered ready for QA execution.

---

## 27. Final Review Outcome

The final pre-backend consistency review checked:

```text
Endpoint inventory                     ✅
Request direction                      ✅
Success responses                      ✅
HTTP status / business-code direction  ✅
Account-enumeration behavior           ✅
Customer/Admin state transitions       ✅
OTP flows                              ✅
Refresh / Logout                       ✅
Password Recovery                      ✅
Admin Invitation / Promotion           ✅
Cross-flow contradictions              ✅
OpenAPI mapping direction              ✅
```

Important review fixes/additions:

```text
Added GET /admin/admin-invitations for the approved Manage Invitations UX.
Made Login error precedence consistent with the rule that wrong credentials do not expose account state.
Defined restricted passwordChangeToken transport for the bootstrap Admin.
Normalized Refresh/Logout behavior and cookie direction.
Normalized Password Reset OTP errors to avoid account-enumeration leakage.
Defined repeated/used Email Verification behavior.
Defined recoverable email-delivery-failure behavior without silently deleting created resources.
```

**Authentication API Contract v1.0 is frozen.**

Next step is not backend implementation yet. Stop and discuss the backend architecture/implementation plan with the user first.