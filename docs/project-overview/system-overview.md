# System Overview

## Product

**QA Commerce API**

QA Commerce is a Jordan-based e-commerce platform for selling electronics and accessories. The backend exposes REST APIs used by customers and administrators to perform day-to-day commerce operations.

## Primary Actors

### Customer

A registered customer can:

- Manage their own profile
- Browse available products
- Create orders
- View their own orders
- View their own invoices

### Administrator

An administrator can:

- Create and update products
- Manage inventory
- View customer orders
- Update order status
- Manage users
- Review invoices
- Import products in bulk

### Guest

A guest has access only to public resources and can register or log in.

## Main Modules

- Authentication
- Users
- Products
- Categories
- Inventory
- Orders
- Discounts
- Invoices
- Bulk Import

## High-Level Business Flow

1. Customer registration
2. Login
3. Authentication credentials issued
4. Product browsing
5. Product and quantity selection
6. Order creation
7. Inventory validation
8. Subtotal calculation
9. Discount calculation
10. VAT calculation
11. Total calculation
12. Order persistence
13. Invoice generation
14. Inventory update

## Current QA Environment

| Field | Value |
|---|---|
| Environment | QA |
| Current Build | `0.9.0-RC1` |
| Current Sprint | Sprint 0 — Discovery & Test Analysis |
| API Execution | Not started |

API execution begins after requirement and API contract review are completed.
