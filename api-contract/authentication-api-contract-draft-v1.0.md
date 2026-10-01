# Authentication API Contract Draft v1.0

## Status

This is the current API-contract working draft for the Authentication module.

Authentication business behavior is frozen at a high level. Exact request/response bodies and final error schemas will be reviewed endpoint-by-endpoint before backend implementation.

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

User-facing behavior:

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

Role assignment is controlled by the trusted backend invitation workflow; the invitee does not submit a generic `role = ADMIN` field.

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

The Authentication API should therefore remain frontend-ready:

- stable business/error codes for UI routing;
- clear success/failure responses;
- backend remains the source of truth for business/security rules;
- invitation, verification, OTP and mandatory-password-change flows must map cleanly to future UI screens;
- OpenAPI must remain aligned with the implementation.

Potential later phase:

```text
Backend/API complete
→ Frontend implementation
→ UI functional testing
→ API/UI integration testing
→ End-to-End testing
→ Cross-browser / responsive testing
→ Regression
```

---

## Next Contract Review

Start with:

```text
POST /api/v1/auth/login
```

For each endpoint freeze only what is needed for implementation:

```text
Request
→ Success Response
→ Error Codes
→ HTTP Status
```

After the Authentication API/OpenAPI contract is frozen, proceed to backend implementation.