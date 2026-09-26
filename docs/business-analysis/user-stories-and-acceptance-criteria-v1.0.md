# User Stories & Acceptance Criteria — v1.0

## Document Purpose

This document translates the approved Product Requirements v1.0 into user-focused behavior that can be reviewed by QA before API contract design and implementation.

It is intentionally written at the business/acceptance level. It does not contain test cases.

**Status:** Draft for QA Review  
**Owner:** Product / Business Analysis  
**Related Baseline:** `docs/requirements/product-requirements-v1.0.md`

---

# 1. Authentication & Account Management

## US-AUTH-01 — Customer Registration

**As a** new customer  
**I want to** create an account  
**So that** I can use customer features and place orders.

### Acceptance Criteria

- **AC1:** A customer can register using First Name, Last Name, Email and Password.
- **AC2:** First Name and Last Name must satisfy the configured validation rules.
- **AC3:** Email must use a valid format and must be unique using case-insensitive comparison.
- **AC4:** Password must satisfy the configured password policy.
- **AC5:** Successful registration creates the account with status `PENDING_VERIFICATION`.
- **AC6:** The system sends an email verification message to the registered email address.
- **AC7:** The customer is not automatically authenticated before email verification succeeds.

## US-AUTH-02 — Email Verification

**As a** registered customer  
**I want to** verify my email address  
**So that** I can activate my account and authenticate.

### Acceptance Criteria

- **AC1:** A valid unused verification token activates the related customer account.
- **AC2:** Successful verification changes the account status from `PENDING_VERIFICATION` to `ACTIVE`.
- **AC3:** Invalid, expired or previously used verification tokens must not activate an account.
- **AC4:** A verification token cannot be successfully reused after activation.

## US-AUTH-03 — Customer Login

**As an** active registered customer  
**I want to** authenticate using my email and password  
**So that** I can access protected customer resources.

### Acceptance Criteria

- **AC1:** An `ACTIVE` customer can authenticate using valid Email and Password.
- **AC2:** Invalid email and invalid password attempts return the same generic authentication failure response.
- **AC3:** Failed authentication returns HTTP `401 Unauthorized`.
- **AC4:** A `DISABLED` account cannot authenticate.
- **AC5:** After five consecutive failed login attempts, the account is temporarily locked for 15 minutes.
- **AC6:** Login requests are rate limited and requests exceeding the configured limit return HTTP `429 Too Many Requests`.
- **AC7:** Successful login issues an Access Token and a Refresh Token.

## US-AUTH-04 — Refresh Session

**As an** authenticated user  
**I want to** refresh my session  
**So that** I can continue using protected resources without logging in again each time the Access Token expires.

### Acceptance Criteria

- **AC1:** Access Tokens expire after 15 minutes.
- **AC2:** Refresh Tokens expire after 7 days.
- **AC3:** A valid Refresh Token can be exchanged for a new Access Token.
- **AC4:** Refresh Token Rotation is used; a successful refresh issues a new Refresh Token and invalidates the previously used Refresh Token.
- **AC5:** Expired, revoked or previously used Refresh Tokens must not create new Access Tokens.
- **AC6:** A `DISABLED` account cannot obtain new Access Tokens using an existing Refresh Token.

## US-AUTH-05 — Logout

**As an** authenticated user  
**I want to** log out  
**So that** my active session can no longer be reused.

### Acceptance Criteria

- **AC1:** Logout invalidates the active Refresh Token/session.
- **AC2:** A revoked Refresh Token cannot be used to obtain new Access Tokens.
- **AC3:** Logging out does not delete the customer account or historical business records.

## US-AUTH-06 — Password Recovery

**As a** registered customer who forgot my password  
**I want to** reset my password using a verified recovery method  
**So that** I can regain access to my account.

### Acceptance Criteria

- **AC1:** A password reset request is accepted for a registered account with a verified email address.
- **AC2:** The public response must not disclose whether a submitted email address is registered.
- **AC3:** The system sends a six-digit password reset OTP to the registered verified email address when an eligible account exists.
- **AC4:** A password reset OTP remains valid for 5 minutes.
- **AC5:** The OTP allows a maximum of five failed verification attempts.
- **AC6:** After five failed attempts, the current OTP is invalidated and a new OTP must be requested.
- **AC7:** A successfully used OTP is invalidated immediately and cannot be reused.
- **AC8:** A new OTP cannot be requested more frequently than the configured 60-second resend cooldown.
- **AC9:** A new password must satisfy the configured password policy.
- **AC10:** Successful password reset revokes existing authentication sessions/tokens for the account.

## US-AUTH-07 — Account Status Management

**As an** administrator  
**I want to** disable or re-enable customer accounts  
**So that** account access can be controlled without losing historical records.

### Acceptance Criteria

- **AC1:** An administrator can change an eligible customer account between `ACTIVE` and `DISABLED`.
- **AC2:** A disabled customer cannot log in.
- **AC3:** A disabled customer cannot use an existing Refresh Token to obtain a new Access Token.
- **AC4:** Disabling a customer does not delete historical Orders or Invoices.
- **AC5:** Historical customer business records remain available to authorized administrators.

## US-AUTH-08 — Two-Factor Authentication

**As an** administrator  
**I want to** authenticate using a second factor  
**So that** privileged access has additional protection.

### Acceptance Criteria

- **AC1:** Two-factor authentication is required for administrator authentication.
- **AC2:** Successful password authentication alone is insufficient to complete an administrator login when 2FA is required.
- **AC3:** Invalid or expired second-factor verification must not create an authenticated administrator session.
- **AC4:** Customer 2FA may be enabled as an optional account security feature.

---

# 2. Products

## US-PROD-01 — Browse Products

**As a** guest or customer  
**I want to** browse the product catalog  
**So that** I can review available products before purchasing.

### Acceptance Criteria

- **AC1:** Guests and customers can retrieve products that are visible in the catalog.
- **AC2:** Product data includes Product ID, Name, SKU, Description, Category, Price, Stock Quantity/availability and Status as applicable to the API response.
- **AC3:** Products with zero available stock remain visible as `Out of Stock`.
- **AC4:** Products with zero available stock cannot be added to a cart.
- **AC5:** Product listing supports search, filtering, sorting and pagination.

## US-PROD-02 — Create Product

**As an** administrator  
**I want to** create products  
**So that** new items can be offered through the store.

### Acceptance Criteria

- **AC1:** Only an administrator can create a product.
- **AC2:** SKU is required and unique using case-insensitive comparison.
- **AC3:** Product Name may be shared by multiple products when their SKUs differ.
- **AC4:** Price must be greater than zero and use JOD with two-decimal monetary precision.
- **AC5:** Stock Quantity must be an integer greater than or equal to zero.
- **AC6:** Each product may define a maximum order quantity.
- **AC7:** Product status must be one of the supported states: `ACTIVE`, `INACTIVE` or `DISCONTINUED`.

## US-PROD-03 — Maintain Product

**As an** administrator  
**I want to** update product data and lifecycle status  
**So that** the catalog reflects current business availability.

### Acceptance Criteria

- **AC1:** Only an administrator can update product data or status.
- **AC2:** Product updates must continue to satisfy product validation rules.
- **AC3:** Updating current product data must not modify historical Order or Invoice snapshots.
- **AC4:** Products no longer offered for sale can be made `INACTIVE` or `DISCONTINUED` without deleting historical transaction data.

---

# 3. Cart

## US-CART-01 — Manage Cart

**As a** guest or customer  
**I want to** add, update and remove items in my cart  
**So that** I can prepare the products I intend to purchase.

### Acceptance Criteria

- **AC1:** A guest can add eligible products to a cart without authenticating.
- **AC2:** A customer can add eligible products to their cart.
- **AC3:** A cart item quantity cannot exceed current available stock.
- **AC4:** A cart item quantity cannot exceed the product's configured maximum order quantity.
- **AC5:** Cart items can be removed without deleting the Product itself from the catalog.
- **AC6:** Checkout/Create Order requires an authenticated customer.

## US-CART-02 — Revalidate Cart Before Checkout

**As a** customer  
**I want the cart to reflect current product conditions before checkout  
**So that** I do not confirm an order using outdated price or availability information.

### Acceptance Criteria

- **AC1:** Product price is revalidated before checkout.
- **AC2:** If the current product price changed after the item was added to the cart, the cart reflects the latest price before confirmation.
- **AC3:** If a cart item becomes `INACTIVE` or otherwise unavailable, it cannot be successfully included in checkout.
- **AC4:** If available stock becomes lower than the quantity currently stored in the cart, the cart quantity is reduced to the available quantity and the customer is informed of the change.
- **AC5:** Adding an item to a cart does not reserve inventory.

---

# 4. Orders & Inventory

## US-ORD-01 — Create and Confirm Order

**As an** authenticated customer  
**I want to** create an order from my cart  
**So that** I can purchase the selected products.

### Acceptance Criteria

- **AC1:** Only an authenticated customer can create/confirm an order.
- **AC2:** An order contains one or more eligible products.
- **AC3:** Product price and inventory are revalidated before order confirmation.
- **AC4:** Requested quantity must not exceed current available stock or the product's maximum order quantity.
- **AC5:** Inventory is deducted only when order confirmation succeeds.
- **AC6:** If inventory validation fails, the order must not be confirmed and inventory must not become negative.
- **AC7:** When two customers attempt to confirm the last available unit concurrently, only one confirmation may consume that unit.
- **AC8:** The confirmed Order stores historical snapshots of Product Name, SKU, Unit Price and related purchase values.
- **AC9:** A repeated/duplicate confirmation request must not create duplicate Orders for the same intended checkout operation.

## US-ORD-02 — Calculate Order Total

**As a** customer  
**I want the order total to be calculated correctly  
**So that** I am charged the correct amount.

### Acceptance Criteria

- **AC1:** Subtotal is calculated from the confirmed line-item prices and quantities.
- **AC2:** Product-level percentage discounts are applied before VAT.
- **AC3:** Discount percentage remains the configured percentage regardless of quantity; the discount amount scales with quantity.
- **AC4:** VAT is calculated at 16% on the net amount after discount.
- **AC5:** Total is calculated as Net Amount plus VAT.
- **AC6:** Final monetary values are rounded to two decimal places.

## US-ORD-03 — View Own Orders

**As a** customer  
**I want to** view my orders and their history  
**So that** I can track purchases I have made.

### Acceptance Criteria

- **AC1:** A customer can access only their own Orders.
- **AC2:** A customer must not access another customer's Order by changing an Order identifier.
- **AC3:** Order detail preserves historical purchase values even when current Product data changes later.
- **AC4:** A customer can view permitted status history for their own Order.

## US-ORD-04 — Administer Orders

**As an** administrator  
**I want to** search, review and update Orders  
**So that** customer orders can be operationally managed.

### Acceptance Criteria

- **AC1:** An administrator can view Orders across customers.
- **AC2:** Administrators can search/filter Order records by supported fields such as date, customer, Order Number, Product/SKU and status.
- **AC3:** Order Number is system-generated, unique and immutable.
- **AC4:** Authorized Order status changes create a new status-history record.
- **AC5:** Each history record includes previous status, new status, actor, timestamp and optional note.
- **AC6:** Existing history entries are not replaced when a later status change occurs.

## US-ORD-05 — Delivery Address Snapshot

**As a** customer  
**I want to** provide a delivery address during checkout  
**So that** my Order can be delivered to the intended destination.

### Acceptance Criteria

- **AC1:** Checkout requires an eligible delivery address.
- **AC2:** A customer may use a saved address or provide a new eligible address for the Order.
- **AC3:** The Order stores an address snapshot at checkout.
- **AC4:** Later changes to the customer's saved address do not modify historical Orders.

---

# 5. Cancellation, Returns & Refunds

## US-CAN-01 — Request Order Cancellation

**As a** customer  
**I want to** request cancellation of an eligible Order  
**So that** I can stop fulfillment when cancellation is still allowed.

### Acceptance Criteria

- **AC1:** A customer can submit a cancellation request only for their own eligible Order.
- **AC2:** The request includes a cancellation reason and may include an optional note.
- **AC3:** Submitting a cancellation request does not delete the Order.
- **AC4:** The Order/cancellation workflow records the request status and relevant audit history.
- **AC5:** An administrator can approve or reject the cancellation request.
- **AC6:** If cancellation is approved after inventory had already been deducted, inventory is restored according to the Order's fulfillment stage.
- **AC7:** If payment had been completed, an approved cancellation can initiate the refund workflow.

## US-RET-01 — Request Product Return

**As a** customer  
**I want to** request return of one or more eligible delivered items  
**So that** I can return products without altering unrelated items in the same Order.

### Acceptance Criteria

- **AC1:** A customer can create a Return Request only for items belonging to their own eligible Order.
- **AC2:** Partial returns are supported; one item may be returned while other Order items remain unchanged.
- **AC3:** A Return Request records the returned item(s), quantity, reason, timestamp and optional customer note.
- **AC4:** Creating a Return Request does not immediately restore sellable stock.
- **AC5:** An administrator can approve or reject the Return Request.

## US-RET-02 — Receive and Inspect Returned Item

**As an** administrator  
**I want to** record receipt and inspection of returned items  
**So that** inventory and refund decisions reflect the actual returned condition.

### Acceptance Criteria

- **AC1:** Approved returned items can progress to a received/inspection stage.
- **AC2:** Sellable stock is restored only after the returned item has been physically received and approved as sellable.
- **AC3:** Items rejected as non-sellable are not added back to available sellable stock.
- **AC4:** Return status transitions are recorded in history/audit data.

## US-REF-01 — Process Refund

**As an** administrator  
**I want to** process an approved refund  
**So that** the customer receives the correct financial adjustment while the original sale remains historically traceable.

### Acceptance Criteria

- **AC1:** Refund processing requires an approved cancellation/return condition.
- **AC2:** Refund amount is based on the historical amount paid for the affected item(s), not the current Product price.
- **AC3:** Item refund calculation includes the applicable historical discount and VAT values.
- **AC4:** Refund state is tracked separately from the original Order and Invoice history.
- **AC5:** Refund processing must not modify the historical price values stored on the original Invoice.

---

# 6. Payments

## US-PAY-01 — Track Payment Status

**As an** administrator  
**I want to** track the payment state of an Order  
**So that** Order, cancellation and refund workflows can use a consistent financial status.

### Acceptance Criteria

- **AC1:** Supported payment states include `PENDING`, `PAID`, `FAILED`, `REFUND_PENDING` and `REFUNDED`.
- **AC2:** Payment state is associated with the relevant Order/payment record.
- **AC3:** A refund workflow cannot mark a payment `REFUNDED` before the refund operation is completed successfully.
- **AC4:** Version 1 uses a simulated payment workflow rather than a live external payment gateway.

---

# 7. Invoices & Credit Notes

## US-INVOICE-01 — Generate Invoice

**As a** customer  
**I want an invoice generated for a successfully confirmed Order  
**So that** I have a financial record of my purchase.

### Acceptance Criteria

- **AC1:** A successfully confirmed Order generates an Invoice.
- **AC2:** Invoice Number is unique, system-generated and immutable.
- **AC3:** The Invoice references the related Order and Customer.
- **AC4:** The Invoice contains line items, quantities, unit prices, Subtotal, Discount, VAT, Total and Creation Date.
- **AC5:** Invoice financial values are taken from the confirmed Order snapshot.
- **AC6:** Later Product price/name changes must not modify an issued Invoice.
- **AC7:** Final Invoice monetary values use two-decimal rounding.

## US-INVOICE-02 — Preserve Issued Invoice

**As an** administrator  
**I want issued Invoices to remain historically stable  
**So that** later operational changes do not rewrite the original sale record.

### Acceptance Criteria

- **AC1:** An issued Invoice is not manually rewritten to represent a later cancellation or return.
- **AC2:** Historical Invoice values remain unchanged after Order return/refund activity.
- **AC3:** Financial adjustments are represented through a separate Credit Note/Return Invoice record.

## US-INVOICE-03 — Create Credit Note for Return

**As an** administrator  
**I want a Credit Note created for an approved returned/refunded item  
**So that** financial adjustments remain traceable to the original Invoice.

### Acceptance Criteria

- **AC1:** A Credit Note references the original Invoice and relevant returned item(s).
- **AC2:** Partial returns create an adjustment only for the affected item(s), not unrelated Order items.
- **AC3:** Credit Note amounts use historical purchase values, discount and VAT applicable to the returned item(s).
- **AC4:** The Credit Note has its own creation date and identifier.

---

# 8. Bulk Product Import

## US-BULK-01 — Import Products in Bulk

**As an** administrator  
**I want to** import Product records using CSV, Excel or JSON  
**So that** large catalog updates can be prepared efficiently.

### Acceptance Criteria

- **AC1:** Only an administrator can perform a bulk Product import.
- **AC2:** Supported file formats are CSV, Excel and JSON.
- **AC3:** Each Product record is validated using the same core Product validation rules applied to normal Product creation.
- **AC4:** Valid records are imported even when other records in the same file are invalid.
- **AC5:** Invalid Product records are not persisted to the database.
- **AC6:** Duplicate SKU validation is case-insensitive.
- **AC7:** When the same SKU appears more than once in the same import, duplicate occurrences are rejected according to the import rule.
- **AC8:** In Version 1, a SKU that already exists in the database is rejected by bulk create; bulk import does not silently update the existing Product.
- **AC9:** A file missing mandatory structural fields/columns is rejected before row-level import processing.
- **AC10:** Maximum supported file size is 5 MB and maximum supported record count is 10,000 records.

## US-BULK-02 — Review Import Result

**As an** administrator  
**I want to** receive an import summary and row-level failures  
**So that** I can reconcile imported data and correct invalid records.

### Acceptance Criteria

- **AC1:** The response/report shows total records, successfully imported records and failed records.
- **AC2:** Failed records include sufficient information to identify the row/record and validation reason.
- **AC3:** Every record reported as imported must exist in the database after successful completion.
- **AC4:** Records reported as failed must not be persisted as successfully imported Products.

---

# 9. Cross-Cutting Authorization & Audit Criteria

These criteria apply across relevant modules.

- **AC-AUTHZ-01:** Protected APIs require valid authentication unless explicitly documented as public.
- **AC-AUTHZ-02:** Customer resources are isolated by ownership; a customer cannot access another customer's protected Cart, Order, Invoice, Return or related private resources.
- **AC-AUTHZ-03:** Administrator-only actions cannot be successfully performed using a Customer account.
- **AC-AUTHZ-04:** Authorization decisions are enforced by the backend and do not rely on client/UI restrictions alone.
- **AC-AUDIT-01:** Business-critical workflow status changes create traceable history records.
- **AC-AUDIT-02:** Historical transaction snapshots remain stable when current master data changes later.

---

# 10. Open Business Items Before Final Acceptance Baseline

The following items should be confirmed before the API contract is frozen:

1. Whether unauthorized access to another customer's existing resource returns `403 Forbidden` or hides resource existence using `404 Not Found`.
2. Exact administrator 2FA delivery mechanism and recovery process.
3. Guest cart persistence strategy across browser/session restarts.
4. Final cancellation eligibility by each Order fulfillment status.
5. Final return eligibility window after delivery.
6. Final return/cancellation fee policy and which reasons make fees refundable/non-refundable.
7. Exact idempotency contract exposed by the API for duplicate checkout/confirmation protection.
8. Final internal rounding strategy if line-level and order-level VAT calculations produce a fractional-cent difference.

These are business/API-contract clarifications, not test cases.
