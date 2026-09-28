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

The user role is stored and controlled by the backend. A client must not be able to grant itself an elevated role by submitting a role value in a public request.

---

## 2. Customer Self-Registration

- Public registration creates `CUSTOMER` accounts only.
- The public registration endpoint must not allow the caller to select `ADMIN` as the account role.
- The backend assigns `role = CUSTOMER` during successful public registration.
- A newly registered customer starts with `status = PENDING_VERIFICATION` and follows the normal email-verification workflow before becoming `ACTIVE`.
- Client-supplied privileged account fields such as `role` or administrative status values must not result in privilege escalation.

Conceptual flow:

```text
Public Registration
→ CUSTOMER
→ PENDING_VERIFICATION
→ Email Verification
→ ACTIVE
```

---

## 3. Administrator-Created Customer Accounts

An authenticated and authorized Administrator may also initiate creation of a new Customer account through an Administrator-only account-management API.

Business rules:

- Only an authenticated and authorized `ADMIN` may initiate this flow.
- A `CUSTOMER` must not be able to use the Administrator customer-creation operation.
- The Administrator supplies the customer's required profile data such as First Name, Last Name and Email.
- The Administrator does not choose or know the Customer's password.
- The backend assigns `role = CUSTOMER`; the role is not accepted from an untrusted client field.
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
→ Create Customer Account / Invitation
→ Backend provisions CUSTOMER as PENDING_VERIFICATION
→ Activation invitation sent to target email
→ Customer opens valid invitation
→ Customer chooses own password
→ Email ownership / activation completed
→ Account becomes ACTIVE
```

This flow is intentionally separate from public self-registration so QA can validate Administrator authorization, account provisioning, activation, email uniqueness and privilege boundaries.

---

## 4. Initial Administrator Bootstrap

The first Administrator cannot depend on an existing Administrator account. It is created during secure environment/bootstrap setup rather than through public registration.

The initial Administrator bootstrap shall follow these rules:

- Initial Administrator credentials are provided through secure environment configuration rather than hard-coded source code.
- The bootstrap process creates the initial account with `role = ADMIN`.
- The bootstrap process must be idempotent: rerunning the environment setup must not create duplicate initial Administrator accounts.
- The initial password is treated as temporary and the initial Administrator must change it before receiving normal privileged access.
- Administrator 2FA remains mandatory. Full privileged access must not be granted until the required Administrator 2FA enrollment/verification flow is completed.
- The exact Administrator 2FA delivery and recovery mechanism remains an open item until the Authentication API contract is finalized.

Conceptual bootstrap flow:

```text
Environment configuration
→ Database migrations
→ Initial admin bootstrap/seed
→ ADMIN account exists
→ First sign-in
→ Mandatory password change
→ Required 2FA enrollment/verification
→ Privileged administrator session
```

The bootstrap process may be implemented through an application seed/bootstrap command. Direct manual SQL insertion is not the normal supported business workflow.

---

## 5. Additional Administrator Provisioning

Additional Administrator accounts are created through an authenticated administrative invitation workflow rather than public self-registration.

Business rules:

- Only an authenticated and authorized `ADMIN` may initiate an invitation for another Administrator.
- A `CUSTOMER` must not be able to create or invite an Administrator.
- The inviting Administrator supplies the target email address; the inviting Administrator does not choose or know the invited Administrator's password.
- The system sends a secure, time-limited, one-time invitation to the target email address.
- The invited person chooses their own password while accepting the invitation.
- The Administrator role is assigned by the backend based on the authorized invitation; it is not accepted from an untrusted public registration field.
- A successfully accepted email invitation establishes control of the invited email address.
- The invited Administrator must complete required 2FA enrollment/verification before normal privileged access is granted.
- Used, invalid, expired, or revoked invitations must not create an Administrator account.

Conceptual flow:

```text
Existing ADMIN
→ Create Admin Invitation
→ Invitation sent to target email
→ Invitee opens valid invitation
→ Invitee chooses own password
→ Backend provisions ADMIN role
→ Required 2FA enrollment/verification
→ Administrator account ready for privileged access
```

---

## 6. Direct Database Creation

Creating an Administrator or Customer directly through PostgreSQL is technically possible for controlled development, testing, or emergency maintenance, but it is not the normal supported account-provisioning workflow.

Normal production-style flows are:

```text
Customer self-registration
→ public registration

Admin-created Customer
→ authenticated Administrator customer-provisioning flow

First ADMIN
→ secure bootstrap/seed

Additional ADMIN
→ authenticated Admin invitation workflow
```

Any controlled database setup used for testing must preserve application security requirements such as password hashing, role values, account status, email uniqueness and required authentication/activation state.

---

## 7. Authorization Expectations

The backend shall use the authenticated user's role when authorizing protected operations.

Examples:

```text
CUSTOMER token
→ customer-authorized operations allowed
→ admin-only operations denied

ADMIN token
→ authorized administrative operations allowed
```

Hiding an administrative control in a UI is not sufficient authorization. Role enforcement must occur on the backend.

---

## 8. Authentication API QA Scope

During the Authentication API testing phase, QA will include coverage for the role-provisioning behavior defined here, including:

- Customer public self-registration.
- Verifying that public registration cannot self-assign the `ADMIN` role.
- Administrator creation/initiation of a Customer account.
- Customer activation after Administrator-initiated provisioning.
- Verifying that a Customer cannot use the Administrator customer-creation operation.
- Duplicate-email handling for Administrator-created Customers.
- Invalid, expired, reused and revoked Customer activation invitations after the final API contract is agreed.
- Initial Administrator bootstrap behavior.
- Administrator first-login restrictions.
- Administrator authentication and mandatory 2FA behavior.
- Creating/inviting an additional Administrator through an authorized Administrator flow.
- Verifying that a Customer cannot create or invite an Administrator.
- Invalid, expired, reused and revoked Administrator invitation behavior after the final API contract is agreed.

Detailed test cases will be derived after the Authentication API contract is reviewed and frozen.

---

## 9. Items to Finalize During API Contract Review

The following details will be finalized while reviewing the Authentication API contract:

1. Exact endpoint and request/response contract for Administrator-created Customer accounts.
2. Customer activation-invitation lifetime and resend/revocation rules.
3. Duplicate-email response when an Administrator attempts to create a Customer whose email already exists.
4. Exact endpoint names and request/response structures for Administrator invitations and invitation acceptance.
5. Administrator invitation lifetime and resend/revocation rules.
6. Behavior when an Administrator invitation targets an email that already belongs to an existing account.
7. Exact pre-authentication flow for mandatory first-password change and Administrator 2FA enrollment.
8. Exact Administrator 2FA delivery and recovery mechanism.
