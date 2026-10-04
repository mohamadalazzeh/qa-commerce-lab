# QA Commerce Lab — Current Checkpoint

## How to Resume

Use this file together with:

```text
docs/project-management/project-continuity.md
docs/architecture/backend-architecture-and-development-standards-v1.0.md
```

Suggested message in a new chat:

> Continue QA Commerce Lab from `mohamadalazzeh/qa-commerce-lab`. Authentication API Contract v1.0 is frozen. Backend architecture has now been adopted as Modular Monolith + Layered Architecture with Service Layer, Repository, Middleware, Adapter, Manual Dependency Injection, and Schema Validation. Continue from the local development-environment setup checkpoint before writing backend code.

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
6. Local development environment setup               🟡 IN PROGRESS
7. Backend implementation                            ⛔ NOT STARTED
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
Git 2.49.0.windows.1              ✅
Git user.name configured           ✅
Git user.email configured          ✅
VS Code 1.138.0 x64                ✅
WSL2 default version 2             ✅
Ubuntu 24.04 LTS                   ✅
Linux user: mohamad                ✅
Docker Desktop                     ✅
Docker Engine 29.8.1               ✅
Docker Compose v5.5.1              ✅
Docker hello-world test            ✅
Named Volume persistence demo      ✅
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
1. Verify Docker CLI / Compose works from Ubuntu WSL
2. Create /home/mohamad/projects
3. Clone qa-commerce-lab into WSL filesystem
4. Open repo through VS Code / WSL
5. Check/choose Node.js + npm version strategy
6. Prepare Docker Compose project environment
7. Add PostgreSQL first
8. Install/connect DB tooling (DBeaver + psql usage)
9. Convert frozen Authentication data model into migrations, relationships, and constraints
10. Inspect DB manually and practice SQL
11. Add Redis and Mailpit
12. Finalize backend libraries/tooling
13. Create backend skeleton
14. Implement first vertical slice: POST /api/v1/auth/register
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

Backend code has still **not** started.

The backend architecture discussion is complete. The current activity is environment/repository/database preparation.

Do not jump directly into Registration implementation. Continue the setup steps above, then create PostgreSQL/migrations and validate the schema before API code.
