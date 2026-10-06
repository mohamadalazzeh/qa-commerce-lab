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
→ Environment / Database Preparation
→ Backend Implementation
→ Detailed Test Cases during real execution
→ Postman API Testing
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

Detailed Test Cases are intentionally written/expanded while the real backend is being exercised, so Expected/Actual results can include API, PostgreSQL, Redis, and Mailpit evidence where relevant.

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
Backend architecture / implementation direction    ✅ ADOPTED
Local development environment setup                ✅ DONE
Authentication PostgreSQL schema/migrations         ✅ DONE
Redis + Mailpit local infrastructure                ✅ DONE
Backend tooling + skeleton                          ✅ DONE
Registration implementation                         ✅ DONE
Registration Postman/DB/Mailpit execution evidence  ⏭ NEXT
```

Frozen API source of truth:

```text
api-contract/authentication-api-contract-v1.0.md
```

Supporting data-model source:

```text
docs/business-analysis/authentication-data-model-v1.0.md
```

Backend architecture source:

```text
docs/architecture/backend-architecture-and-development-standards-v1.0.md
```

The former working API draft is superseded; Git history retains its previous content.

---

## Adopted Backend Architecture

The backend is a:

```text
Modular Monolith
+
Layered Architecture
```

Primary patterns:

```text
Service Layer
Repository
Middleware
Adapter
Manual Dependency Injection
Schema / DTO Validation
```

Standard runtime flow:

```text
HTTP Request
→ Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

Services may also use adapters/providers for Redis, Mail, hashing, token generation, logging, and other infrastructure.

The code must remain understandable and intentionally structured rather than opaque "vibe code". Routes/controllers stay thin, business rules live in Services, persistence lives in Repositories, and external infrastructure is isolated behind adapters.

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

Redis is expected for short-lived runtime state such as rate-limit counters, generic public cooldown keys, and selected fast revocation/session support; PostgreSQL remains the durable source of truth for persistent account/security history.

Schema changes must be incremental and migration-driven. Future modules may add tables and relationships; changes to shared tables require impact review for foreign keys, constraints, existing data, compatibility, and rollback/recovery.

---

## Local Development Direction

The user is setting up a Windows development machine with WSL2 and Linux containers.

Confirmed so far:

```text
Git 2.49.0.windows.1
VS Code 1.138.0 x64
WSL2 default version 2
Ubuntu 24.04 LTS
Docker Desktop
Docker Engine 29.8.1
Docker Compose v5.5.1
hello-world container test passed
named Docker Volume persistence test passed
```

The user created Linux account `mohamad` in Ubuntu WSL.

The user has practiced Docker basics using real commands and Docker Desktop, including Images, Containers, stopped/running state, host/container port mapping, Named Volumes, and the concept of Docker networking.

A demo named volume `demo-data` was proven persistent by writing `hello-from-volume` from one Alpine container, deleting the container, and reading the same file from a new container using the same volume.

Important conceptual distinction:

```text
Git / Project Folder = source code
Image                = packaged application/runtime template
Container            = running instance
Named Volume         = persistent runtime data
Bind Mount           = local source files exposed into a container during development
Docker Network       = service-to-service communication
Port Mapping         = host access to a container service
```

Kubernetes was discussed. It is not required for local/student use and should not be introduced now. It may be added later as an optional advanced learning/deployment stage after Docker/Compose and the application are stable.

---

## Planned Stack

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

Engineering direction includes strict practical typing, thin controllers/routes, business services, repositories, centralized errors, secure secrets/configuration, migrations/seeds/bootstrap, transactions, Docker, lint/formatting, OpenAPI alignment, and developer-level tests.

The first Admin is created by an explicit secure bootstrap command using environment/secret configuration. No public `/register-admin` endpoint exists.

---

## Learning Goals During Implementation

The user wants the setup and implementation taught step by step, including why each tool is used rather than only receiving commands.

Database learning is an explicit goal. During PostgreSQL setup and API execution, teach and practice:

```text
Database / schema / table navigation
Primary and Foreign Keys
Constraints and relationships
SELECT
WHERE
ORDER BY
LIMIT
INSERT
UPDATE
DELETE
JOIN
GROUP BY / COUNT
Transactions
COMMIT / ROLLBACK
Indexes
Migration behavior
Database validation after API requests
```

Use GUI tooling such as DBeaver plus `psql`/SQL CLI experience. Dockerized PostgreSQL must remain fully inspectable and manageable from the host. Named volumes provide persistence, not backup; backup/restore such as `pg_dump` / `pg_restore` can be taught later.

---

## Immediate Resume Point

The backend skeleton and the first Authentication business vertical slice, `POST /api/v1/auth/register`, are code-complete and developer-validated. The local Postman Collection/Environment and Registration SQL validation query are prepared and JSON-validated. Real Postman execution and PostgreSQL/Mailpit evidence are the next phase.

Environment/database preparation and Registration implementation are complete:

```text
1. Docker / WSL / repo setup                                           ✅
2. Node.js 24 via NVM                                                  ✅
3. PostgreSQL + DBeaver + psql                                        ✅
4. Authentication migrations / constraints / relationships            ✅
5. Redis + Mailpit                                                     ✅
6. TypeScript / Express tooling                                        ✅
7. Backend infrastructure skeleton + health/runtime validation         ✅
8. Implement `POST /api/v1/auth/register` as the first vertical slice  ✅
9. Developer validation: 30 tests + typecheck/lint/format/build         ✅
10. Postman Collection + Local Environment preparation                  ✅
11. Postman execution + PostgreSQL/Mailpit evidence                     ⏭ NEXT
```

Registration implementation covers the frozen Contract behavior: strict request validation, CUSTOMER/PENDING_VERIFICATION creation, case-insensitive duplicate protection including DB race handling, Argon2id password hashing, hashed verification-token persistence, 24-hour verification lifetime, atomic user/token persistence, exact `201`, `400`, `409`, and `503` HTTP behavior, and no Access/Refresh Token issuance.

Two clearly named local Registration test accounts from earlier execution remain in the development database. Treat them as existing test-state context when preparing the controlled Postman run. Do not jump to Email Verification until Registration evidence is complete.
