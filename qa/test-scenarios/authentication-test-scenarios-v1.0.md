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

**TS-AUTH-VER-05** — Verify that Resend Verification Email is unavailable while the latest verification link is still within its 24-hour validity window.

**TS-AUTH-VER-06** — Verify that after the latest verification link expires, the Customer can request a replacement from the expired-link page without re-entering the email address.

**TS-AUTH-VER-07** — Verify that a successful resend sends the replacement link to the email already stored on the existing Customer account.

**TS-AUTH-VER-08** — Verify that the newly issued verification link receives a new 24-hour validity period and becomes the only usable verification link.

**TS-AUTH-VER-09** — Verify that a successfully used verification link cannot be reused.

**TS-AUTH-VER-10** — Verify that replacing an expired verification link does not require Customer re-registration and does not create a duplicate account.

**TS-AUTH-VER-11** — Verify that an older expired token cannot be reused to repeatedly trigger replacement emails while a newer verification link is still valid.

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

**TS-AUTH-ADM-INV-05** — Verify that a new/resend Admin invitation invalidates the previous invitation.

**TS-AUTH-ADM-INV-06** — Verify that an expired, used, revoked, or otherwise invalid invitation cannot create an Admin account.

**TS-AUTH-ADM-INV-07** — Verify that accepting a valid invitation and choosing a valid password creates an `ADMIN` account.

**TS-AUTH-ADM-INV-08** — Verify that accepting an invitation does not allow the invitee to choose or manipulate the account role.

**TS-AUTH-ADM-INV-09** — Verify that Admin invitation acceptance does not create duplicate accounts for the same email.

**TS-AUTH-ADM-INV-10** — Verify that an invited Admin receives a successful account-creation result and can later proceed to Login.

---

## E. Customer Login

**TS-AUTH-LOGIN-01** — Verify that an `ACTIVE` Customer with valid credentials can log in successfully and receive Access and Refresh Tokens.

**TS-AUTH-LOGIN-02** — Verify that invalid email and invalid password return the same generic authentication failure.

**TS-AUTH-LOGIN-03** — Verify that a `PENDING_VERIFICATION` Customer with correct credentials is prevented from normal login and receives `EMAIL_VERIFICATION_REQUIRED` behavior.

**TS-AUTH-LOGIN-04** — Verify that a `PENDING_VERIFICATION` Customer with an incorrect password receives only the generic authentication failure and does not have account state disclosed.

**TS-AUTH-LOGIN-05** — Verify that a `DISABLED` account with correct credentials cannot log in.

**TS-AUTH-LOGIN-06** — Verify that a `DISABLED` account with an incorrect password does not have disabled status disclosed before credentials are proven.

---

## F. Account Lockout

**TS-AUTH-LOCK-01** — Verify that five consecutive failed password attempts temporarily lock the account for 15 minutes.

**TS-AUTH-LOCK-02** — Verify that the correct password is rejected while the temporary lock is active.

**TS-AUTH-LOCK-03** — Verify that a new login attempt is allowed after the 15-minute lock expires.

**TS-AUTH-LOCK-04** — Verify that a successful authentication before the fifth failure resets the consecutive-failure counter.

**TS-AUTH-LOCK-05** — Verify that temporary Login lock state does not change the account business status to `DISABLED`.

**TS-AUTH-LOCK-06** — Verify that Account Lockout behavior applies to both Customer and Admin password authentication.

---

## G. Login Rate Limiting

**TS-AUTH-RATE-01** — Verify that excessive Login requests for the same account/email can trigger account-level rate limiting.

**TS-AUTH-RATE-02** — Verify that excessive Login requests from the same source IP across multiple accounts can trigger source-IP rate limiting.

**TS-AUTH-RATE-03** — Verify that the Version 1 account/email baseline is 10 Login requests per minute.

**TS-AUTH-RATE-04** — Verify that the Version 1 source-IP baseline is 60 Login requests per minute.

**TS-AUTH-RATE-05** — Verify that exceeding an applicable Login rate limit returns `429 Too Many Requests` and provides retry guidance where implemented.

**TS-AUTH-RATE-06** — Verify that Rate Limiting remains separate from Account Lockout and does not automatically set the account to `DISABLED`.

---

## H. Administrator Login OTP

**TS-AUTH-ADM-OTP-01** — Verify that a valid Admin email/password combination does not immediately issue normal Access/Refresh Tokens.

**TS-AUTH-ADM-OTP-02** — Verify that correct Admin credentials cause a six-digit Login OTP challenge to be created and sent to the Admin email.

**TS-AUTH-ADM-OTP-03** — Verify that a valid Admin Login OTP can complete authentication within five minutes.

**TS-AUTH-ADM-OTP-04** — Verify that an expired Admin Login OTP cannot complete authentication.

**TS-AUTH-ADM-OTP-05** — Verify that an incorrect Admin Login OTP cannot complete authentication.

**TS-AUTH-ADM-OTP-06** — Verify that the current OTP challenge becomes invalid after five failed OTP attempts.

**TS-AUTH-ADM-OTP-07** — Verify that reaching the OTP failed-attempt limit does not change the Admin account status to `DISABLED`.

**TS-AUTH-ADM-OTP-08** — Verify that OTP resend is blocked during the 60-second cooldown.

**TS-AUTH-ADM-OTP-09** — Verify that requesting a new Admin Login OTP invalidates the previous OTP immediately.

**TS-AUTH-ADM-OTP-10** — Verify that a successfully used Admin Login OTP cannot be reused.

**TS-AUTH-ADM-OTP-11** — Verify that normal Login Rate Limiting and Account Lockout protections still apply to Admin authentication before the OTP step.

---

## I. First Admin Forced Password Change

**TS-AUTH-ADM-PWD-01** — Verify that the bootstrap Admin is directed to mandatory password change after successful first-login authentication.

**TS-AUTH-ADM-PWD-02** — Verify that the first Admin cannot access normal privileged Admin functionality while `must_change_password` remains true.

**TS-AUTH-ADM-PWD-03** — Verify that the current temporary password must be valid when replacing it.

**TS-AUTH-ADM-PWD-04** — Verify that the new password must satisfy the password policy.

**TS-AUTH-ADM-PWD-05** — Verify that successful replacement sets `must_change_password` to false and invalidates the temporary password.

**TS-AUTH-ADM-PWD-06** — Verify that invited Admins do not receive this forced temporary-password flow because they choose their own password during invitation acceptance.

---

## J. Refresh Token

**TS-AUTH-REFRESH-01** — Verify that a valid Refresh Token can obtain a replacement Access Token without requiring full Login again.

**TS-AUTH-REFRESH-02** — Verify that Refresh Token rotation invalidates the old Refresh Token and issues a new Refresh Token.

**TS-AUTH-REFRESH-03** — Verify that a previously rotated/used Refresh Token cannot be reused.

**TS-AUTH-REFRESH-04** — Verify that an expired or invalid Refresh Token cannot obtain a new Access Token.

**TS-AUTH-REFRESH-05** — Verify that a `DISABLED` account cannot refresh its session.

**TS-AUTH-REFRESH-06** — Verify the approved token lifetimes: Access Token 15 minutes and Refresh Token 7 days.

---

## K. Logout

**TS-AUTH-LOGOUT-01** — Verify that an authenticated Customer can log out of the current session.

**TS-AUTH-LOGOUT-02** — Verify that an authenticated Admin can log out of the current session.

**TS-AUTH-LOGOUT-03** — Verify that Logout invalidates the current Refresh Token/session.

**TS-AUTH-LOGOUT-04** — Verify that a logged-out session cannot be refreshed into a new authenticated session.

---

## L. Password Recovery and Reset

**TS-AUTH-RESET-01** — Verify that Password Recovery uses a generic public response regardless of whether the submitted email identifies an eligible account.

**TS-AUTH-RESET-02** — Verify that an eligible account receives a six-digit Password Recovery OTP.

**TS-AUTH-RESET-03** — Verify that a valid Password Recovery OTP can be used within five minutes.

**TS-AUTH-RESET-04** — Verify that an expired Password Recovery OTP cannot be used.

**TS-AUTH-RESET-05** — Verify that the current Password Recovery challenge becomes invalid after five failed OTP attempts.

**TS-AUTH-RESET-06** — Verify that Password Recovery OTP resend is blocked during the 60-second cooldown.

**TS-AUTH-RESET-07** — Verify that a newly issued Password Recovery OTP invalidates the previous OTP immediately.

**TS-AUTH-RESET-08** — Verify that a successfully used Password Recovery OTP cannot be reused.

**TS-AUTH-RESET-09** — Verify that the new password must satisfy the approved password policy.

**TS-AUTH-RESET-10** — Verify that successful password reset invalidates the old password.

**TS-AUTH-RESET-11** — Verify that successful password reset invalidates existing sessions and Refresh Tokens.

**TS-AUTH-RESET-12** — Verify that a Customer can sign in using the new password after reset.

**TS-AUTH-RESET-13** — Verify that an Admin signing in after password reset must still complete the mandatory Admin email OTP step.

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
