# QA Commerce Lab — Backend Architecture & Development Standards v1.0

## Status

```text
ADOPTED ✅
```

This document captures the agreed backend architecture and implementation standards before backend code is written.

---

## Architecture Choice

The backend will use:

```text
Modular Monolith
+
Layered Architecture
```

The application remains one deployable backend, while business areas are separated into clear modules such as:

```text
auth
products
cart
orders
invoices
returns
```

This avoids unnecessary Microservices complexity while keeping the codebase structured and extensible.

---

## Primary Patterns

The agreed implementation approach uses:

```text
Service Layer Pattern
Repository Pattern
Middleware Pattern
Adapter Pattern
Manual Dependency Injection
Schema / DTO Validation
```

### Service Layer

The Service Layer is the main home for business logic and use-case decisions.

Examples:

```text
registerCustomer()
verifyEmail()
loginCustomer()
verifyAdminOtp()
resetPassword()
```

Controllers must not contain large business workflows.

### Repository Pattern

Repositories isolate persistence and SQL/database access from business logic.

Examples:

```text
findUserByEmail()
createUser()
createVerificationToken()
revokeSession()
```

Services decide business behavior; repositories perform persistence operations.

### Middleware Pattern

Cross-cutting HTTP concerns belong in middleware where appropriate, including:

```text
authentication
authorization
request validation
rate limiting
centralized error handling
```

### Adapter Pattern

External/infrastructure dependencies are accessed behind clear adapters/interfaces so they can be replaced without rewriting business logic.

Examples:

```text
Mailpit / SMTP provider
Redis
Token generation
Password hashing
Clock/time provider when useful
```

### Manual Dependency Injection

Dependencies are composed explicitly rather than hidden behind a heavyweight DI framework.

Conceptual example:

```text
AuthService
├── UserRepository
├── VerificationTokenRepository
├── PasswordHasher
├── TokenGenerator
└── MailAdapter
```

This keeps dependencies visible and makes developer testing easier.

---

## Runtime Request Flow

The standard request path is:

```text
HTTP Request
→ Route
→ Validation / Middleware
→ Controller
→ Service
→ Repository
→ PostgreSQL
```

A Service may also use infrastructure adapters such as Mail or Redis.

Example Registration runtime flow:

```text
POST /api/v1/auth/register
→ Route
→ registerSchema validation
→ AuthController.register()
→ AuthService.registerCustomer()
→ UserRepository / VerificationTokenRepository
→ PostgreSQL transaction
→ Mail Adapter
→ HTTP Response
```

---

## Feature Build Order

Build order is intentionally different from runtime request flow.

For each vertical slice, use:

```text
Frozen API Contract
→ Database migration / constraints
→ Repository
→ Service
→ Validation schema
→ Controller
→ Route
→ OpenAPI / Swagger alignment
→ Developer tests
→ Postman execution
→ PostgreSQL validation
→ Mailpit / Redis validation where applicable
→ Detailed QA Test Cases with real evidence
```

The first implementation slice will be:

```text
POST /api/v1/auth/register
```

followed by Email Verification and the remaining Authentication flows.

---

## Separation of Responsibilities

### Route

Knows the HTTP method/path and wires middleware/controller.

### Validation Layer

Rejects malformed or contract-invalid input before business logic runs.

### Controller

Handles HTTP concerns only: request extraction, service invocation, status/response mapping.

### Service

Owns business rules, decisions, orchestration, and transaction boundaries/use-case behavior.

### Repository

Owns PostgreSQL persistence operations and queries.

### Infrastructure / Adapters

Owns integrations such as Redis, Mailpit/SMTP, hashing, token generation, and logging infrastructure.

---

## Frontend-Ready API Rules

The backend must remain independent from any future frontend implementation.

Frontend clients will integrate through the frozen API contract using stable:

```text
/api/v1 paths
HTTP status codes
business error codes
JSON schemas
Bearer access-token behavior
HttpOnly refresh-token cookie behavior
```

Frontend logic must rely on stable error codes such as `EMAIL_VERIFICATION_REQUIRED`, not fragile human-readable message parsing.

CORS, cookie attributes, environment configuration, and OpenAPI must be designed so a separate frontend can be connected later without restructuring backend business logic.

---

## Code Quality Standards

The backend should be understandable, reviewable, and intentionally written rather than generated as opaque "vibe code".

Standards include:

```text
TypeScript strict practical typing
No casual `any`
Clear names and small focused functions
Thin routes and controllers
Business logic in Services
Persistence logic in Repositories
Centralized error handling
Stable API/business error codes
No hardcoded secrets
.env.example committed; real .env ignored
No passwords/tokens/OTPs logged
Migrations instead of manual schema drift
Transactions for atomic business operations
Explicit concurrency handling where required
ESLint / formatting
OpenAPI implementation aligned one-to-one with frozen contract
Developer-level automated tests
Dockerized reproducible environment
```

Patterns will be introduced only when they solve a real problem. CQRS, Event Sourcing, Microservices, or heavyweight DI frameworks are not required for V1.

---

## Docker / Local Development Direction

Local development uses Docker Desktop + WSL2 + Linux containers.

Planned services:

```text
backend
postgres
redis
mailpit
```

Docker Compose will coordinate the local environment.

Conceptual storage/network model:

```text
Git / Project Folder
→ source code

Backend Image
→ packaged backend runtime

Backend Container
→ running API process

PostgreSQL Container
→ running PostgreSQL server

Named PostgreSQL Volume
→ persistent database files

Docker Network
→ service-to-service communication
```

During development, source code may be bind-mounted into the backend container for fast edit/reload behavior. Persistent PostgreSQL data uses a named volume.

Kubernetes is explicitly optional and postponed. It may be added later as an advanced deployment/learning stage, but it is not required for students or local project users. Docker Compose remains the primary local setup.

---

## Database Direction

PostgreSQL remains the durable source of truth for business/security data.

Redis is used for appropriate short-lived runtime state such as:

```text
rate-limit counters
resend cooldown keys
temporary counters
selected fast revocation/cache support
```

PostgreSQL schema evolution must use migrations. New modules/tables will be added incrementally, with foreign-key impact, constraints, existing data, rollback/recovery, and compatibility considered before schema changes.

The user will learn database administration and SQL hands-on through both GUI and CLI tooling, including PostgreSQL inspection after API operations.

---

## Current Implementation Rule

Do not create large amounts of backend code at once.

Build and validate one vertical slice at a time:

```text
Registration
→ run it
→ inspect HTTP behavior
→ inspect PostgreSQL
→ inspect Mailpit
→ document real test evidence
→ then continue to the next endpoint
```
