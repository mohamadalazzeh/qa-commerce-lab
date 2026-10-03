# QA Commerce Lab — Current Checkpoint

## How to Resume

Use this file together with `docs/project-management/project-continuity.md`.

Suggested message:

> Continue QA Commerce Lab from `mohamadalazzeh/qa-commerce-lab`. Authentication API Contract v1.0 is frozen. Do not implement backend yet. First discuss the backend architecture/implementation plan with me. After that, start the Authentication backend/API, Dockerized PostgreSQL/Redis/Mailpit environment, then execute Postman + DB validation while writing Detailed Test Cases during real testing.

---

## Current Module

```text
Authentication
```

## Pre-Backend Finalization Status

```text
1. Admin Invitation API details                     ✅ DONE
2. Verification Resend response/security details    ✅ DONE
3. Authentication DB relationships/transactions     ✅ DONE
4. Final API Contract consistency/OpenAPI review     ✅ DONE
```

## Frozen Sources of Truth

```text
api-contract/authentication-api-contract-v1.0.md
docs/business-analysis/authentication-data-model-v1.0.md
qa/test-scenarios/authentication-test-scenarios-v1.0.md
qa/uat/authentication-uat-v1.0.md
```

The former working draft `api-contract/authentication-api-contract-draft-v1.0.md` is superseded and retained only as a Git-history pointer.

---

## Final Review Additions / Fixes

The final consistency review added or clarified:

```text
GET /api/v1/admin/admin-invitations
→ supports the approved Manage Invitations UX

Login error precedence
→ wrong credentials remain 401 and do not expose pending/disabled/locked state

Bootstrap Admin password-change flow
→ restricted passwordChangeToken is sent as Bearer authorization

Refresh / Logout
→ Refresh Token rotation + HttpOnly cookie behavior normalized
→ Logout is current-session-only and idempotent from the client perspective

Password Reset OTP
→ public invalid/expired/unknown recovery state uses generic INVALID_OTP behavior

Email Verification
→ repeated/used verification behavior and disabled-account behavior clarified

Email delivery failures
→ recoverable behavior defined without silently deleting already-created resources
```

---

## Authentication Contract Status

```text
Authentication API Contract v1.0 = FROZEN ✅
```

There is no separate frozen OpenAPI YAML/JSON yet. The frozen contract is the authoritative source that the backend's Swagger/OpenAPI definition must implement one-to-one. Any mismatch is a contract defect.

---

## Important Stop Point

**Do not start backend implementation yet.**

The next activity is:

```text
Discuss backend architecture / implementation plan with the user
```

Only after that discussion:

```text
Build Authentication backend/API
→ Docker Compose
→ PostgreSQL
→ Redis
→ Mailpit
→ OpenAPI / Swagger
→ Postman execution
→ Detailed Test Cases during real execution
→ SQL / DB validation
→ Bugs / Retest / Regression
```
