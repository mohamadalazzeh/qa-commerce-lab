# Authentication API Contract Draft v1.0

## Status

Authentication business behavior is substantially frozen. Steps 1–3 of the pre-backend finalization are now complete:

```text
1. Admin Invitation API details ✅
2. Verification Resend details ✅
3. Authentication DB relationship / transaction review ✅
```

The remaining step is a final API-contract consistency/OpenAPI review with the user before freezing the module.

Detailed QA Test Cases remain intentionally deferred until the backend is implemented and Postman/PostgreSQL/Mailpit execution begins.

**Important:** Do not start backend implementation until the user and assistant explicitly discuss the backend plan after the final Authentication contract review.

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
POST /api/v1/auth/admin-invitations/inspect
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

Backend assigns:

```text
role = CUSTOMER
status = PENDING_VERIFICATION
```

The caller cannot assign `role` or `status`.

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
Missing/invalid field       → 400 / VALIDATION_ERROR
Unexpected privileged field → 400 / VALIDATION_ERROR
Duplicate email             → 409 / EMAIL_ALREADY_REGISTERED
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

The raw verification token is sent by email; only its hash is persisted.

```text
Valid latest token within 24 hours
→ PENDING_VERIFICATION → ACTIVE
→ token used_at = NOW
→ 200 OK
```

```json
{
  "message": "Email verified successfully."
}
```

Verification does not log the Customer in. The frontend proceeds to Login.

```text
Missing token              → 400 / VALIDATION_ERROR
Expired token              → 400 / VERIFICATION_TOKEN_EXPIRED
Invalid/revoked/old token  → 400 / INVALID_VERIFICATION_TOKEN
```

---

## 3. Verification Resend — Frozen

```http
POST /api/v1/auth/resend-verification
```

```text
Verification link lifetime = 24 hours
Resend cooldown            = 60 seconds
```

Exactly one of `email` or `token` is accepted.

### A. Email-driven flow

Used after Registration or after a correct Login attempt for a `PENDING_VERIFICATION` Customer. The frontend already has the email as temporary flow state.

```json
{
  "email": "user@example.com"
}
```

The public response does not reveal whether the submitted email belongs to an account.

Successful/generic response:

```text
200 OK
```

```json
{
  "message": "If an eligible unverified account exists, a verification email has been sent."
}
```

The same public `200` response is used when the email is unknown, already verified, or belongs to a disabled account; no email is sent for those ineligible states.

The 60-second cooldown is enforced uniformly for every syntactically valid normalized email input, including unknown emails. This prevents the cooldown response itself from becoming an account-enumeration signal.

```text
Within cooldown → 429 / VERIFICATION_RESEND_COOLDOWN
Retry-After header where practical
```

For a real pending account, Registration / Login-verification flow starts the same cooldown window when the verification email is issued.

### B. Expired-token flow

```json
{
  "token": "<expired-verification-token>"
}
```

The token may be expired for activation while still identifying the original pending account.

```text
Eligible pending account     → 200; new email/link sent
Within 60-second cooldown    → 429 / VERIFICATION_RESEND_COOLDOWN
Invalid/random/old token     → 400 / INVALID_VERIFICATION_TOKEN
Already verified             → 409 / EMAIL_ALREADY_VERIFIED
Disabled identified account  → 403 / ACCOUNT_DISABLED
```

Success response:

```json
{
  "message": "A new verification email has been sent."
}
```

Common resend rules:

```text
Successful resend            → generate a new secure token
New link lifetime            → fresh 24 hours
Previous token               → revoked immediately
Only newest link             → may activate the account
Frontend cooldown            → UX only; backend is authoritative
Both email + token           → 400 / VALIDATION_ERROR
Neither email nor token      → 400 / VALIDATION_ERROR
```

---

## 4. Login — Frozen

```http
POST /api/v1/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "Example@123"
}
```

```text
Invalid email/password                     → 401 / INVALID_CREDENTIALS
Correct credentials + PENDING_VERIFICATION → 403 / EMAIL_VERIFICATION_REQUIRED
Correct credentials + DISABLED             → 403 / ACCOUNT_DISABLED
Temporary account lock active              → 423 / ACCOUNT_LOCKED
Rate limit exceeded                         → 429 / RATE_LIMIT_EXCEEDED
```

Wrong credentials never reveal account existence or account state.

Customer:

```text
ACTIVE + valid credentials
→ Access Token + Refresh Token
→ no OTP in V1
```

Admin:

```text
ACTIVE + valid credentials
→ no normal Access/Refresh yet
→ create Admin Login OTP challenge
→ send OTP
→ return challengeId
```

Conceptual Admin response:

```json
{
  "requiresTwoFactor": true,
  "challengeId": "<challenge-id>"
}
```

---

## 5. Login Protection — Frozen

Account Lockout applies to Customer and Admin password authentication:

```text
5 consecutive failed passwords
→ temporary lock for 15 minutes
→ correct password is still rejected while lock is active
```

A successful password authentication before the fifth failure resets the consecutive-failure counter.

Persistent account-security state:

```text
users.failed_login_attempts
users.locked_until
```

`DISABLED` is a business state and is separate from the temporary security lock.

Rate-limit baseline:

```text
Per account/email → 10 Login requests / minute
Per source IP     → 60 Login requests / minute
Exceeded          → 429 Too Many Requests
```

Rate-limit counters are implementation/runtime state and are expected in Redis rather than PostgreSQL. Thresholds are configurable.

---

## 6. Admin Login OTP — Frozen

Persistent PostgreSQL table:

```text
admin_login_otp_challenges
```

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

Rules:

```text
OTP format                 → 6 digits
Validity                   → 5 minutes
Maximum wrong attempts     → 5 per challenge
Resend cooldown            → 60 seconds
One-time use               → yes
Newest OTP only            → yes
Resend challengeId         → same challengeId
Resend resets attempts     → no
```

A new full Admin Login revokes a previous still-active Admin Login challenge for that Admin.

Verify:

```http
POST /api/v1/auth/admin-otp/verify
```

```json
{
  "challengeId": "<challenge-id>",
  "otp": "482913"
}
```

```text
Invalid request fields       → 400 / VALIDATION_ERROR
Wrong OTP                    → 401 / INVALID_OTP; attempt_count + 1
Expired OTP                  → 401 / OTP_EXPIRED
Attempts exhausted           → 423 / OTP_CHALLENGE_LOCKED
Already-used challenge       → 409 / OTP_CHALLENGE_ALREADY_USED
Valid OTP                    → used_at = NOW; authentication continues
```

Five wrong OTP attempts invalidate only the challenge. The Admin account is not disabled or password-locked.

Resend:

```http
POST /api/v1/auth/admin-otp/resend
```

```json
{
  "challengeId": "<challenge-id>"
}
```

```text
Before 60 seconds → 429 / OTP_RESEND_COOLDOWN + Retry-After
After 60 seconds  → same challengeId, new OTP, fresh 5-minute expiry
Old OTP           → invalid immediately
attempt_count     → unchanged
```

A used/revoked/max-attempt challenge cannot be revived.

Concurrent verification must be atomic so the same one-time challenge cannot succeed twice.

---

## 7. First Bootstrap Admin — Frozen

The initial Admin is created through secure operator bootstrap, not public registration.

```text
role = ADMIN
status = ACTIVE
must_change_password = true
```

First login:

```text
Email + Temporary Password
→ Admin OTP
→ OTP verified
→ no normal Admin session yet
→ issue restricted passwordChangeToken
→ mandatory password replacement
→ must_change_password = false
→ issue Access + Refresh
```

`passwordChangeToken`:

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

The new password must satisfy the normal password policy and must differ from the current temporary password. Success replaces the same `users.password_hash`.

---

## 8. Admin Invitation — Frozen

Only an authenticated `ADMIN` may create, resend, or cancel Admin invitations. There is no public Admin registration endpoint.

Persistent table:

```text
admin_invitations
```

### 8.1 Create Invitation

```http
POST /api/v1/admin/admin-invitations
Authorization: Bearer <admin-access-token>
```

```json
{
  "firstName": "Ahmad",
  "lastName": "Saleh",
  "email": "ahmad@example.com"
}
```

For a new email, the invitation stores the supplied names until acceptance creates the user. For an existing Customer, the existing `users` record remains authoritative; invitation data must never overwrite the Customer profile.

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

Rules/errors:

```text
Invalid request data                    → 400 / VALIDATION_ERROR
Unauthenticated                         → 401
Authenticated but not ADMIN             → 403
Email already belongs to ADMIN          → 409 / ADMIN_ALREADY_EXISTS
PENDING invitation already exists       → 409 / ADMIN_INVITATION_ALREADY_PENDING
EXPIRED invitation exists               → 409 / ADMIN_INVITATION_REQUIRES_RESEND
Existing PENDING_VERIFICATION Customer   → 409 / ADMIN_PROMOTION_NOT_ALLOWED
Existing DISABLED Customer               → 409 / ADMIN_PROMOTION_NOT_ALLOWED
```

A `CANCELLED` historical invitation does not prevent a later fresh invitation. A used invitation normally corresponds to an account that is already Admin and is therefore blocked by `ADMIN_ALREADY_EXISTS`.

For an existing `ACTIVE` Customer, create a promotion invitation linked to the same `user_id`; do not change the role yet.

### 8.2 Inspect Invitation

Used by the future frontend to decide whether the invitee must set a password.

```http
POST /api/v1/auth/admin-invitations/inspect
```

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

No email or private account details are returned. The token is high-entropy and is supplied in the request body rather than a backend URL path.

```text
Invalid/revoked/random token → 400 / INVALID_ADMIN_INVITATION_TOKEN
Expired invitation           → 400 / ADMIN_INVITATION_EXPIRED
Used invitation              → 409 / ADMIN_INVITATION_ALREADY_USED
Cancelled invitation         → 409 / ADMIN_INVITATION_CANCELLED
```

### 8.3 Resend Invitation

```http
POST /api/v1/admin/admin-invitations/{invitationId}/resend
Authorization: Bearer <admin-access-token>
```

Allowed for `PENDING` after cooldown and for `EXPIRED` invitations.

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

Behavior:

```text
Same invitation row                    → reused
New token                              → generated
Previous token                         → invalid immediately
expires_at                             → NOW + 24 hours
status                                 → PENDING
Resend cooldown                        → 60 seconds
Within cooldown                        → 429 / ADMIN_INVITATION_RESEND_COOLDOWN
Invitation not found                   → 404 / ADMIN_INVITATION_NOT_FOUND
USED                                   → 409 / ADMIN_INVITATION_ALREADY_USED
CANCELLED                              → 409 / ADMIN_INVITATION_CANCELLED
Target already ADMIN                   → 409 / ADMIN_ALREADY_EXISTS
Target Customer no longer ACTIVE       → 409 / ADMIN_PROMOTION_NOT_ALLOWED
```

If a formerly-new invitee email now belongs to an `ACTIVE` Customer, the resend/accept flow may link the invitation to that Customer and continue as a promotion without creating a duplicate user.

### 8.4 Cancel Invitation

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

```text
PENDING → CANCELLED
current token → unusable
record → retained for audit/history
not found → 404 / ADMIN_INVITATION_NOT_FOUND
already cancelled → 409 / ADMIN_INVITATION_CANCELLED
already used → 409 / ADMIN_INVITATION_ALREADY_USED
```

Expired invitations are already unusable and do not require cancellation.

### 8.5 Accept Invitation

```http
POST /api/v1/auth/admin-invitations/accept
```

New-person invitation:

```json
{
  "token": "<invitation-token>",
  "newPassword": "Strong@123"
}
```

Existing-Customer promotion:

```json
{
  "token": "<invitation-token>"
}
```

For a new person, `newPassword` is required and must satisfy the standard password policy. For an existing Customer promotion, the existing password is preserved and a new password is not requested.

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
validate invitation
→ create users row with role=ADMIN, status=ACTIVE
→ mark invitation USED
→ next step is normal Admin Login + OTP
```

Existing `ACTIVE` Customer:

```text
validate invitation
→ same users row
→ CUSTOMER → ADMIN
→ same user_id / password_hash / historical orders and data
→ revoke all current Customer sessions
→ mark invitation USED
→ next Login requires Admin password + OTP
```

At acceptance time, the backend re-resolves the invitation email to prevent duplicates. If a new-person invite email has since become an `ACTIVE` Customer, acceptance switches safely to promotion semantics; `PENDING_VERIFICATION` or `DISABLED` state is rejected with `409 / ADMIN_PROMOTION_NOT_ALLOWED`.

Other acceptance errors:

```text
Invalid/revoked/random token → 400 / INVALID_ADMIN_INVITATION_TOKEN
Expired invitation           → 400 / ADMIN_INVITATION_EXPIRED
Used invitation              → 409 / ADMIN_INVITATION_ALREADY_USED
Cancelled invitation         → 409 / ADMIN_INVITATION_CANCELLED
Weak/missing password when required → 400 / VALIDATION_ERROR
```

Invitation acceptance is transactional and concurrency-safe: two simultaneous accepts cannot both create/promote a user.

---

## 9. Session / Refresh / Logout — Frozen

```text
Access Token lifetime  → 15 minutes
Refresh Token lifetime → 7 days
```

Access Token is a Bearer token. Refresh Token is held in an `HttpOnly`, `Secure` cookie. SameSite/CSRF configuration is finalized against the frontend/deployment origin model during the final consistency pass.

Persistent PostgreSQL tables:

```text
auth_sessions
refresh_tokens
```

Raw Refresh Tokens are never stored; only a verifier/hash is persisted.

Refresh:

```http
POST /api/v1/auth/refresh
```

```text
validate Refresh cookie + session + current user state
→ old Refresh becomes used/invalid
→ issue new Access
→ issue rotated Refresh
```

Reuse of an already-rotated Refresh Token returns generic `401 / INVALID_REFRESH_TOKEN` behavior and revokes the associated session.

A `DISABLED` account cannot refresh. Customer→Admin promotion revokes existing Customer sessions before the next Admin Login.

Logout:

```http
POST /api/v1/auth/logout
```

```text
current session only
→ auth_sessions.revoked_at = NOW
→ associated Refresh Tokens revoked
→ Refresh cookie cleared
→ 204 No Content
```

---

## 10. Password Recovery / Reset — Frozen

### Start Recovery

```http
POST /api/v1/auth/forgot-password
```

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

Eligible:

```text
ACTIVE Customer ✅
ACTIVE Admin ✅
PENDING_VERIFICATION Customer ✅
DISABLED account ❌ no challenge/email; same generic public response
Unknown email ❌ no challenge/email; same generic public response
```

A pending Customer remains `PENDING_VERIFICATION` after password reset.

Persistent table:

```text
password_reset_challenges
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

At five wrong attempts, only the Reset challenge is invalidated.

### Resend Recovery OTP

```http
POST /api/v1/auth/password-reset/resend
```

```json
{
  "email": "user@example.com"
}
```

The public response remains generic for eligible, unknown, disabled, and per-account-cooldown states. Internally, a new OTP is sent only when the account is eligible and cooldown has passed. General source-IP abuse controls may still return `429` independently.

Successful resend invalidates the previous OTP, starts a fresh 5-minute OTP lifetime, and preserves `attempt_count`.

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

Invalid/unknown combinations use generic invalid-OTP behavior.

Valid OTP:

```text
challenge becomes used/verified
→ issue one-time resetToken
```

Persistent table:

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

```text
validate resetToken
→ validate password policy
→ reject same-as-current password
→ replace users.password_hash
→ mark resetToken used
→ revoke ALL sessions and Refresh Tokens
→ no auto-login
→ return to Login
```

No full password history is maintained in V1; only reuse of the current password is rejected. Admins still complete Admin Login OTP on the next sign-in.

---

## 11. Authentication Data Model / Transaction Review — Frozen Direction

Detailed table/relationship decisions are documented in:

```text
docs/business-analysis/authentication-data-model-v1.0.md
```

Persistent PostgreSQL tables in Authentication scope:

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

Runtime/ephemeral protection state such as IP/email request counters and generic unknown-email cooldown keys belongs in Redis, not PostgreSQL.

Critical operations use transactions/locking rather than relying only on UNIQUE constraints:

```text
email verification consume
verification resend token replacement
Admin invitation acceptance / promotion
OTP one-time verification
Refresh Token rotation/reuse handling
password reset + global session revocation
```

Database constraints remain a safety net for uniqueness and referential integrity.

---

## Security / Concurrency Baseline

```text
Passwords                     → strong password hash only; never log plaintext
Verification/invitation token → raw sent to user; token hash persisted
OTP                           → raw emailed; non-plaintext verifier persisted; never log raw OTP
Refresh/Reset tokens          → raw held by client; hash persisted
One-time operations           → transaction/row locking or atomic conditional update
Email uniqueness              → normalized, case-insensitive UNIQUE constraint
```

---

## Current Contract Review Position

Completed before final consistency review:

```text
Customer Registration ✅
Email Verification + Resend ✅
Login states / Lockout / Rate Limit ✅
Admin Login OTP ✅
First Admin forced password change ✅
Admin Invitation / Resend / Cancel / Accept / Promotion ✅
Session / Refresh / Logout ✅
Password Recovery / Reset ✅
Authentication DB model / relationships / transactions ✅
```

Remaining:

```text
4. Final API Contract consistency review with the user:
   - endpoint inventory
   - request/response schemas
   - HTTP status + business error codes
   - cross-flow contradictions
   - OpenAPI alignment

Then:
Authentication Contract = FROZEN
→ STOP
→ discuss backend implementation plan with the user
→ only then begin backend implementation
```