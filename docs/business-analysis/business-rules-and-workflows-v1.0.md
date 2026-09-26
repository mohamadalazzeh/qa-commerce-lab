# Business Rules & Workflows — v1.0

## Document Purpose

This document summarizes the main business rules and lifecycle flows agreed during Sprint 0 requirement clarification. It complements the Product Requirements and User Stories/Acceptance Criteria documents.

**Status:** Draft for QA Review  
**Owner:** Product / Business Analysis  
**Related Documents:**
- `docs/requirements/product-requirements-v1.0.md`
- `docs/business-analysis/user-stories-and-acceptance-criteria-v1.0.md`

---

# 1. Account Lifecycle

Supported account states:

```text
PENDING_VERIFICATION
ACTIVE
DISABLED
```

Workflow:

```text
Registration
→ PENDING_VERIFICATION
→ Email Verification
→ ACTIVE
```

Administrative restriction:

```text
ACTIVE
→ DISABLED
→ ACTIVE
```

Business rules:

- A `PENDING_VERIFICATION` customer cannot authenticate as an active customer.
- A `DISABLED` customer cannot authenticate or refresh an authenticated session.
- Disabling an account does not delete historical Orders, Invoices or audit history.
- Customer data used by historical transactions remains available to authorized administration.

---

# 2. Authentication Session Lifecycle

```text
Login
→ Access Token + Refresh Token
```

Token rules:

```text
Access Token: 15 minutes
Refresh Token: 7 days
Refresh Token Rotation: enabled
```

Refresh workflow:

```text
Valid Refresh Token
→ New Access Token
→ New Refresh Token
→ Previous Refresh Token invalidated
```

Session termination conditions include:

- Logout.
- Account disablement.
- Successful password reset.
- Refresh Token expiration/revocation.

---

# 3. Password Recovery Workflow

```text
Forgot Password Request
→ Generic public response
→ OTP generated for eligible verified account
→ OTP sent by email
→ OTP verification
→ New password
→ Existing sessions revoked
```

Rules:

- OTP is six digits.
- OTP validity is 5 minutes.
- Maximum failed OTP attempts: 5.
- After five failed attempts, the current OTP becomes invalid.
- Successful OTP use invalidates the OTP immediately.
- OTP resend cooldown is 60 seconds.
- Reset responses must not expose whether an email address is registered.

---

# 4. Product Lifecycle

Supported product states:

```text
ACTIVE
INACTIVE
DISCONTINUED
```

Rules:

- SKU is unique using case-insensitive comparison.
- Product Name is not required to be unique.
- Currency is JOD.
- Product price uses two-decimal monetary precision and must be greater than zero.
- Stock Quantity is an integer greater than or equal to zero.
- Each Product can define a maximum order quantity.
- Product changes do not rewrite historical Order or Invoice snapshots.
- `DISCONTINUED`/inactive lifecycle handling is preferred over destroying historical business traceability.

---

# 5. Product Visibility & Catalog Behavior

- Guests and customers can browse eligible catalog products.
- Products with `Stock = 0` remain visible as Out of Stock.
- Out-of-stock products cannot be added to a cart.
- Product listing supports search, filtering, sorting and pagination.

---

# 6. Cart Workflow

```text
Browse Product
→ Add to Cart
→ Update Quantity / Remove Item
→ Revalidate Cart
→ Checkout
```

Rules:

- Guests may maintain a cart before login.
- Checkout requires an authenticated customer.
- Cart quantity cannot exceed available stock.
- Cart quantity cannot exceed the Product maximum order quantity.
- Adding to Cart does not reserve inventory.
- Current Product price is revalidated before Checkout.
- If price changes before Checkout, the cart reflects the latest price.
- If Product availability changes before Checkout, the Product must be revalidated.
- If cart quantity is greater than current stock, quantity is reduced to currently available stock and the customer is informed.

---

# 7. Order Lifecycle

Primary workflow:

```text
Cart
→ Checkout
→ PENDING
→ CONFIRMED
→ SHIPPED
→ DELIVERED
```

Additional states/workflows may include:

```text
CANCEL_REQUESTED
CANCELLED
RETURN_TO_SENDER
```

Key business rules:

- Only an authenticated customer may create/confirm an Order.
- Product price and stock are revalidated before confirmation.
- Stock is deducted only when confirmation succeeds.
- Inventory must never become negative.
- Concurrent attempts to purchase the last available unit must allow only one successful stock consumption.
- Duplicate/retried confirmation must not create duplicate Orders for the same intended checkout.
- Order Number is system-generated, unique and immutable.
- Confirmed Order line items preserve historical Product Name, SKU, Unit Price and purchase values.

---

# 8. Order Calculation Rules

Calculation order:

```text
Subtotal
- Product-level Discount
= Net Amount

Net Amount × 16%
= VAT

Net Amount + VAT
= Total
```

Rules:

- Discounts are Product-level percentage discounts.
- Discount percentage does not multiply when quantity increases; the discount amount increases with quantity.
- VAT is 16% and is calculated after discount.
- Final monetary values are rounded to two decimal places.
- Shipping fees are outside the current Version 1 calculation scope unless added by a later approved requirement.

---

# 9. Order History & Audit Trail

The current Order status is stored on the Order record, while status changes are recorded separately as history.

Example:

```text
PENDING
→ CONFIRMED
→ SHIPPED
→ DELIVERED
```

Each status history record includes:

- Order reference.
- Previous status.
- New status.
- Actor/user who performed the change.
- Timestamp.
- Optional note/reason.

Rules:

- A new history entry is added for each business-critical status transition.
- Existing history is not overwritten by later changes.
- Order history is used for audit, support investigation and QA database validation.

---

# 10. Administrative Order Search

Authorized administrators can locate historical sales/orders using supported filters such as:

- Order Number.
- Date/date range.
- Customer name/email.
- Product Name.
- SKU.
- Order Status.

Historical Order details retain the values that applied at purchase time.

---

# 11. Cancellation Workflow

Customer-facing cancellation is request-based rather than physical deletion of an Order.

```text
Eligible Order
→ Customer submits Cancel Request
→ CANCEL_REQUESTED
→ Admin Approves or Rejects
```

Approved path:

```text
CANCEL_REQUESTED
→ CANCELLED
→ Inventory/Refund handling according to fulfillment/payment stage
```

Rules:

- A customer can request cancellation only for their own eligible Order.
- Cancellation requests record a reason and may include a note.
- Orders are not hard-deleted as part of cancellation.
- Administrator approval/rejection is auditable.
- Final status-based cancellation eligibility remains an open business item before API contract freeze.

---

# 12. Return Workflow

Delivered items use a Return Request workflow.

```text
DELIVERED
→ RETURN_REQUESTED
→ RETURN_APPROVED / RETURN_REJECTED
→ ITEM_RECEIVED
→ INSPECTED
→ RETURNED
→ REFUND_PROCESSING
```

Rules:

- Partial returns are supported.
- A customer may request return of one or more eligible items without reversing unrelated Order items.
- A Return Request does not immediately increase available stock.
- Sellable stock is restored only after the returned item is physically received and approved as sellable.
- A returned item that is not sellable is not added to available inventory.
- Return status changes are auditable.

---

# 13. Refund Rules

Payment states:

```text
PENDING
PAID
FAILED
REFUND_PENDING
REFUNDED
```

Rules:

- Version 1 uses a simulated payment workflow rather than a live payment gateway.
- A customer cannot directly mark a payment as refunded.
- Refund requires an approved cancellation/return condition.
- Refund uses historical purchase values rather than the current Product price.
- Applicable historical discount and VAT are considered when calculating item refund values.
- Return/cancellation fee policy remains subject to final business clarification.

---

# 14. Invoice Workflow

```text
Order Confirmation Successful
→ Invoice Generated
```

Invoice rules:

- Invoice Number is system-generated, unique and immutable.
- Invoice references the related Customer and Order.
- Invoice contains line items, quantities, unit prices, Subtotal, Discount, VAT, Total and Creation Date.
- Invoice values come from the confirmed Order snapshot.
- Product data changes after invoice generation do not modify the issued Invoice.
- Issued invoice values are treated as historical financial data and are not rewritten for later returns.

---

# 15. Credit Note / Return Invoice Workflow

When a later return/refund requires a financial adjustment:

```text
Original Invoice
→ Approved Return/Refund
→ Credit Note / Return Invoice
```

Rules:

- The adjustment document references the original Invoice.
- Partial return adjusts only affected item(s).
- Historical purchase price, discount and VAT are used.
- The Credit Note has its own identifier and creation date.
- The original Invoice remains unchanged.

---

# 16. Bulk Product Import Workflow

Supported formats:

```text
CSV
Excel
JSON
```

Processing approach:

```text
Validate File Structure
→ Read Record
→ Apply Product Validation
→ Import Valid Record
→ Reject Invalid Record
→ Build Import Summary
```

Rules:

- Only administrators can import Products in bulk.
- Row-level Product validation follows the same core rules as normal Product creation.
- Partial import is supported: valid rows are imported while invalid rows fail independently.
- Duplicate SKU validation is case-insensitive.
- Duplicate SKU rows are rejected according to import rules.
- Existing database SKU is rejected by Version 1 bulk-create flow; it is not silently updated.
- Missing mandatory file structure causes file-level rejection before normal row processing.
- Maximum file size: 5 MB.
- Maximum record count: 10,000.
- Import result includes total, imported and failed counts plus row/record-level failure reasons.

---

# 17. Authorization Model

Roles currently in scope:

```text
Guest
Customer
Administrator
```

General rules:

- Public catalog access is available to Guests.
- Protected customer actions require authentication.
- Customer-owned resources are isolated from other customers.
- Customer A cannot access Customer B's private Cart, Order, Invoice or Return resources.
- Administrator-only operations are enforced by the backend.
- UI visibility alone is not considered an authorization control.

The final `403 Forbidden` versus `404 Not Found` policy for unauthorized access to another customer's existing resource must be confirmed before the API contract is frozen.

---

# 18. Data Integrity & Persistence

Core business data is stored in PostgreSQL.

Key principles:

- API write operations persist real data.
- Historical transaction records use snapshots where later master-data changes must not alter the original transaction.
- Relational integrity is enforced using appropriate keys and constraints.
- Multi-step critical operations such as Order confirmation use database transactions so related writes succeed together or roll back together.
- API responses can be validated against database state through SQL during QA execution.

---

# 19. Open Business Clarifications

The following decisions remain intentionally open until the final pre-contract review:

1. `403 Forbidden` versus `404 Not Found` for cross-customer resource probing.
2. Exact administrator/customer 2FA delivery and recovery mechanism.
3. Guest cart persistence duration and browser/session behavior.
4. Exact cancellation eligibility by fulfillment status.
5. Return eligibility period after delivery.
6. Return/cancellation fee policy by reason and delivery stage.
7. Exact API-level idempotency mechanism for checkout/order confirmation.
8. Final rounding rule for any line-level versus order-level VAT fractional difference.

These items must be resolved before the OpenAPI contract is finalized.
