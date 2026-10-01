# QA Commerce Lab — Current Checkpoint

## How to Resume in a New Chat

Use this file together with `docs/project-management/project-continuity.md` as the source of truth for project continuity.

Suggested message:

> Continue my QA Commerce Lab project from GitHub repository `mohamadalazzeh/qa-commerce-lab`. Read `docs/project-management/project-continuity.md` and `docs/project-management/current-checkpoint.md` first. Continue the Authentication API-contract review endpoint-by-endpoint. Customer Registration and Email Verification are frozen; continue from Resend Verification. Keep it fast-track and practical. Do not start backend implementation until I explicitly discuss it first.

---

## Current Module Status

Authentication requirements/business behavior are substantially complete. Current work is the **Authentication API Contract** before backend implementation.

Detailed Test Cases remain deferred until the backend exists and Postman/PostgreSQL execution begins.

Current delivery strategy:

```text
Requirements
→ Business Rules / Clarifications
→ API Contract
→ Test Scenarios / UAT
→ Backend Implementation
→ Detailed Test Cases
→ Postman API Testing
→ SQL / DB Validation
→ Bugs
→ Retest
→ Regression
```

**Important:** Before backend implementation begins, stop and discuss the backend plan with the user first.

---

## Authentication API Contract — Current Position

Frozen in endpoint-by-endpoint review:

```text
Customer Registration ✅
Customer Email Verification ✅
Verification link lifetime = 24 hours ✅
Customer verification resend cooldown = 60 seconds ✅
Expired-link Resend UX ✅
Resend success = 200 OK ✅
```

Next immediate task:

```text
POST /api/v1/auth/resend-verification
→ freeze cooldown error response/status code
```

Then continue through Admin provisioning, Login, Admin OTP, temporary-password change, Refresh, Logout, and Password Recovery/Reset.

---

## Frozen Customer Registration Contract

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

Backend assigns:

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

No Access/Refresh Tokens are issued.

Baseline errors:

```text
Missing required field          → 400 / VALIDATION_ERROR
Invalid email                   → 400 / VALIDATION_ERROR
Invalid name                    → 400 / VALIDATION_ERROR
Weak password                   → 400 / VALIDATION_ERROR
Unexpected privileged field     → 400 / VALIDATION_ERROR
Duplicate email                 → 409 / EMAIL_ALREADY_REGISTERED
```

---

## Frozen Customer Email Verification Contract

```http
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "token": "<verification-token>"
}
```

Valid latest token within 24 hours:

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

Verification does not log the Customer in and does not issue Access/Refresh Tokens.

Error direction:

```text
Missing token                 → 400 / VALIDATION_ERROR
Expired token                 → 400 / VERIFICATION_TOKEN_EXPIRED
Invalid/revoked/old token     → 400 / INVALID_VERIFICATION_TOKEN
```

Expired is intentionally distinguishable so a future frontend can guide the Customer to request a replacement link.

---

## Frozen Verification Resend Behavior

The project distinguishes **verification-link lifetime** from **resend cooldown**:

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
```

The 60-second cooldown does not expire the verification link. It only controls when another verification email may be requested.

User experience:

```text
Verification email sent
→ Resend button disabled for 60 seconds
→ after 60 seconds, button becomes enabled if account is still PENDING_VERIFICATION
```

If the Customer opens an expired verification link:

```text
verify-email returns VERIFICATION_TOKEN_EXPIRED
→ frontend shows "Verification link expired"
→ frontend shows [Resend Verification Email]
→ Customer clicks only
→ Customer does not type the email again
→ backend resolves the existing pending account from token/context
→ replacement email goes to the email already stored on that account
```

Conceptual resend request:

```http
POST /api/v1/auth/resend-verification
```

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
  "message": "A new verification email has been sent."
}
```

Rules:

```text
Before 60 seconds
→ frontend keeps button disabled
→ backend must also reject direct API attempts

After 60 seconds
→ resend allowed while account remains PENDING_VERIFICATION
→ new verification token generated
→ new link valid for 24 hours
→ previous verification token invalid immediately
→ only newest link can activate account
→ same Customer account remains
→ no duplicate account
```

Frontend disabling is not sufficient security/business enforcement because a caller can use Postman/curl directly.

The exact status/code for a resend during the 60-second cooldown is the next contract decision.

---

## Frozen Login / Session Security Summary

Customer normal login:

```text
ACTIVE + valid credentials
→ Access + Refresh
→ no OTP in Version 1
```

Admin login:

```text
Email + Password
→ Admin Email OTP
→ OTP verification
→ then authentication completes
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

Account Lockout for Customer and Admin:

```text
5 consecutive failed passwords
→ temporary lock 15 minutes
```

Login Rate Limiting:

```text
Per account/email → 10 requests/minute
Per source IP     → 60 requests/minute
Exceeded          → 429
```

`DISABLED` remains separate from temporary lock state.

---

## First Admin Special Flow

Only the bootstrap Admin begins with a temporary password.

```text
Email + Temporary Password
→ Admin Email OTP
→ OTP verified
→ mandatory Change Password screen
→ Current Password + New Password + Confirm New Password
→ temporary password invalidated
→ must_change_password = false
→ normal privileged session
```

Invited Admins choose their password during invitation acceptance and do not use this forced first-password-change flow.

---

## Refresh / Logout / Recovery Summary

```text
Access Token  → 15 minutes
Refresh Token → 7 days + rotation
Logout        → current session/refresh invalidated
```

Password Recovery applies to Customer and Admin:

```text
6-digit OTP
5-minute lifetime
5 failed attempts
60-second resend cooldown
newest OTP only
one-time use
```

Successful password reset invalidates old password, existing sessions, and existing Refresh Tokens. Admin still completes normal Admin Login OTP on the next sign-in.

---

## Frontend Future Option

Frontend is optional later, but APIs should remain frontend-ready with stable business/error codes and flows that can map cleanly to UI screens.