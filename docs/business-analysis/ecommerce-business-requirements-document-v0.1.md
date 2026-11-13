# Business Requirements Document (BRD)
## QA Commerce Lab — E-Commerce Platform

| Document control | Details |
|---|---|
| Document ID | QCL-BRD-001 |
| Version | 0.1 |
| Status | **Draft — for business/QA review, not approved** |
| Prepared | 13 November 2026 |
| Project | QA Commerce Lab |
| Business domain | Jordan-based electronics and accessories e-commerce |
| Business owner / Sponsor | To be assigned (simulated project) |
| Prepared by | Project Business Analysis / QA |
| Related phase | Sprint 0 — Discovery & Test Analysis |
| Current technical focus | Authentication backend and API/DB QA |

> **Scope note:** This BRD describes the **target e-commerce business** and its planned customer-facing website. The repository currently prioritizes an API/backend QA lab. Full customer/admin frontend implementation is **explicitly out of scope for Product Requirements v1.0**; website delivery is a **future phase/proposal**, not an implemented or approved v1 feature. See Section 5 and the decisions log.

---

## 1. Executive Summary

QA Commerce Lab models a Jordanian online retailer selling electronics and accessories. Customers should ultimately be able to browse products, manage a cart, place orders and view invoices, while authorized administrators manage products, stock, orders, returns and financial records.

The project is a practical quality engineering lab, not a claim that a live commercial store or production website has launched. Its business requirements establish **what outcomes the system should support**; detailed rules are maintained separately in Product Requirements, User Stories and API Contracts. The initial delivery focuses on a working, testable backend, with a website as a later business-facing channel.

## 2. Business Background and Problem

An online store needs a consistent way to manage catalog data, customer access, availability, checkout calculations, order history, invoices and post-sale exceptions. Without documented business rules, teams risk inconsistent pricing, overselling stock, unauthorized access to customer data, and conflicting order/invoice records.

The business opportunity is to provide a single, traceable commerce workflow where customers can purchase confidently and authorized staff can manage operational data without losing the history of completed transactions.

## 3. Business Objectives and Success Measures

| ID | Business objective | Evidence / measure | Target |
|---|---|---|---|
| BO-01 | Enable customers to discover eligible products | Product browse/search/filter journey works | Acceptance outcome; numeric KPI TBD |
| BO-02 | Support controlled customer onboarding and access | Registration, email verification and role-based access follow agreed rules | Requirements/QA evidence |
| BO-03 | Prevent incorrect orders and overselling | Order totals, stock checks and duplicate-request controls validated | No known critical failures at release gate |
| BO-04 | Maintain trustworthy financial history | Confirmed orders, invoices, credits and history reconcile | Traceable records and test evidence |
| BO-05 | Support manageable after-sales operations | Cancellation/return/refund paths and audit trail documented and tested | Business acceptance evidence |
| BO-06 | Produce reviewable QA evidence | Requirements trace to tests, defects and results | Traceability coverage defined before release |

**No conversion, revenue, response-time or uptime percentages have been approved.** Quantitative KPIs and release thresholds require a product-owner decision.

## 4. Stakeholders and User Groups

| Role | Main interest / responsibility |
|---|---|
| Business Sponsor / Product Owner (TBD) | Approve business scope, priorities and open policies |
| Business Analyst | Document requirements, workflows, decisions and traceability |
| QA Engineer | Review testability, define scenarios, validate behavior and risks |
| Backend Developer | Implement and maintain APIs, rules and persistence |
| Future UI/UX / Frontend team | Design accessible website and administrator interfaces in a later phase |
| Guest | Browse publicly available catalog and register/login |
| Customer | Verify account, manage own cart/orders/returns and view own invoices |
| Administrator | Maintain products, inventory, order operations, users, invoices and imports |

These are **project roles**, not evidence of named people having formally signed off.

## 5. Product Scope and Delivery Boundaries

### 5.1 Target business capabilities (end-state vision)

1. **Customer account and security:** registration, email verification, login, recovery, account state and access protection.
2. **Catalog:** electronics and accessories, categories, search, filter, sort, pagination and stock visibility.
3. **Shopping cart and checkout:** guest/customer cart, quantity limits, address capture and checkout validation.
4. **Orders and inventory:** confirmation, quantity protection, status tracking, order history and operational updates.
5. **Financial records:** discounts, JOD amounts, VAT, invoices, credit notes and payment-state tracking.
6. **After sales:** cancellation, partial returns, receipt/inspection, stock restoration and refunds.
7. **Administration:** authorized catalog, inventory, order/user management, history search and bulk product import.

### 5.2 Delivery phase distinction

| Scope | Current documented position |
|---|---|
| **Phase A — Backend/API QA foundation** | Existing repository focus; Authentication is the current implemented/tested slice |
| **Phase B — Remaining commerce modules** | Requirements defined; delivery/testing proceeds incrementally by module |
| **Phase C — Customer website and admin UI** | **Proposed future scope**; no approved frontend design, release date or implementation baseline yet |

### 5.3 Explicit Version 1 exclusions

Per Product Requirements v1.0: live payment gateway integration, full customer/admin frontend implementation, external courier integration, bulk updates of existing products, and CI/CD / automated regression in the initial version. Those may be considered later through approved change control.

**Do not infer that a polished customer website already exists from this BRD.**

## 6. High-Level Business Requirements

The following IDs are BRD-level capability statements. They summarize existing baseline requirements; detailed field validation and technical acceptance belong to the linked source documents.

| ID | Business requirement | Priority | Source domain |
|---|---|---|---|
| BR-001 | A guest shall be able to browse products available to the public. | Must | REQ-PROD |
| BR-002 | A new customer shall be able to register and verify ownership of an email before account activation. | Must | REQ-AUTH |
| BR-003 | An eligible active customer shall securely access their own account and protected resources. | Must | REQ-AUTH |
| BR-004 | Authorized administrators shall manage product catalog and category-related business information. | Must | REQ-PROD |
| BR-005 | Guests and customers shall be able to prepare a cart, but authenticated access is required to confirm an order. | Must | REQ-CART |
| BR-006 | Checkout shall revalidate product eligibility, stock, price and quantity limits before confirmation. | Must | REQ-CART / REQ-ORD / REQ-INVTRY |
| BR-007 | Successful order confirmation shall create consistent order records and reduce stock without overselling. | Must | REQ-ORD / REQ-INVTRY / REQ-DATA |
| BR-008 | Order totals shall apply product discounts before 16% VAT and preserve financial precision. | Must | REQ-ORD / REQ-INVOICE |
| BR-009 | Customers shall access only their own orders, invoices and after-sales records. | Must | REQ-ORD / REQ-HIST / authorization |
| BR-010 | Order and invoice history shall preserve the business facts that applied when the transaction occurred. | Must | REQ-ORD / REQ-HIST / REQ-INVOICE |
| BR-011 | Customers shall be able to request eligible cancellations and partial returns, subject to administrator decisions. | Must | REQ-RET |
| BR-012 | Refund/credit adjustments shall use original transaction values and maintain traceability to the original invoice. | Must | REQ-RET / REQ-INVOICE |
| BR-013 | Authorized administrators shall be able to manage account states and business operations without destroying history. | Must | REQ-AUTH / REQ-ORD |
| BR-014 | Authorized administrators shall be able to import products using supported file formats with clear validation feedback. | Should | REQ-BULK |
| BR-015 | The system shall record relevant state changes for audit, investigation and customer service. | Must | REQ-HIST / REQ-DATA |
| BR-016 | A future customer website should present these journeys clearly and accessibly when website scope is approved. | Proposed | Website scope decision pending |

**Priority** is an initial BA recommendation, not a formally approved prioritization. **BR-016** is a proposal, not a claim about the existing backend or v1 commitments.

## 7. Business Workflows

### 7.1 Customer acquisition and activation
Guest browses → selects Register → provides required information → account becomes **PENDING_VERIFICATION** → email verification succeeds → account becomes **ACTIVE** → customer may log in.

### 7.2 Purchase journey
Browse/search → add eligible items to cart → sign in if required → review cart/current price and availability → provide delivery address → confirm order → validate stock and amounts → record order and deduct stock → create invoice → view order history.

### 7.3 Administration journey
Authorized admin maintains products/stock → monitors orders → records permissible status transitions → processes cancellations, returns and refund states → reviews history/invoices.

### 7.4 Return and credit journey
Customer requests eligible return → administrator reviews → item received and inspected → sellable stock restored only if approved → refund calculated from original purchase values → separate credit note if required → original invoice unchanged.

These describe business journeys, **not evidence that every endpoint or UI step has been built**.

## 8. Key Business Rules (summary)

| ID | Rule |
|---|---|
| BBR-01 | Public registration creates a **Customer**, not an Administrator; accounts begin at **PENDING_VERIFICATION**. |
| BBR-02 | Email is unique case-insensitively; verified activation is required before normal authenticated use. |
| BBR-03 | Only authorized actors may access protected resources; customers may not view other customers' private records. |
| BBR-04 | Product SKU uniqueness is case-insensitive; prices are positive and expressed in **JOD**. |
| BBR-05 | Products with zero stock may remain visible, but cannot be purchased; inactive/discontinued items are not purchasable. |
| BBR-06 | A cart does **not** reserve inventory. Stock and price are checked again at order confirmation. |
| BBR-07 | Product-level percentage discounts are applied **before VAT**; VAT is **16%** on the discounted net amount; final amounts use two decimals. |
| BBR-08 | Concurrent or repeated confirmation attempts must not oversell stock, create unintended duplicate orders or double-deduct stock. |
| BBR-09 | Confirmed orders and issued invoices preserve historical values even after catalog changes. |
| BBR-10 | Cancellations and returns follow request/approval flows; orders are not deleted to represent cancellation. |
| BBR-11 | Returned stock becomes sellable only after physical receipt and sellability approval. |
| BBR-12 | Refunds and credit notes use historical purchase, discount and VAT data, not current catalog prices. |
| BBR-13 | Version 1 tracks payment states **without** a live external payment gateway. |
| BBR-14 | Normal administration should preserve historical customer, order, invoice and audit references. |

Detailed field lengths, token lifetimes, HTTP statuses and API response payloads remain in the Product Requirements and Authentication API Contract; they are intentionally not duplicated here.

## 9. Business-Level Quality and Compliance Needs

- **Security and privacy:** appropriate authorization, protected credentials, safe account recovery and reduced data exposure.
- **Integrity:** consistent inventory, financial amounts, order transitions and database persistence.
- **Auditability:** traceable order and financial changes, including actor and timestamp where required.
- **Usability (future UI):** clear customer journeys, understandable errors, accessible navigation and responsive experience; precise standards require approval.
- **Reliability and performance:** business-critical paths must be testable under representative use, but no numeric service level has been approved.
- **Maintainability and testability:** requirements must map to acceptance criteria, API behavior, data validation and test evidence.
- **Regulatory:** Jordan tax/invoicing applicability and any production privacy obligations require business/legal confirmation; the training project does not assert legal certification.

## 10. Assumptions, Constraints and Dependencies

| Type | Item | Consequence |
|---|---|---|
| Confirmed context | Business domain is Jordan electronics/accessories retail | Use JOD and documented 16% VAT calculation |
| Constraint | Product Requirements v1.0 excludes full frontend and live external payments | Website/payment gateway need separate scope approval |
| Dependency | Authentication precedes protected customer purchasing | Must validate activation and access controls |
| Dependency | Inventory/order/invoice rules must agree | Requires cross-module business acceptance and data checks |
| Assumption | Product Owner / sponsor approval is simulated or TBD | BRD remains **Draft** until reviewed |
| Assumption | Storefront UI is an intended future learning/delivery target | Do not present UI as implemented |
| Constraint | Build the backend incrementally; do not prebuild the complete database schema | Module-specific plans and migrations |
| Dependency | Test evidence and requirement traceability are maintained in repo | Backlog, QA assets and release gates need review |

## 11. Key Risks and Proposed Mitigations

| Risk | Business impact | Mitigation |
|---|---|---|
| Frontend vision confused with API-only v1 | Uncontrolled scope / false expectations | Explicit phase boundary; confirm website roadmap |
| Unresolved checkout/return policies | Inconsistent outcomes and defects | Clarification log before contract/test baseline |
| Pricing or VAT errors | Incorrect customer charges/invoices | Scenario review, financial examples and DB reconciliation |
| Inventory race conditions | Overselling and negative stock | Concurrency-focused acceptance and validation |
| Weak authorization | Exposure of customer records | Owner-scope testing and admin-role checks |
| Stale sprint records | Misleading portfolio and planning state | Reconcile sprint backlog versus actual evidence |
| Unreviewed BRD presented as approved | Misleading governance | Draft status, decision log and explicit sign-off |

## 12. Open Decisions / Clarifications

| ID | Decision required | Owner / state |
|---|---|---|
| DEC-01 | Is the customer-facing e-commerce website a formally approved next phase? Define UI scope, platform and release boundaries. | Product Owner — **OPEN** |
| DEC-02 | Define and approve measurable business KPIs, non-functional thresholds and launch acceptance. | Product Owner — **OPEN** |
| DEC-03 | Finalize guest cart persistence/merge behavior and public visibility rules for inactive products. | Product/BA — **OPEN** |
| DEC-04 | Finalize unauthorized cross-customer resource response policy and admin 2FA mechanism. | Product/Security/API — **OPEN** |
| DEC-05 | Finalize cancellation eligibility windows, return eligibility period and return/shipping fee rules. | Product/Operations — **OPEN** |
| DEC-06 | Approve checkout idempotency strategy and exact monetary rounding corner cases. | Product/Backend/QA — **OPEN** |
| DEC-07 | Reconcile Sprint 0 task statuses with later Authentication implementation and executed Registration test evidence. | Project/QA — **OPEN** |

## 13. High-Level Business Acceptance and Exit Criteria

A business scope increment is ready for acceptance when:

1. The owner approves the increment's scope and any unresolved decisions affecting it.
2. Key customer/admin journeys have approved acceptance criteria and traceable requirements.
3. Business rules for access, pricing, tax, inventory, order history and refunds are reviewable/testable.
4. Significant defects and remaining risks are visible to the approver.
5. Relevant QA evidence is recorded, including API response and persisted state where applicable.
6. Any website release is assessed **separately** from the backend-only current baseline.

Meeting a single API test (e.g., successful registration) does **not** prove all BRD outcomes are delivered.

## 14. Traceability and Reference Documents

| Source | Location |
|---|---|
| System Overview | [docs/project-overview/system-overview.md](../project-overview/system-overview.md) |
| Product Requirements v1.0 (detailed, draft) | [docs/requirements/product-requirements-v1.0.md](../requirements/product-requirements-v1.0.md) |
| User Stories and Acceptance Criteria | [docs/business-analysis/user-stories-and-acceptance-criteria-v1.0.md](user-stories-and-acceptance-criteria-v1.0.md) |
| Business Rules and Workflows | [docs/business-analysis/business-rules-and-workflows-v1.0.md](business-rules-and-workflows-v1.0.md) |
| Sprint 0 backlog | [docs/sprints/sprint-0.md](../sprints/sprint-0.md) |
| Authentication API Contract v1.0 | [api-contract/authentication-api-contract-v1.0.md](../../api-contract/authentication-api-contract-v1.0.md) |
| Project Continuity | [docs/project-management/project-continuity.md](../project-management/project-continuity.md) |

**Source hierarchy:** BRD captures the **business why/what**; Product Requirements and approved clarifications define **detailed rules**; User Stories and Acceptance Criteria define user-facing outcomes; API Contracts define technical request/response behavior. Where versions conflict or decisions remain open, do not silently treat this draft as approval.

## 15. Review, Change Control and Sign-off

| Review role | Name | Decision | Date |
|---|---|---|---|
| Business Sponsor / Product Owner | TBD | Pending | — |
| Business Analysis | TBD | Pending | — |
| QA Representative | TBD | Pending | — |
| Technical Lead | TBD | Pending | — |

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-13 | Initial business-level BRD compiled from existing repo baselines; explicitly distinguishes future website vision from current API scope. |

> **Approval status:** This is a professional project **draft**, not a signed business contract or evidence of completed e-commerce features.
