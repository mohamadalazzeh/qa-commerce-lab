# QA Commerce Lab — Security Review v1.0

## Scope

Review performed against the synchronized `main` branch after Registration implementation and before real Postman execution.

Reviewed areas:

- Authentication requirements and frozen API contract
- Backend architecture and Registration implementation
- PostgreSQL migrations and current role model
- Docker Compose local exposure
- Logging and secret handling
- npm production and development dependencies
- Git ignore / environment-file handling

## Confirmed Security Controls

- Public Registration cannot choose `role` or `status`; strict request validation rejects unexpected fields.
- Passwords are hashed with Argon2id and are never persisted in plaintext.
- Verification tokens use 32 cryptographically random bytes; only a SHA-256 hash is persisted.
- Registration persistence uses parameterized SQL and an explicit transaction.
- Case-insensitive email uniqueness is enforced by PostgreSQL, including race-condition handling.
- Generic HTTP 500 responses do not expose internal exception details.
- Helmet security headers are enabled and Express `x-powered-by` is disabled.
- Request JSON size is bounded.
- Real `.env` files are ignored; only `.env.example` is committed.
- npm audit reported 0 known vulnerabilities across production and development dependencies at review time.
- Authentication tables use PK/FK, uniqueness, status/role checks, and timestamped security state.

## Findings and Actions

### SR-001 — Local infrastructure ports exposed on all host interfaces

Severity: Medium  
Status: Fixed

PostgreSQL, Redis, Mailpit SMTP, and Mailpit UI were published without a host IP, which caused Docker to bind them to all host interfaces.

Action: Compose port mappings are now bound to `127.0.0.1` for local development. This keeps the services reachable from the host while avoiding unnecessary LAN exposure.

### SR-002 — Sensitive logging redaction needed deeper paths

Severity: Medium  
Status: Fixed

The logger already redacted Authorization/Cookie headers and common top-level secret names, but explicit nested request-body/query/parameter paths were not comprehensive.

Action: Expanded Pino redaction paths for password, password hash, token/token hash, refresh token, reset token, OTP/OTP hash, Authorization, Cookie, and Set-Cookie locations.

### SR-003 — Application database role has bootstrap/superuser privileges locally

Severity: High for hosted/production deployment; Low for isolated local lab  
Status: Deferred with explicit deployment requirement

The Docker-created `qa_commerce` role currently owns the local database and has superuser/bootstrap privileges. This is convenient for migrations but violates least privilege for an application runtime identity.

Required before hosted/student/production deployment:

- separate migration/owner credentials from runtime application credentials;
- runtime role must not be SUPERUSER, CREATEDB, CREATEROLE, or REPLICATION;
- grant only the schema/table/sequence privileges required by the application;
- keep privileged credentials out of the application runtime.

This change is intentionally deferred until the backend is containerized/deployment configuration is introduced, so local migrations and the current learning environment are not broken mid-slice.

### SR-004 — Registration endpoint has no abuse rate limit

Severity: Medium  
Status: Contract decision required

Registration performs Argon2id hashing and sends email, so unrestricted repeated requests can consume CPU/email resources. The architecture already identifies Redis-backed rate limiting as a middleware concern.

The frozen Registration contract does not currently define a `429` response. Adding one would change externally observable API behavior. Do not silently change the implementation. Before hosted/public exposure, revise/version the contract with an agreed source-IP Registration limit and `429 RATE_LIMIT_EXCEEDED`, then implement/test it.

### SR-005 — Registration duplicate-email response enables account enumeration

Severity: Low/Medium depending on threat model  
Status: Accepted frozen-contract behavior

The frozen contract explicitly returns `409 EMAIL_ALREADY_REGISTERED`. This reveals that an email is registered. Forgot-password and resend flows intentionally use generic responses, but Registration currently makes a different product tradeoff.

Do not change implementation without a contract decision. Reconsider before public production deployment if account-enumeration resistance is a priority.

### SR-006 — Redis has no authentication

Severity: Medium if network-exposed; Low in current localhost-only local lab  
Status: Mitigated locally; deployment action required

Redis is now bound to localhost only in the local Compose environment. Before hosted deployment, Redis must remain on a private network and should use authentication/TLS as appropriate for the deployment platform. It must never be exposed directly to the public Internet.

### SR-007 — Mailpit is a development-only service

Severity: High if accidentally deployed publicly with real mail  
Status: Deployment guardrail required

Mailpit intentionally displays captured email, including verification secrets. It is appropriate for this QA lab only. Do not expose Mailpit publicly or use it for production email. Hosted student environments require controlled access/isolation.

## Database Security Notes

Current migrations correctly protect durable integrity with primary keys, foreign keys, uniqueness, role/status checks, non-negative attempt counters, and one-time-token state fields.

Cryptographic-format validation (for example, forcing a specific Argon2 string format in PostgreSQL) is intentionally not added as a database constraint because hashing algorithms may evolve. Cryptographic correctness remains enforced/tested in the application layer.

## Contract-Level Security Decisions Still Required Before Public Hosting

1. Registration abuse-rate-limit policy and its `429` contract.
2. Whether Registration should keep or remove the duplicate-email enumeration signal.
3. Trusted frontend origins and CORS policy.
4. HTTPS/reverse-proxy and trusted-proxy configuration.
5. Cookie `Secure`, `HttpOnly`, `SameSite`, path, rotation, and CSRF strategy when Refresh Token cookies are implemented.
6. Runtime DB least-privilege credentials.
7. Private/authenticated Redis deployment.
8. Controlled test-mailbox access for hosted students.

## Review Result

Registration has a strong baseline for a local QA lab: parameterized persistence, transaction safety, Argon2id, hashed one-time secrets, strict input validation, security headers, safe server errors, and no known npm dependency vulnerabilities at review time.

The project must not yet be described as production-secure. The deferred items above are mandatory gates before Internet-facing deployment, especially rate limiting, least-privilege database access, CORS/cookie/CSRF decisions, HTTPS, Redis isolation, and Mailpit access control.
