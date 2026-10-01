# QA Commerce Lab — Current Checkpoint

## How to Resume in a New Chat

Use this file together with `docs/project-management/project-continuity.md` as the source of truth for project continuity.

Suggested message:

> Continue my QA Commerce Lab project from GitHub repository `mohamadalazzeh/qa-commerce-lab`. Read `docs/project-management/project-continuity.md` and `docs/project-management/current-checkpoint.md` first. Authentication requirements are now frozen at a high level. Continue from the Authentication OpenAPI/API-contract phase. Keep the work fast-track, practical and company-like. Detailed Test Cases remain postponed until the backend is implemented and Postman execution begins.

---

## Current Module Status

**Authentication requirements / business behavior: substantially complete.**

Completed and documented:

```text
Customer Registration ✅
Email Verification ✅
Resend Verification ✅
First Admin Bootstrap ✅
Additional Admin Invitation ✅
Customer Login ✅
Admin Login + Email OTP ✅
Account Lockout ✅
Login Rate Limiting ✅
First Admin Forced Password Change ✅
Refresh Token ✅
Logout ✅
Password Recovery OTP ✅
Password Reset ✅
Authentication Test Scenarios ✅
Authentication UAT ✅
```

Dedicated documents:

```text
docs/requirements/authentication-login-session-recovery-clarification-v1.0.md
qa/test-scenarios/authentication-test-scenarios-v1.0.md
qa/uat/authentication-uat-v1.0.md
```

Detailed Test Cases are still intentionally deferred until the backend exists and practical Postman/PostgreSQL execution begins.

---

## Frozen Login Behavior

### Customer

```text
ACTIVE + valid credentials
+ no temporary lock
+ no active rate limit
→ 200 OK
→ Access Token + Refresh Token
→ normal application access
```

Normal Customer Login does not require OTP in Version 1.

```text
Invalid email/password                    → 401 Unauthorized
Correct credentials + PENDING_VERIFICATION→ 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED            → 403 / ACCOUNT_DISABLED
Temporary account lock active             → 423 Locked
Rate limit exceeded                        → 429 Too Many Requests
```

Wrong credentials must not disclose account state.

### Admin

```text
Email + Password
→ same Login Rate Limiting as Customer
→ same Account Lockout protection as Customer
→ if credentials valid, send 6-digit Email OTP
→ no normal Access/Refresh tokens yet
→ OTP verified
→ authentication continues
```

Admin Login OTP:

```text
6 digits
5-minute lifetime
5 failed attempts maximum
60-second resend cooldown
newest OTP only
one-time use
```

After five wrong OTP attempts, the current OTP challenge is invalidated. The Admin account is not changed to `DISABLED` merely because the OTP challenge failed.

---

## Frozen Login Protection

Account Lockout applies to both Customer and Admin password authentication:

```text
5 consecutive failed password attempts
→ temporary lock for 15 minutes
```

Successful authentication before the fifth failure resets the failed-attempt sequence.

Rate Limiting is separate from Account Lockout:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
Exceeded          → 429 Too Many Requests
Retry-After       → include where practical
```

The project does not rely on IP-only limiting as the sole control. Thresholds must be configurable rather than hard-coded.

`DISABLED` is a business/account status and is not used to represent temporary security lock state.

---

## First Admin Special Flow

Only the bootstrap Admin begins with a temporary password.

User-facing first-login flow:

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

The Admin must not access normal privileged functionality before completing the mandatory password replacement.

Additional invited Admins choose their own password during invitation acceptance and therefore do not use this forced temporary-password flow.

---

## Refresh Token

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Refresh uses rotation:

```text
Valid Refresh Token
→ old Refresh Token invalidated
→ new Access Token
→ new Refresh Token
```

A used/rotated Refresh Token cannot be reused. A `DISABLED` account cannot refresh its session.

---

## Logout

Logout applies to Customer and Admin:

```text
Logout
→ current session invalidated
→ current Refresh Token invalidated
→ full authentication required for a new session
```

Server-side session/revocation state may use Redis or equivalent implementation support.

---

## Password Recovery

Password Recovery applies to Customer and Admin and is separate from Customer Email Verification and Admin Login OTP.

Public recovery response should be generic to reduce account-enumeration risk.

Password Recovery OTP:

```text
6 digits
5-minute lifetime
5 failed attempts maximum
60-second resend cooldown
newest OTP only
one-time use
```

Successful password reset:

```text
old password invalid
→ existing sessions invalidated
→ existing Refresh Tokens invalidated
→ user signs in again with new password
```

Admin users still complete normal Admin Email OTP during the next Login.

---

## Frontend Future Option

A frontend is not part of the current required implementation phase, but the backend/API should remain frontend-ready.

Potential later phase:

```text
Backend/API complete
→ Frontend implementation
→ UI functional testing
→ API/UI integration testing
→ End-to-End testing
→ browser/responsive testing
→ regression
```

API responses should therefore use stable business/error codes that a future UI can route on, while the backend remains the source of truth for business and security rules.

---

## Current QA Working Style

Fast-track sequence:

```text
Requirement
→ Business Rule
→ Clarification
→ API Behavior
→ Test Scenario
→ UAT
```

Later, after backend implementation:

```text
Detailed Test Cases
→ Postman execution
→ SQL / DB validation
→ Defects
→ Retest
→ Regression
```

Do not spend extended time on Decision Tables or other test-design techniques unless needed to clarify a requirement; deeper technique practice can be done later against the finished project.

---

## Immediate Next Step

Move to the **Authentication OpenAPI / API Contract** and freeze the exact endpoints, request/response bodies, error schema and status codes needed by the backend implementation.

Then:

```text
Authentication OpenAPI Contract
→ Backend implementation
→ Postman Test Cases
→ PostgreSQL validation
→ defect/retest/regression cycle
```
