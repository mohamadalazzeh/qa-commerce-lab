# Authentication Test Scenarios v1.0

## Scope

High-level QA Test Scenarios for the Authentication module.

This file intentionally does **not** contain detailed execution steps, test data, or per-step expected results. Detailed Test Cases are reserved for the later Postman/backend execution phase.

---

## A. Customer Registration

**TS-AUTH-REG-01** — Verify that a Customer can register with valid required data.

**TS-AUTH-REG-02** — Verify that public registration always creates a `CUSTOMER` account and does not allow the caller to assign an `ADMIN` role.

**TS-AUTH-REG-03** — Verify that successful registration creates the account in `PENDING_VERIFICATION` state.

**TS-AUTH-REG-04** — Verify that successful registration does not issue Access or Refresh Tokens before email verification.

**TS-AUTH-REG-05** — Verify validation of required First Name, Last Name, Email, and Password fields.

**TS-AUTH-REG-06** — Verify name length and supported-character rules for Arabic/English names, spaces, hyphens, and apostrophes.

**TS-AUTH-REG-07** — Verify email-format validation and case-insensitive email uniqueness.

**TS-AUTH-REG-08** — Verify password-policy enforcement.

---

## B. Customer Email Verification

**TS-AUTH-VER-01** — Verify that a newly registered Customer remains `PENDING_VERIFICATION` until email verification succeeds.

**TS-AUTH-VER-02** — Verify that a valid verification link can activate the existing account within its 24-hour lifetime.

**TS-AUTH-VER-03** — Verify that an expired verification link cannot activate the account and returns expired-link behavior.

**TS-AUTH-VER-04** — Verify that an expired verification link does not delete the Customer account.

**TS-AUTH-VER-05** — Verify that Resend Verification Email is blocked during the first 60 seconds after a verification email is issued.

**TS-AUTH-VER-06** — Verify that Resend Verification Email becomes available after the 60-second cooldown while the account remains `PENDING_VERIFICATION`.

**TS-AUTH-VER-07** — Verify that the backend rejects a direct resend API attempt during the 60-second cooldown even if the frontend button is bypassed.

**TS-AUTH-VER-08** — Verify that a successful resend invalidates the previously issued verification token immediately.

**TS-AUTH-VER-09** — Verify that the newly issued verification link receives a fresh 24-hour validity period and is the only verification link that can activate the account.

**TS-AUTH-VER-10** — Verify that an expired verification link presents a Resend Verification Email path without requiring Customer re-registration.

**TS-AUTH-VER-11** — Verify that the expired-link resend flow does not require the Customer to re-enter or change the destination email.

**TS-AUTH-VER-12** — Verify that replacing a verification link reuses the same Customer account and does not create a duplicate account.

**TS-AUTH-VER-13** — Verify that a successfully used verification link cannot be reused.

**TS-AUTH-VER-14** — Verify that the Check-your-email and pending-login flows can resend verification using the email already held by the frontend flow state.

**TS-AUTH-VER-15** — Verify that the resend endpoint rejects requests containing both `email` and `token`, or neither value.

**TS-AUTH-VER-16** — Verify that a resend attempt during cooldown returns `429 / VERIFICATION_RESEND_COOLDOWN` and retry guidance where implemented.

---

## C. First Administrator Bootstrap

**TS-AUTH-ADM-BOOT-01** — Verify that the initial Administrator can only be created through the approved bootstrap/seed process and not through public registration.

**TS-AUTH-ADM-BOOT-02** — Verify that bootstrap assigns the `ADMIN` role and does not create duplicate initial Admin accounts when run repeatedly.

**TS-AUTH-ADM-BOOT-03** — Verify that the initial Admin starts with a temporary password and is marked as requiring a password change.

**TS-AUTH-ADM-BOOT-04** — Verify that the initial Admin cannot bypass the mandatory first-login password replacement before obtaining normal privileged access.

**TS-AUTH-ADM-BOOT-05** — Verify that the temporary password becomes invalid after successful replacement.

---

## D. Additional Administrator Invitation

**TS-AUTH-ADM-INV-01** — Verify that an authenticated and authorized Admin can create an Admin invitation.

**TS-AUTH-ADM-INV-02** — Verify that a Customer cannot create an Admin invitation.

**TS-AUTH-ADM-INV-03** — Verify that unauthenticated callers cannot create an Admin invitation.

**TS-AUTH-ADM-INV-04** — Verify that a valid invitation remains usable only within its 24-hour lifetime.

**TS-AUTH-ADM-INV-05** — Verify that resending an invitation updates the same invitation record, generates a new token, and invalidates the previous token immediately.

**TS-AUTH-ADM-INV-06** — Verify that an expired, used, cancelled, revoked, or otherwise invalid invitation cannot create or promote an Admin account.

**TS-AUTH-ADM-INV-07** — Verify that accepting a valid invitation for a new email and choosing a valid password creates an `ADMIN` account.

**TS-AUTH-ADM-INV-08** — Verify that accepting an invitation does not allow the invitee to choose or manipulate the account role.

**TS-AUTH-ADM-INV-09** — Verify that only one active/PENDING invitation may exist for the same email.

**TS-AUTH-ADM-INV-10** — Verify that an invited Admin is not automatically logged in and later follows the normal Admin Login + OTP flow.

**TS-AUTH-ADM-INV-11** — Verify that a pending invitation can be cancelled and the cancelled token cannot be used.

**TS-AUTH-ADM-INV-12** — Verify that invitation resend is allowed only after its 60-second cooldown.

**TS-AUTH-ADM-INV-13** — Verify that an existing `ACTIVE` Customer can accept an Admin invitation and be promoted using the same `user_id` and account.

**TS-AUTH-ADM-INV-14** — Verify that Customer history/data remains linked to the same account after `CUSTOMER → ADMIN` promotion.

**TS-AUTH-ADM-INV-15** — Verify that Customer sessions are revoked immediately when the account is promoted to `ADMIN`.

**TS-AUTH-ADM-INV-16** — Verify that `PENDING_VERIFICATION` and `DISABLED` Customers cannot be promoted until their account state is resolved.

---

## E. Customer Login

**TS-AUTH-LOGIN-01** — Verify that an `ACTIVE` Customer with valid credentials can log in successfully and receive Access and Refresh Tokens.

**TS-AUTH-LOGIN-02** — Verify that invalid email and invalid password return the same generic `401 / INVALID_CREDENTIALS` authentication failure.

**TS-AUTH-LOGIN-03** — Verify that a `PENDING_VERIFICATION` Customer with correct credentials is prevented from normal login and receives `403 / EMAIL_VERIFICATION_REQUIRED` behavior.

**TS-AUTH-LOGIN-04** — Verify that a `PENDING_VERIFICATION` Customer with an incorrect password receives only the generic authentication failure and does not have account state disclosed.

**TS-AUTH-LOGIN-05** — Verify that a `DISABLED` account with correct credentials returns `403 / ACCOUNT_DISABLED` and cannot log in.

**TS-AUTH-LOGIN-06** — Verify that a `DISABLED` account with an incorrect password does not have disabled status disclosed before credentials are proven.

---

## F. Account Lockout

**TS-AUTH-LOCK-01** — Verify that five consecutive failed password attempts temporarily lock the account for 15 minutes.

**TS-AUTH-LOCK-02** — Verify that the correct password is rejected with `423 / ACCOUNT_LOCKED` while the temporary lock is active.

**TS-AUTH-LOCK-03** — Verify that a new login attempt is allowed after the 15-minute lock expires.

**TS-AUTH-LOCK-04** — Verify that a successful password authentication before the fifth failure resets the consecutive-failure counter.

**TS-AUTH-LOCK-05** — Verify that temporary Login lock state does not change the account business status to `DISABLED`.

**TS-AUTH-LOCK-06** — Verify that Account Lockout behavior applies to both Customer and Admin password authentication.

---

## G. Login Rate Limiting

**TS-AUTH-RATE-01** — Verify that excessive Login requests for the same account/email can trigger account-level rate limiting.

**TS-AUTH-RATE-02** — Verify that excessive Login requests from the same source IP across multiple accounts can trigger source-IP rate limiting.

**TS-AUTH-RATE-03** — Verify that the Version 1 account/email baseline is 10 Login requests per minute.

**TS-AUTH-RATE-04** — Verify that the Version 1 source-IP baseline is 60 Login requests per minute.

**TS-AUTH-RATE-05** — Verify that exceeding an applicable Login rate limit returns `429 Too Many Requests` and retry guidance where implemented.

**TS-AUTH-RATE-06** — Verify that Rate Limiting remains separate from Account Lockout and does not automatically set the account to `DISABLED`.

---

## H. Administrator Login OTP

**TS-AUTH-ADM-OTP-01** — Verify that a valid Admin email/password combination does not immediately issue normal Access/Refresh Tokens.

**TS-AUTH-ADM-OTP-02** — Verify that correct Admin credentials create a six-digit Login OTP challenge, send the raw OTP to the Admin email, and return a `challengeId`.

**TS-AUTH-ADM-OTP-03** — Verify that a valid Admin Login OTP can complete authentication within five minutes.

**TS-AUTH-ADM-OTP-04** — Verify that an expired Admin Login OTP returns expired-OTP behavior and cannot complete authentication.

**TS-AUTH-ADM-OTP-05** — Verify that an incorrect Admin Login OTP increments the current challenge `attempt_count` and cannot complete authentication.

**TS-AUTH-ADM-OTP-06** — Verify that the current OTP challenge becomes locked/revoked after five failed OTP attempts.

**TS-AUTH-ADM-OTP-07** — Verify that reaching the OTP failed-attempt limit does not set the Admin account to `DISABLED` or trigger the 15-minute password Account Lockout.

**TS-AUTH-ADM-OTP-08** — Verify that OTP resend before 60 seconds returns `429 / OTP_RESEND_COOLDOWN` with retry guidance where implemented.

**TS-AUTH-ADM-OTP-09** — Verify that OTP resend after 60 seconds keeps the same `challengeId`, generates a fresh OTP, and invalidates the previous OTP immediately.

**TS-AUTH-ADM-OTP-10** — Verify that OTP resend does not reset `attempt_count`.

**TS-AUTH-ADM-OTP-11** — Verify that a successfully used Admin Login OTP/challenge cannot be reused.

**TS-AUTH-ADM-OTP-12** — Verify that a `USED`, max-attempt, or revoked challenge cannot be reactivated through OTP resend.

**TS-AUTH-ADM-OTP-13** — Verify that after five wrong OTP attempts the Admin must restart full Login to obtain a new challenge.

**TS-AUTH-ADM-OTP-14** — Verify that a new full Admin Login invalidates a previous still-active Admin Login challenge for the same Admin.

**TS-AUTH-ADM-OTP-15** — Verify that concurrent verification attempts for the same one-time challenge allow at most one successful authentication.

**TS-AUTH-ADM-OTP-16** — Verify that raw Admin OTP values are not stored or exposed in application logs.

**TS-AUTH-ADM-OTP-17** — Verify that normal Login Rate Limiting and Account Lockout protections still apply to Admin password authentication before the OTP step.

---

## I. First Admin Forced Password Change

**TS-AUTH-ADM-PWD-01** — Verify that the bootstrap Admin is directed to mandatory password change after successful first Login password + OTP authentication.

**TS-AUTH-ADM-PWD-02** — Verify that normal Access/Refresh Tokens are not issued while `must_change_password` remains true.

**TS-AUTH-ADM-PWD-03** — Verify that successful OTP verification for the bootstrap Admin issues a restricted `passwordChangeToken` rather than a normal Admin session.

**TS-AUTH-ADM-PWD-04** — Verify that the restricted token can authorize only the temporary-password change operation.

**TS-AUTH-ADM-PWD-05** — Verify that the `passwordChangeToken` expires after 10 minutes and is one-time use.

**TS-AUTH-ADM-PWD-06** — Verify that the new password must satisfy the password policy and cannot equal the temporary password.

**TS-AUTH-ADM-PWD-07** — Verify that successful replacement updates the same `users.password_hash`, sets `must_change_password=false`, and invalidates the temporary password/token.

**TS-AUTH-ADM-PWD-08** — Verify that normal Access/Refresh Tokens are issued only after the required password replacement succeeds.

**TS-AUTH-ADM-PWD-09** — Verify that invited Admins do not receive this forced temporary-password flow because they choose their own password during invitation acceptance.

---

## J. Refresh Token / Session

**TS-AUTH-REFRESH-01** — Verify that a valid Refresh Token can obtain a replacement Access Token without requiring full Login again.

**TS-AUTH-REFRESH-02** — Verify that Refresh Token rotation invalidates the old Refresh Token and issues a new Refresh Token.

**TS-AUTH-REFRESH-03** — Verify that a previously rotated/used Refresh Token cannot be reused.

**TS-AUTH-REFRESH-04** — Verify that detected reuse of an already-rotated Refresh Token revokes the associated session.

**TS-AUTH-REFRESH-05** — Verify that an expired or invalid Refresh Token cannot obtain a new Access Token.

**TS-AUTH-REFRESH-06** — Verify that a `DISABLED` account cannot refresh its session.

**TS-AUTH-REFRESH-07** — Verify the approved token lifetimes: Access Token 15 minutes and Refresh Token 7 days.

**TS-AUTH-REFRESH-08** — Verify that the Refresh Token is delivered using an `HttpOnly` and `Secure` cookie rather than exposed in the normal JSON response.

**TS-AUTH-REFRESH-09** — Verify that Customer sessions are invalidated when the account is promoted to Admin and a new Admin Login + OTP is required.

---

## K. Logout

**TS-AUTH-LOGOUT-01** — Verify that an authenticated Customer can log out of the current session.

**TS-AUTH-LOGOUT-02** — Verify that an authenticated Admin can log out of the current session.

**TS-AUTH-LOGOUT-03** — Verify that Logout revokes the current session and associated Refresh Tokens and clears the Refresh cookie.

**TS-AUTH-LOGOUT-04** — Verify that a logged-out session cannot be refreshed into a new authenticated session.

**TS-AUTH-LOGOUT-05** — Verify that current-session Logout does not automatically revoke other independent sessions for the same user.

---

## L. Password Recovery and Reset

**TS-AUTH-RESET-01** — Verify that Forgot Password returns the same generic public success response regardless of whether the email identifies an eligible account.

**TS-AUTH-RESET-02** — Verify that an eligible account receives a six-digit Password Recovery OTP and a persistent Reset challenge is created.

**TS-AUTH-RESET-03** — Verify that an unknown or `DISABLED` account does not receive an OTP or Reset challenge even though the public response remains generic.

**TS-AUTH-RESET-04** — Verify that a valid Password Recovery OTP can be used within five minutes.

**TS-AUTH-RESET-05** — Verify that an expired Password Recovery OTP cannot be used.

**TS-AUTH-RESET-06** — Verify that an incorrect recovery OTP increments `attempt_count` and does not expose whether the account exists.

**TS-AUTH-RESET-07** — Verify that the current Password Recovery challenge becomes invalid after five failed OTP attempts without locking or disabling the user account.

**TS-AUTH-RESET-08** — Verify that recovery OTP resend uses a generic public response for eligible, unknown, disabled, and per-account-cooldown cases so account existence is not disclosed.

**TS-AUTH-RESET-09** — Verify that after the 60-second internal cooldown, an eligible account receives a newly issued recovery OTP and the previous OTP becomes invalid immediately.

**TS-AUTH-RESET-10** — Verify that recovery OTP resend does not reset `attempt_count`.

**TS-AUTH-RESET-11** — Verify that a successfully used Password Recovery OTP cannot be reused.

**TS-AUTH-RESET-12** — Verify that concurrent verification attempts for the same recovery OTP allow at most one successful transition to the Reset Token stage.

**TS-AUTH-RESET-13** — Verify that successful recovery OTP verification issues a one-time Reset Token valid for 10 minutes.

**TS-AUTH-RESET-14** — Verify that an expired, invalid, or already-used Reset Token cannot change a password.

**TS-AUTH-RESET-15** — Verify that the new password must satisfy the approved password policy and cannot equal the current password.

**TS-AUTH-RESET-16** — Verify that successful password reset replaces the existing `users.password_hash` and invalidates the old password.

**TS-AUTH-RESET-17** — Verify that successful password reset invalidates all existing sessions and Refresh Tokens.

**TS-AUTH-RESET-18** — Verify that password reset does not auto-login the user and the user returns to normal Login.

**TS-AUTH-RESET-19** — Verify that a `PENDING_VERIFICATION` Customer may reset the password but remains `PENDING_VERIFICATION` afterward.

**TS-AUTH-RESET-20** — Verify that a Customer can sign in using the new password after reset when the account is otherwise eligible.

**TS-AUTH-RESET-21** — Verify that an Admin signing in after password reset must still complete the mandatory Admin email OTP step.

**TS-AUTH-RESET-22** — Verify that raw recovery OTP and Reset Token secrets are not stored or exposed in application logs.

---

## Notes for Later Execution Phase

When the backend is available, these scenarios will be expanded into detailed Test Cases with:

```text
Preconditions
Test Data
API Request
Execution Steps
Expected HTTP Status
Expected Response Body
Expected DB State
Expected Email/Mailpit State
Postconditions
```

Execution evidence will later be captured through Postman, PostgreSQL queries, Mailpit, defect reports, retest, and regression results.

Boundary/concurrency tests to emphasize during execution include `59s / 60s / 61s` resend timing, fifth failed attempt, old OTP after resend, OTP reuse, double submit, expired OTP, expired Reset Token, and session revocation evidence.
