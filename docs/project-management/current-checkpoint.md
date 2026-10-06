# QA Commerce Lab — Current Checkpoint

## How to Resume

Use this file together with:

```text
docs/project-management/project-continuity.md
docs/architecture/backend-architecture-and-development-standards-v1.0.md
```

Suggested message in a new chat:

> Continue QA Commerce Lab from `mohamadalazzeh/qa-commerce-lab`. Authentication API Contract v1.0 and Authentication Data Model v1.0 are frozen. Backend architecture is adopted. WSL/Docker/Node/PostgreSQL/Redis/Mailpit/DBeaver/psql are ready, Authentication migrations 001–005 are applied and validated, and the TypeScript/Express backend skeleton is ready. The `POST /api/v1/auth/register` implementation is code-complete and developer-validated with 30 passing tests plus typecheck/lint/format/build. Continue with real API execution through Postman, then PostgreSQL and Mailpit evidence.

---

## Current Module

```text
Authentication
```

## Pre-Backend Status

```text
1. Admin Invitation API details                     ✅ DONE
2. Verification Resend response/security details    ✅ DONE
3. Authentication DB relationships/transactions     ✅ DONE
4. Final API Contract consistency/OpenAPI review     ✅ DONE
5. Backend architecture / implementation approach    ✅ ADOPTED
6. Local development environment core setup          ✅ DONE
7. PostgreSQL + DB tooling + Auth migrations          ✅ DONE
8. Redis + Mailpit environment                        ✅ DONE
9. Backend libraries/tooling                          ✅ DONE
10. Backend skeleton                                  ✅ DONE
11. First vertical slice: Registration implementation ✅ DONE
12. Postman + PostgreSQL + Mailpit execution evidence  ⏭ NEXT
```

## Frozen Sources of Truth

```text
api-contract/authentication-api-contract-v1.0.md
docs/business-analysis/authentication-data-model-v1.0.md
qa/test-scenarios/authentication-test-scenarios-v1.0.md
qa/uat/authentication-uat-v1.0.md
```

Backend architecture source:

```text
docs/architecture/backend-architecture-and-development-standards-v1.0.md
```

---

## Adopted Backend Architecture

```text
Modular Monolith
+
Layered Architecture
```

Primary implementation patterns:

```text
Service Layer Pattern
Repository Pattern
Middleware Pattern
Adapter Pattern
Manual Dependency Injection
Schema / DTO Validation
```

Standard runtime flow:

```text
Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

The backend must be clear, reviewable, frontend-ready, and not opaque "vibe code". Build one vertical slice at a time and explain why each tool/layer is used.

---

## Local Development Environment — Current Progress

Confirmed on the user's Windows machine:

```text
Git 2.49.0.windows.1                         ✅
Git user.name configured                      ✅
Git user.email configured                     ✅
VS Code / WSL workspace                       ✅
WSL2 default version 2                        ✅
Ubuntu 24.04 LTS                              ✅
Linux user: mohamad                           ✅
Repo: /home/mohamad/projects/qa-commerce-lab ✅
Node.js 24.21.0 via NVM                       ✅
npm 11.19.0                                   ✅
Docker Desktop                                ✅
Docker Engine 29.8.1                          ✅
Docker Compose v5.5.1                         ✅
PostgreSQL 18.6 container                     ✅
Docker named volume persistence               ✅
psql client 16.15                             ✅
DBeaver Community                             ✅
Authentication migrations 001–005             ✅
Authentication tables: 10                     ✅
Schema constraint/FK negative tests           ✅
```

The user has already practiced/understood the basics of:

```text
Image
Container
Named Volume
Port mapping
Docker network concept
WSL2/Linux-container purpose
Docker Compose purpose
```

A demo named volume `demo-data` was created and tested by writing data in one Alpine container, deleting that container, then reading the same data from a new container. Persistence was confirmed.

Kubernetes was discussed and intentionally postponed. It is optional as an advanced later stage, not required for local/student use. Docker Compose remains the primary environment.

---

## Immediate Next Steps

Continue one step at a time:

```text
1. Verify Docker CLI / Compose works from Ubuntu WSL                              ✅
2. Create /home/mohamad/projects                                                      ✅
3. Clone qa-commerce-lab into WSL filesystem                                         ✅
4. Open repo through VS Code / WSL                                                   ✅
5. Check/choose Node.js + npm version strategy                                       ✅
6. Prepare Docker Compose project environment                                        ✅
7. Add PostgreSQL first                                                              ✅
8. Install/connect DB tooling (DBeaver + psql usage)                                 ✅
9. Convert frozen Authentication data model into migrations, relationships, constraints ✅
10. Inspect DB manually and validate schema/constraints                              ✅
11. Add Redis and Mailpit                                                            ✅
12. Finalize backend libraries/tooling                                                ✅
13. Create and runtime-validate backend skeleton                                     ✅
14. Implement first vertical slice: POST /api/v1/auth/register                       ✅
15. Execute Registration through Postman and collect PostgreSQL/Mailpit evidence      ⏭ NEXT
```

The user explicitly wants to learn database administration and SQL commands hands-on, including inspecting DB state after API requests.

---

## Database Implementation Rule

Do not create the entire e-commerce schema upfront. Build schema incrementally by module using migrations.

For Authentication, use the frozen data model as the design source. PostgreSQL remains the durable source of truth; Redis is for suitable short-lived runtime state.

Database changes must consider:

```text
Primary / Foreign Keys
Constraints
Nullability
Data types
Existing data
Migration safety
Transactions
Concurrency
Rollback/recovery impact
```

Persistent PostgreSQL data will use a Docker named volume. A volume provides persistence, not backup; backup/restore (e.g. pg_dump/pg_restore) should be taught later.

---

## Authentication Contract Status

```text
Authentication API Contract v1.0 = FROZEN ✅
```

There is no separate frozen OpenAPI YAML/JSON yet. The frozen markdown contract remains authoritative. Backend Swagger/OpenAPI must match it one-to-one.

---

## Current Stop Point

The first Authentication business vertical slice, **`POST /api/v1/auth/register`**, is code-complete.

Core local environment setup, PostgreSQL, Redis, Mailpit, DBeaver/psql, and the complete Authentication PostgreSQL schema are ready. Migrations `001` through `005` are applied successfully. The schema contains 10 Authentication tables and 13 foreign-key constraints. Two clearly named local Registration test accounts remain from earlier test execution and should be intentionally cleaned/reset before the next controlled Postman run.

Registration currently includes Repository, Service, validation schema, Controller, Route, OpenAPI alignment, Argon2id password hashing, SHA-256 verification-token hashing, transactional creation of the Customer plus verification token, duplicate-email race handling, and the documented `503 EMAIL_DELIVERY_FAILED` recovery behavior. Malformed JSON now returns `400 VALIDATION_ERROR`, and email input is guarded against the PostgreSQL `VARCHAR(320)` storage limit.

The TypeScript/Express toolchain passes typecheck, ESLint, Prettier, and production build. Registration developer validation contains **30 passing tests across 6 test files**, covering schema/business boundaries, HTTP wiring/error mapping, Service behavior, Repository transaction/rollback behavior, security adapters, and OpenAPI response-code alignment.

The next step is **real API execution**, not more Registration coding: prepare/confirm the Postman environment, execute `POST /api/v1/auth/register`, then collect PostgreSQL and Mailpit evidence and expand the detailed QA Test Cases with Actual Results.
