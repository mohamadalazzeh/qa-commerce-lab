# Authentication Role Provisioning Clarification — v1.0

## Purpose

This clarification closes the requirement gap around how `CUSTOMER` and `ADMIN` accounts are created and distinguished. It is part of the Authentication and Account Management baseline and must be considered during API contract design and QA test design.

**Status:** Approved clarification  
**Related baseline:** `docs/requirements/product-requirements-v1.0.md`

---

## 1. Roles in Scope

The system supports the following authenticated roles:

```text
CUSTOMER
ADMIN
```

The user role is stored and controlled by the backend.

### Approved Role-Provisioning Principle

Normal account-creation requests shall not use a generic client-supplied `role` field to decide whether an account becomes a Customer or Administrator. The backend determines the role from the authorized workflow / endpoint being used.

Approved mapping:

```text
Public Customer Registration
→ role = CUSTOMER

Administrator Customer Provisioning
→ role = CUSTOMER

Initial Administrator Bootstrap
→ role = ADMIN

Administrator Invitation Workflow
→ role = ADMIN
```

This prevents public callers from selecting privileged roles and keeps Customer and Administrator lifecycle rules separate.

---

## 2. Customer Self-Registration

Public self-registration creates `CUSTOMER` accounts only.

- The public registration request does not contain a `role` field.
- The backend assigns `role = CUSTOMER` during successful public registration.
- A caller must not be able to self-assign `ADMIN`, administrative status values, or other privileged account attributes.
- If the public registration request includes unsupported privileged fields such as `role`, `status`, `isAdmin`, or equivalent fields, the API shall reject the request according to the validation policy defined in the final API contract.
- A newly registered customer starts with `status = PENDING_VERIFICATION` and follows the normal email-verification workflow before becoming `ACTIVE`.

Conceptual flow:

```text
Public Registration
→ Backend assigns CUSTOMER
→ PENDING_VERIFICATION
→ Email Verification
→ ACTIVE
```

---

## 3. Administrator-Created Customer Accounts

An authenticated and authorized Administrator may initiate creation of a new Customer account through a Customer-specific Administrator API.

The approved design is role-specific rather than a generic `/admin/users` request containing a caller-selected role.

Conceptual API responsibility:

```text
Administrator Customer-Provisioning Endpoint
→ Backend assigns CUSTOMER
```

Business rules:

- Only an authenticated and authorized `ADMIN` may initiate this flow.
- A `CUSTOMER` must not be able to use the Administrator customer-creation operation.
- The Administrator supplies the customer's required profile data such as First Name, Last Name and Email.
- The request does not need a `role` field because the Customer-provisioning workflow itself defines the account type.
- The Administrator does not choose or know the Customer's password.
- The backend assigns `role = CUSTOMER`.
- The account starts in `PENDING_VERIFICATION` / pending activation state and must not receive normal authenticated Customer access until activation is completed.
- The system sends a secure, time-limited, one-time activation invitation to the Customer's email address.
- The invited Customer chooses their own password while accepting the activation invitation.
- The new password must satisfy the same Customer password policy used by public registration.
- Successful activation establishes control of the email address and changes the account to `ACTIVE`.
- Used, invalid, expired or revoked activation invitations must not activate the account.
- Case-insensitive email uniqueness rules apply exactly as they do for public registration.
- Attempting to create a Customer using an email already associated with an account must follow the duplicate-email behavior defined in the API contract.

Conceptual flow:

```text
Existing ADMIN
→ Customer-specific Admin endpoint
→ Backend provisions CUSTOMER as PENDING_VERIFICATION
→ Activation invitation sent to target email
→ Customer opens valid invitation
→ Customer chooses own password
→ Email ownership / activation completed
→ Account becomes ACTIVE
```

---

## 4. Initial Administrator Bootstrap

The first Administrator cannot depend on an existing Administrator account. It is created during secure environment/bootstrap setup rather than through public registration.

The initial Administrator bootstrap shall follow these rules:

- Initial Administrator credentials are provided through secure environment configuration rather than hard-coded source code.
- The bootstrap process creates the initial account with `role = ADMIN`.
- The bootstrap process must be idempotent: rerunning environment setup must not create duplicate initial Administrator accounts.
- The initial password is temporary.
- The initial Administrator must replace the temporary password during the first successful sign-in flow before receiving normal privileged access.
- After a successful first-password change, the original temporary password becomes invalid.
- The implementation may use a persisted state such as `must_change_password = true` until the password replacement succeeds.
- Administrator second-step verification is mandatory and uses a six-digit code delivered to the Administrator's email address.
- Access Token and Refresh Token must not be issued until all required first-sign-in steps have completed.

Conceptual bootstrap flow:

```text
Environment configuration
→ Database migrations
→ Initial admin bootstrap/seed
→ Backend provisions ADMIN with temporary password
→ First sign-in credentials accepted
→ Email OTP challenge
→ OTP verified
→ Mandatory password change
→ Temporary password invalidated
→ Privileged administrator session issued
```

The exact API ordering between OTP verification and forced password change will be finalized in the Login API contract, but neither requirement may be bypassed.

---

## 5. Additional Administrator Provisioning

Additional Administrator accounts are created through a dedicated authenticated Administrator invitation workflow rather than public self-registration or a generic user-creation request with a client-selected role.

Conceptual API responsibility:

```text
POST /api/v1/admin/admin-invitations
→ Backend assigns ADMIN through the trusted workflow
```

Business rules:

- Only an authenticated and authorized `ADMIN` may initiate an invitation for another Administrator.
- A `CUSTOMER` must not be able to create or invite an Administrator.
- The invitation request does not need a generic `role` field because the Administrator-invitation workflow itself defines the account type.
- The inviting Administrator supplies the target email address and required profile data.
- The inviting Administrator does not choose or know the invited Administrator's password.
- The system sends a secure, time-limited, one-time invitation to the target email address.
- **Administrator invitation validity is 24 hours.**
- The invited person chooses their own password while accepting the invitation.
- The backend provisions `role = ADMIN` only after the required authorization and invitation workflow succeeds.
- Invitation expiry alone must not create or activate an Administrator account.
- Used, invalid, expired or revoked invitations must not create or activate an Administrator account.
- Resending / reissuing an Administrator invitation generates a new invitation token and invalidates the previously issued invitation immediately.
- Only the latest issued Administrator invitation token is valid.
- Invitation acceptance must not create duplicate accounts for the same email address.
- A successfully accepted invitation establishes control of the invited email address.
- The invited Administrator is not considered logged in merely because the account was successfully created.
- Future Administrator login requires password verification plus the mandatory email-based second verification step.

Conceptual flow:

```text
Existing ADMIN
→ Administrator-specific invitation endpoint
→ Raw invitation token sent to target email
→ Token hash stored in database
→ Invitee opens valid invitation within 24 hours
→ Invitee chooses own password
→ Backend provisions ADMIN
→ Invitation marked used
→ Account ready for later Administrator login
```

### Expected Status-Code Baseline

For the reviewed invitation scenarios:

```text
Valid invitation creation                           → 201 Created
Authenticated CUSTOMER attempts Admin invitation    → 403 Forbidden
Missing/invalid authentication on Admin endpoint    → 401 Unauthorized
Expired invitation acceptance                       → 400 Bad Request
Revoked/old invitation acceptance after resend      → 400 Bad Request
Valid invitation acceptance and Admin creation      → 201 Created
```

Invalid, expired, used and revoked invitation credentials should use a generic contract response such as `INVALID_INVITATION` rather than exposing unnecessary token-state details.

---

## 6. Administrator Email OTP / Second-Step Authentication

For Version 1, Administrator second-step authentication uses a **six-digit verification code sent to the Administrator's email address**. An authenticator application is not required.

This is separate from account invitation:

```text
Administrator Invitation Email
→ provisions / creates an Admin account

Administrator Login Email OTP
→ completes authentication during a new login session
```

Approved behavior:

- The Administrator first submits Email + Password.
- Correct primary credentials alone do not complete Administrator authentication.
- The backend generates a six-digit email OTP / login challenge.
- The raw code is delivered by email.
- OTP challenge material should be stored securely, preferably as a hash rather than plaintext.
- Access and Refresh Tokens must not be issued before successful OTP verification.
- The OTP is one-time use.
- Requesting a replacement OTP invalidates the previously issued OTP.
- Email delivery failure must not bypass OTP verification or cause privileged tokens to be issued.
- The second verification step is required for **every new Administrator login session** in Version 1.
- Trusted-device / remember-this-device behavior is outside Version 1 scope.

The exact OTP lifetime, failed-attempt limit, resend cooldown and recovery rules remain to be finalized during Login API contract review.

Conceptual Administrator login flow:

```text
Email + Password
→ credentials valid
→ Admin role detected
→ Generate 6-digit email OTP
→ Send OTP
→ Return pre-authentication challenge state only
→ Admin submits OTP
→ Validate OTP / expiry / attempts / used state
→ Authentication complete
→ Issue Access Token + Refresh Token
```

---

## 7. Token Storage and Lifetime Principle

Verification and invitation tokens are treated as secret credentials.

For opaque link-based tokens such as email verification and Admin invitation tokens:

```text
Backend generates secure random RAW TOKEN
→ RAW TOKEN is sent to the user in the email link
→ Backend hashes the raw token
→ Database stores TOKEN HASH, not raw token
```

When the user submits the raw token:

```text
Backend receives RAW TOKEN
→ hashes received token
→ compares resulting hash with stored token_hash
→ then checks time and lifecycle state
```

A valid token requires:

```text
token hash matches
AND NOW < expires_at
AND used_at IS NULL
AND revoked_at IS NULL
```

Recommended token lifecycle fields include:

```text
created_at
expires_at
used_at
revoked_at
```

The backend calculates `expires_at` using the approved business lifetime. The duration should be configurable rather than scattered as hard-coded values.

Examples:

```text
EMAIL_VERIFICATION_EXPIRY_HOURS=24
ADMIN_INVITATION_EXPIRY_HOURS=24
```

Timestamps should be stored consistently, preferably in UTC, with user-facing timezone conversion handled separately when needed.

---

## 8. Direct Database Creation

Creating an Administrator or Customer directly through PostgreSQL is technically possible for controlled development, testing, or emergency maintenance, but it is not the normal supported account-provisioning workflow.

Normal production-style flows are:

```text
Customer self-registration
→ public registration
→ CUSTOMER

Admin-created Customer
→ Customer-specific Administrator provisioning flow
→ CUSTOMER

First ADMIN
→ secure bootstrap/seed
→ ADMIN

Additional ADMIN
→ Administrator-specific invitation flow
→ ADMIN
```

Any controlled database setup used for testing must preserve application security requirements such as password hashing, role values, account status, email uniqueness and required authentication/activation state.

---

## 9. Authorization Expectations

The backend shall use the authenticated user's stored role when authorizing protected operations.

Examples:

```text
CUSTOMER token
→ customer-authorized operations allowed
→ admin-only operations denied

ADMIN token
→ authorized administrative operations allowed
```

Hiding an administrative control in a UI is not sufficient authorization. Role enforcement must occur on the backend.

The API caller does not become an Administrator merely by submitting a role-like field. Administrator privilege is established only through an authorized Administrator provisioning workflow or the initial secure bootstrap process.

---

## 10. Authentication API QA Scope

During the Authentication API testing phase, QA will include coverage for:

- Customer public self-registration.
- Verifying that public registration does not expose role selection.
- Verifying that public registration cannot self-assign `ADMIN` through unexpected fields.
- Administrator creation/initiation of a Customer account through the Customer-specific Administrator flow.
- Customer activation after Administrator-initiated provisioning.
- Verifying that a Customer cannot use the Administrator customer-creation operation.
- Initial Administrator bootstrap behavior and idempotency.
- Initial Administrator first-sign-in forced password replacement.
- Verifying that the original temporary password becomes invalid after successful replacement.
- Creating/inviting an additional Administrator through the Administrator-specific invitation flow.
- Verifying that a Customer cannot create or invite an Administrator.
- Verifying that an Admin invitation remains valid only for 24 hours.
- Invalid, expired, reused and revoked Administrator invitation behavior.
- Verifying that resend / reissue invalidates the previous Admin invitation.
- Verifying that only the latest Admin invitation token can be used.
- Verifying that the Admin invitation contract does not depend on a caller-supplied generic role value.
- Verifying that Admin login does not issue Access/Refresh Tokens after password validation alone.
- Verifying mandatory email OTP for every new Administrator login session.
- Invalid, expired, reused and replaced Admin login OTP scenarios after the remaining OTP contract values are finalized.
- Database verification that accounts created through each workflow contain the expected backend-assigned role.
- Security verification that raw invitation / verification secrets are not stored in plaintext where the design requires hashed storage.

Detailed test cases will be derived after the Authentication API contract is reviewed and frozen.

---

## 11. Remaining Items to Finalize During API Contract Review

The following details still require final contract decisions:

1. Exact endpoint and request/response contract for Administrator-created Customer accounts.
2. Customer activation-invitation lifetime and resend/revocation rules.
3. Duplicate-email response when an Administrator attempts to create a Customer whose email already exists.
4. Exact request/response structures for Administrator invitation acceptance and optional invitation resend endpoint.
5. Behavior when an Administrator invitation targets an email that already belongs to an existing account.
6. Exact validation response for unexpected privileged fields submitted to public registration.
7. Exact pre-authentication API sequence for initial Admin email OTP plus mandatory first-password change.
8. Administrator login OTP lifetime, maximum failed attempts, resend cooldown and recovery behavior.
9. Exact Login endpoint response structures for Customer authentication and Administrator pre-authentication challenge state.
