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

This flow is intentionally separate from public self-registration and Administrator provisioning so QA can validate authorization, activation, email uniqueness and privilege boundaries independently.

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
→ Backend provisions ADMIN
→ First sign-in
→ Mandatory password change
→ Required 2FA enrollment/verification
→ Privileged administrator session
```

The bootstrap process may be implemented through an application seed/bootstrap command. Direct manual SQL insertion is not the normal supported business workflow.

---

## 5. Additional Administrator Provisioning

Additional Administrator accounts are created through a dedicated authenticated Administrator invitation workflow rather than public self-registration or a generic user-creation request with a client-selected role.

Conceptual API responsibility:

```text
Administrator Invitation Endpoint
→ Backend assigns ADMIN
```

Business rules:

- Only an authenticated and authorized `ADMIN` may initiate an invitation for another Administrator.
- A `CUSTOMER` must not be able to create or invite an Administrator.
- The invitation request does not need a generic `role` field because the Administrator-invitation workflow itself defines the account type.
- The inviting Administrator supplies the target email address and required profile data.
- The inviting Administrator does not choose or know the invited Administrator's password.
- The system sends a secure, time-limited, one-time invitation to the target email address.
- The invited person chooses their own password while accepting the invitation.
- The backend provisions `role = ADMIN` only after the request has passed the required authorization and invitation workflow.
- A successfully accepted email invitation establishes control of the invited email address.
- The invited Administrator must complete required 2FA enrollment/verification before normal privileged access is granted.
- Used, invalid, expired, or revoked invitations must not create or activate an Administrator account.

Conceptual flow:

```text
Existing ADMIN
→ Administrator-specific invitation endpoint
→ Invitation sent to target email
→ Invitee opens valid invitation
→ Invitee chooses own password
→ Backend provisions ADMIN
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

## 7. Authorization Expectations

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

## 8. Authentication API QA Scope

During the Authentication API testing phase, QA will include coverage for the role-provisioning behavior defined here, including:

- Customer public self-registration.
- Verifying that the public registration contract does not expose role selection.
- Verifying that public registration cannot self-assign the `ADMIN` role through unexpected fields.
- Administrator creation/initiation of a Customer account through the Customer-specific Administrator flow.
- Customer activation after Administrator-initiated provisioning.
- Verifying that a Customer cannot use the Administrator customer-creation operation.
- Duplicate-email handling for Administrator-created Customers.
- Invalid, expired, reused and revoked Customer activation invitations after the final API contract is agreed.
- Initial Administrator bootstrap behavior.
- Administrator first-login restrictions.
- Administrator authentication and mandatory 2FA behavior.
- Creating/inviting an additional Administrator through the Administrator-specific invitation flow.
- Verifying that a Customer cannot create or invite an Administrator.
- Verifying that the Admin invitation contract does not depend on a caller-supplied generic role value.
- Invalid, expired, reused and revoked Administrator invitation behavior after the final API contract is agreed.
- Database verification that accounts created through each workflow contain the expected backend-assigned role.

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
7. Exact validation response for unexpected privileged fields submitted to public registration.
8. Exact pre-authentication flow for mandatory first-password change and Administrator 2FA enrollment.
9. Exact Administrator 2FA delivery and recovery mechanism.
