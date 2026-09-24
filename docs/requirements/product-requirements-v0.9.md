# Product Requirements — v0.9

## Authentication

- **REQ-AUTH-001:** The system shall allow a new customer to register using First Name, Last Name, Email and Password.
- **REQ-AUTH-002:** The customer's email address must be unique.
- **REQ-AUTH-003:** Email addresses must use a valid email format.
- **REQ-AUTH-004:** Passwords must contain at least 8 characters, at least one uppercase letter, at least one lowercase letter, at least one number and at least one special character.
- **REQ-AUTH-005:** Registered users shall be able to log in using Email and Password.
- **REQ-AUTH-006:** A successful login shall return authentication credentials that can be used to access protected API resources.
- **REQ-AUTH-007:** Unauthenticated users shall not be able to access protected resources.

## Products

- **REQ-PROD-001:** The system shall allow customers to retrieve available products.
- **REQ-PROD-002:** Each product contains Product ID, Name, SKU, Description, Category, Price, Stock Quantity and Status.
- **REQ-PROD-003:** SKU must be unique.
- **REQ-PROD-004:** Product price must be greater than zero.
- **REQ-PROD-005:** Only administrators may create, update or delete products.

## Orders

- **REQ-ORD-001:** Authenticated customers shall be able to create orders.
- **REQ-ORD-002:** An order can contain one or more products.
- **REQ-ORD-003:** Customers cannot order quantities exceeding available inventory.
- **REQ-ORD-004:** An order shall calculate Subtotal, Discount, VAT and Total.
- **REQ-ORD-005:** VAT is calculated at 16%.
- **REQ-ORD-006:** A customer shall only be able to access their own orders.

## Invoices

- **REQ-INV-001:** A successful order shall generate an invoice.
- **REQ-INV-002:** An invoice shall contain Invoice Number, Customer, Order Reference, Line Items, Subtotal, Discount, VAT, Total and Creation Date.

## Bulk Import

- **REQ-BULK-001:** Administrators shall be able to import products using CSV, Excel and JSON.
- **REQ-BULK-002:** Invalid product records shall not be imported.

## Document Control

| Field | Value |
|---|---|
| Version | 0.9 |
| Status | Baseline for Sprint 0 review |
| Owner | Product / Business Analysis |
| QA Review Status | In Progress |
