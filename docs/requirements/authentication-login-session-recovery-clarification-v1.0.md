# Authentication — Login, Session, and Recovery Clarification v1.0

## Purpose

This clarification freezes the Version 1 behavior for Login, Account Lockout, Rate Limiting, Administrator email OTP, Refresh Token, Logout, and Password Recovery.

Detailed Test Cases are intentionally deferred until the backend is implemented and practical execution begins with Postman and PostgreSQL.

---

## 1. Customer Login

Conceptual endpoint:

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

Approved behavior:

- `ACTIVE` Customer + valid credentials + no active temporary lock + no active rate limit → successful login.
- Successful Customer login issues an Access Token and Refresh Token immediately.
- Customer Login does not require OTP in the normal Version 1 flow.
- Invalid email and invalid password must return the same generic authentication failure so the API does not reveal which credential is incorrect.
- A `PENDING_VERIFICATION` account with correct credentials is rejected with a business result such as `EMAIL_VERIFICATION_REQUIRED`.
- A `DISABLED` account with correct credentials is rejected with a business result such as `ACCOUNT_DISABLED`.
- A wrong password must not reveal that the account is pending verification or disabled.

Baseline status behavior:

```text
Successful Customer login                      → 200 OK
Invalid email or password                      → 401 Unauthorized
Correct credentials + PENDING_VERIFICATION     → 403 Forbidden / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED                 → 403 Forbidden / ACCOUNT_DISABLED
Temporary account lock active                  → 423 Locked
Login rate limit exceeded                      → 429 Too Many Requests
```

---

## 2. Login Account Lockout

Account Lockout applies to both `CUSTOMER` and `ADMIN` credential authentication.

Approved rule:

```text
5 consecutive failed password attempts
→ account temporarily locked for 15 minutes
```

Rules:

- A successful login before the fifth failure resets the failed-attempt counter to zero.
- During the active 15-minute lock, the login is rejected even if the correct password is supplied.
- After lock expiry, a new login attempt is allowed and a new failed-attempt sequence may begin.
- Temporary lock state is separate from the business account status `DISABLED`.

Conceptual persistence fields:

```text
failed_login_attempts
locked_until
```

---

## 3. Login Rate Limiting

Rate Limiting protects the Login endpoint from excessive request volume and is separate from Account Lockout.

The project must not rely on IP-only limiting as the sole control.

Approved layered Version 1 baseline:

```text
Per account/email login-request limit
→ 10 requests per minute

Per source IP login-request limit
→ 60 requests per minute

Threshold exceeded
→ 429 Too Many Requests
→ include Retry-After where practical
```

The account/email and IP thresholds should be configurable rather than hard-coded.

Reason for the higher source-IP threshold: multiple legitimate users may share the same network or NAT.

---

## 4. Administrator Login and Email OTP

Administrator Login uses the same password lockout and Login Rate Limiting protections as Customer Login, plus a mandatory second authentication step.

Approved flow:

```text
Admin enters email + password
→ Login rate limiting applies
→ Account Lockout rules apply
→ credentials valid
→ generate 6-digit email OTP
→ create OTP challenge
→ send OTP to Admin email
→ do NOT issue normal Access/Refresh tokens yet
→ Admin submits OTP
→ OTP validated
→ authentication continues
```

Approved Admin Login OTP rules:

```text
Format                 → 6 digits
Validity               → 5 minutes
Maximum failed attempts→ 5
Resend cooldown        → 60 seconds
New OTP                → immediately invalidates previous OTP
Usage                   → one-time only
```

After five incorrect OTP submissions:

```text
Current OTP challenge invalidated
→ no normal session/tokens issued
→ Admin must begin a new authentication attempt
```

The account must not be changed to `DISABLED` merely because the OTP challenge reached its failed-attempt limit.

OTP values should not be stored in plaintext when avoidable; a hash/challenge representation should be stored.

---

## 5. First Administrator Temporary Password

The initial Administrator is created through secure bootstrap/seed with a temporary password.

This special first-login behavior applies only to the bootstrap Admin.

User-facing flow:

```text
Email + Temporary Password
→ Admin Email OTP
→ OTP verified
→ Login authentication is accepted
→ mandatory Change Password screen is shown
→ Current Password + New Password + Confirm New Password
→ password changed successfully
→ temporary password becomes invalid
→ normal privileged Admin session may begin
```

The initial Admin must not be able to bypass the mandatory password change and use normal privileged functionality while the temporary password is still active.

A backend flag such as the following may enforce the rule:

```text
must_change_password = true
```

After successful password replacement:

```text
must_change_password = false
```

Additional invited Admins do not use this temporary-password flow because they choose their own password when accepting the invitation.

---

## 6. Additional Administrator Login

An invited Administrator completes account creation by accepting a valid invitation and choosing a password.

Later normal login is:

```text
Email + Password
→ Email OTP
→ OTP verified
→ Access Token + Refresh Token
→ Admin Dashboard / privileged functionality
```

No forced first-login password replacement is required for invited Admins unless a future requirement explicitly adds it.

---

## 7. Access and Refresh Tokens

Approved lifetimes:

```text
Access Token  → 15 minutes
Refresh Token → 7 days
```

Refresh flow:

```text
Valid Refresh Token submitted
→ backend validates token/session/account state
→ old Refresh Token invalidated
→ new Access Token issued
→ new Refresh Token issued
```

This is Refresh Token Rotation.

Rules:

- A used/rotated Refresh Token must not remain valid.
- A `DISABLED` account cannot obtain new tokens through refresh.
- Session/token invalidation rules must be enforceable server-side.

---

## 8. Logout

Conceptual endpoint:

```http
POST /api/v1/auth/logout
```

Logout applies to both Customer and Admin sessions.

Approved behavior:

```text
Logout
→ current session invalidated
→ current Refresh Token invalidated
→ user must authenticate again to establish a new session
```

The implementation may use session state / Redis or equivalent server-side revocation state so that logout is enforceable.

---

## 9. Password Recovery

Password Recovery is separate from Customer email verification and separate from Admin Login OTP.

It applies to both Customer and Admin accounts that are allowed to recover their password.

Conceptual start endpoint:

```http
POST /api/v1/auth/forgot-password
```

The public response should be generic, for example:

```text
If an account exists for this email, a verification code has been sent.
```

This reduces account-enumeration risk.

If an eligible account exists, the backend sends a 6-digit Password Recovery OTP.

Approved Password Recovery OTP rules:

```text
Format                  → 6 digits
Validity                → 5 minutes
Maximum failed attempts → 5
Resend cooldown         → 60 seconds
New OTP                 → previous OTP invalid immediately
Usage                    → one-time only
```

After successful OTP verification, the user may set a new password that satisfies the password policy.

After password reset:

```text
Old password invalid
→ existing sessions invalidated
→ existing Refresh Tokens invalidated
→ user signs in again using the new password
```

For Admin accounts, a later normal login still requires the mandatory Admin email OTP second step.

---

## 10. Frontend-Ready API Principle

The current project is backend/API-first, but Version 1 API behavior should remain suitable for an optional future frontend phase.

Therefore:

- Business errors should use stable machine-readable codes where appropriate.
- Frontend redirection decisions should be based on API results, not hidden business logic in the UI.
- The backend remains the source of truth for security and business rules.
- Admin Invitation, Email Verification, Password Change, Login OTP, and Password Recovery flows should be implementable as real frontend screens later without redesigning the backend contract.

---

## 11. Next Delivery Step

Authentication business behavior is now sufficiently frozen for high-level QA scenario/UAT documentation and API contract implementation.

Next sequence:

```text
Authentication Test Scenarios + UAT
→ OpenAPI / Swagger contract
→ Backend implementation
→ Postman Test Cases and execution
→ SQL validation
→ Defects / Retest / Regression
```
