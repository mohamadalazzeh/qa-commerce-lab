# QA Commerce Lab — Project Continuity

## Project Goal

Build a realistic portfolio-grade QA Engineering Lab around a working e-commerce backend with production-like API behavior, PostgreSQL, authentication/authorization, email flows, transactions, concurrency, Redis, Docker, OpenAPI/Swagger, Postman execution, SQL validation, defects, retest, and regression.

The project is intentionally incremental by module:

```text
Authentication
→ Products
→ Cart
→ Orders
→ Invoices
→ Returns / Refunds
→ Bulk Import
```

Current module: **Authentication**.

---

## Delivery Workflow

```text
Requirements
→ Business Rules / Clarifications
→ API Contract
→ Test Scenarios / UAT
→ Backend Planning
→ Backend Implementation
→ Detailed Test Cases during real execution
→ Postman API Testing
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

Detailed Test Cases are intentionally written/expanded while the real backend is being exercised, so Expected/Actual results can include API, PostgreSQL, and Mailpit evidence.

---

## Authentication Status

```text
Requirements / Business Rules                     ✅
Authentication Test Scenarios / UAT               ✅
Admin Invitation API design                       ✅
Verification Resend security behavior              ✅
Authentication DB model / relationships            ✅
Transaction / concurrency review                   ✅
Final API Contract consistency review              ✅
Authentication API Contract v1.0                  ✅ FROZEN
Backend implementation                             ⛔ NOT STARTED
```

Frozen API source of truth:

```text
api-contract/authentication-api-contract-v1.0.md
```

Supporting data-model source:

```text
docs/business-analysis/authentication-data-model-v1.0.md
```

Working draft:

```text
api-contract/authentication-api-contract-draft-v1.0.md
```

is superseded; Git history retains the previous draft content.

---

## Authentication V1 Scope

Frozen flows include:

```text
Customer Registration
Customer Email Verification
Verification Resend
Customer Login
Admin Login + Email OTP
Login Account Lockout
Login Rate Limiting
First Admin Bootstrap + Forced Temporary Password Change
Additional Admin Invitation
Invitation List / Resend / Cancel / Inspect / Accept
Existing ACTIVE Customer → Admin Promotion
Access / Refresh Token Rotation
Logout
Forgot Password
Password Reset OTP / Resend
Reset Token
Password Reset + Global Session Revocation
```

Key lifetimes:

```text
Access Token                     15 minutes
Refresh Token                    7 days
Verification link                24 hours
Verification resend cooldown     60 seconds
Admin Invitation                 24 hours
Invitation resend cooldown       60 seconds
Admin Login OTP                  5 minutes
Admin OTP resend cooldown        60 seconds
Password Reset OTP               5 minutes
Reset OTP resend cooldown        60 seconds
Password Change Token            10 minutes
Password Reset Token             10 minutes
```

---

## Key Security Decisions

```text
Public Customer Registration always assigns CUSTOMER.
No public Admin registration exists.
Passwords are never stored/logged in plaintext.
Verification/invitation/reset/refresh raw secrets are not persisted.
Customer normal Login does not require OTP in V1.
Admin full Login requires Password + Email OTP.
5 consecutive wrong passwords → 15-minute temporary Account Lock.
Login rate-limit baseline → 10/email-input/min + 60/source-IP/min, configurable.
Wrong Login credentials do not disclose pending/disabled/locked state.
Public Forgot Password and email-driven resend responses are generic to reduce account enumeration.
OTP resend never resets the failed-attempt counter.
Newest OTP/token only is valid after replacement.
Refresh Tokens rotate; detected reuse revokes the associated session.
Customer→Admin promotion revokes old Customer sessions.
Password Reset revokes all existing sessions/Refresh Tokens.
One-time operations are concurrency-safe.
```

---

## Authentication Data Model

Persistent PostgreSQL tables currently frozen at design level:

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

Redis is expected for short-lived runtime state such as rate-limit counters, generic public cooldown keys, and fast revocation/session support; PostgreSQL remains the durable source of truth for persistent account/security history.

---

## Backend Direction — Planning Only

Planned stack remains:

```text
TypeScript
Node.js
Express.js
REST
PostgreSQL
Redis
Mailpit
Docker Compose
OpenAPI / Swagger
```

Planned layering:

```text
Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

Engineering direction includes strict practical typing, thin controllers/routes, business services, repositories, centralized errors, secure secrets/configuration, migrations/seeds/bootstrap, transactions, Docker, lint/formatting, OpenAPI alignment, and developer-level tests.

The first Admin is created by an explicit secure bootstrap command using environment/secret configuration. No public `/register-admin` endpoint exists.

---

## Important Stop Point

**Backend implementation has not started.**

Before writing backend code, Docker files, migrations, endpoints, or Swagger implementation, first discuss the backend architecture/implementation plan with the user.

After that discussion, implementation should begin with the Authentication API/backend and its supporting Dockerized services. Postman, PostgreSQL, and Mailpit testing follow immediately, and Detailed Test Cases are written during real execution.
