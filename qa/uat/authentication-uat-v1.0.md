# Authentication UAT Scenarios v1.0

## Purpose

These UAT scenarios validate that the Authentication module satisfies the expected business and end-user needs.

They intentionally avoid low-level implementation detail and do not replace QA Test Cases.

---

## Customer Registration and Verification

**UAT-AUTH-01 — Customer registration**

As a new Customer, I can create an account using my name, email, and a valid password so that I can begin using the platform.

**UAT-AUTH-02 — Email ownership verification**

As a newly registered Customer, I must verify my email before I can use the account as an active signed-in Customer.

**UAT-AUTH-03 — Expired verification link recovery**

As an unverified Customer whose verification link has expired, I can request a new verification email without registering a new account.

**UAT-AUTH-04 — Latest verification link only**

As an unverified Customer, when I request a new verification email, I can use the newest link to activate my account and older links no longer work.

---

## Customer Login

**UAT-AUTH-05 — Normal Customer sign-in**

As an active Customer, I can sign in with my correct email and password and enter the system without an additional OTP step.

**UAT-AUTH-06 — Unverified Customer guidance**

As a Customer who has not completed email verification, I am prevented from normal sign-in and can be directed to complete or resend verification.

**UAT-AUTH-07 — Disabled account protection**

As a user whose account has been disabled, I cannot establish a new authenticated session.

**UAT-AUTH-08 — Protection from repeated password guessing**

As an account owner, my account is temporarily protected after repeated consecutive incorrect password attempts rather than allowing unlimited guessing.

---

## Administrator Provisioning

**UAT-AUTH-09 — Initial Administrator setup**

As the initial Administrator, I can receive the securely provisioned bootstrap account and use its temporary password for the first sign-in process.

**UAT-AUTH-10 — Mandatory first password replacement**

As the initial Administrator, I must replace the temporary system-provided password with my own valid password before using normal privileged functionality.

**UAT-AUTH-11 — Invite another Administrator**

As an authorized Administrator, I can invite another person to become an Administrator without allowing public users or Customers to create Admin accounts.

**UAT-AUTH-12 — Accept Administrator invitation**

As an invited Administrator, I can accept a valid invitation, choose my own password, receive confirmation that my Admin account was created, and then proceed to Login.

**UAT-AUTH-13 — Expired Administrator invitation**

As an invited Administrator, if my invitation expires, the expired invitation cannot create my account and an authorized Administrator can issue a new invitation.

---

## Administrator Login and OTP

**UAT-AUTH-14 — Admin second-step authentication**

As an Administrator, after entering the correct email and password, I must verify a code sent to my email before I can access administrative functionality.

**UAT-AUTH-15 — Expired or incorrect Admin OTP**

As an Administrator, an expired or incorrect Login OTP does not grant me access to the Admin area.

**UAT-AUTH-16 — Request a replacement Admin OTP**

As an Administrator waiting for a Login OTP, I can request a replacement after the resend cooldown, and only the newest code can be used.

**UAT-AUTH-17 — Normal invited-Admin sign-in**

As an invited Administrator who already chose my password during account creation, I can later sign in using my password plus the required email OTP without being forced to replace that password on first Login.

---

## Session Continuity and Logout

**UAT-AUTH-18 — Stay signed in while session can be refreshed**

As an authenticated user, I can continue using the system when the short-lived Access Token expires, provided my Refresh Token/session is still valid.

**UAT-AUTH-19 — Secure token rotation**

As an authenticated user, refreshing my session replaces the previous Refresh Token so that an already-used token cannot continue creating new sessions.

**UAT-AUTH-20 — Logout**

As an authenticated Customer or Administrator, I can log out and the current session can no longer be refreshed into a new authenticated session.

**UAT-AUTH-21 — Disabled account session protection**

As an account owner whose account becomes disabled, I cannot use an existing Refresh Token to obtain a new authenticated session.

---

## Password Recovery

**UAT-AUTH-22 — Start password recovery**

As a Customer or Administrator who forgot the password, I can request a recovery code using my email without the public response exposing whether an account exists.

**UAT-AUTH-23 — Verify recovery code**

As an eligible user, I can use a valid recovery OTP within its allowed lifetime to proceed with choosing a new password.

**UAT-AUTH-24 — Replacement recovery code**

As a user who requests another recovery code after the cooldown, I can use the newest OTP and an older OTP no longer works.

**UAT-AUTH-25 — Password reset completion**

As a user who successfully verifies the recovery OTP, I can set a new valid password and the old password no longer works.

**UAT-AUTH-26 — Session invalidation after reset**

As a user who resets the password, previous authenticated sessions are invalidated so that old sessions cannot remain active after the credential change.

**UAT-AUTH-27 — Admin security remains after reset**

As an Administrator who reset the password, I still must complete the normal Admin email OTP step the next time I sign in.

---

## Acceptance Summary

Authentication is acceptable from a business/UAT perspective when:

```text
Customers can register, verify email, sign in, recover passwords, refresh sessions, and log out.

Administrators can be securely provisioned, complete mandatory email OTP Login, and recover passwords without bypassing Admin security.

The initial bootstrap Admin must replace the temporary password on first successful sign-in before normal privileged use.

Public users cannot self-assign the ADMIN role.

Repeated Login abuse, expired/old verification credentials, invalid OTPs, disabled accounts, and revoked/used session credentials do not grant unauthorized access.
```
