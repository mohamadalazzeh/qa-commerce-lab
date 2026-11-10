# QA Commerce Lab

**Manual QA & API Testing Portfolio | SaaS-style E-commerce Backend**

QA Commerce Lab is a practical, non-production project demonstrating the software testing lifecycle: analyzing requirements, reviewing an API contract, designing positive/negative/boundary tests, running API checks, validating PostgreSQL state, documenting defects and building regression coverage.

## Portfolio Case Study

**[Customer Registration API — QA Case Study (evidence in progress)](portfolio/registration-case-study.md)**

The first implemented endpoint is `POST /api/v1/auth/register`. The Registration API is code-complete according to the project's development checkpoint. The Postman collection and SQL queries are ready; a completed, evidenced manual Postman execution run is still pending.

This distinction is intentional: prepared test cases are not reported as executed test results.

## Current Scope

| Area | Status |
| --- | --- |
| Requirements, business rules and acceptance criteria | Documented |
| Authentication API contract and data model | Documented |
| Registration endpoint and underlying PostgreSQL schema | Implemented |
| Registration-focused developer automated tests | Present in repository |
| Postman Registration collection | Prepared: 26 normal requests and 1 isolated mail-failure request |
| SQL database validation | Prepared |
| Completed manual Registration run and redacted evidence | Pending |
| Other Authentication workflows | Designed; not claimed as implemented here |
| Products, Orders, Invoices and other commerce features | Future scope |

## Explore the QA Work

- [Portfolio case study](portfolio/registration-case-study.md)
- [Requirements](docs/requirements/product-requirements-v1.0.md)
- [Business rules and workflows](docs/business-analysis/business-rules-and-workflows-v1.0.md)
- [User stories and acceptance criteria](docs/business-analysis/user-stories-and-acceptance-criteria-v1.0.md)
- [Authentication API contract](api-contract/authentication-api-contract-v1.0.md)
- [QA test scenarios](qa/test-scenarios/authentication-test-scenarios-v1.0.md)
- [Postman collection and instructions](qa/postman/README.md)
- [SQL validation queries](qa/sql/registration-validation.sql)
- [Developer test suite](backend/tests/auth)
- [Current development checkpoint](docs/project-management/current-checkpoint.md)

## Technology

TypeScript, Node.js, Express, REST APIs, PostgreSQL, Redis, Mailpit, Docker Compose, Postman, SQL, Vitest and OpenAPI/Swagger.

## Project Evolution

The broader application aims to cover authentication, products, inventory, orders, discounts, tax calculations and invoicing. These are a roadmap, **not a claim that each feature has been implemented or tested**.

This repository is an educational lab and portfolio example, not a deployed client system. No real customer credentials or production data should be published.
