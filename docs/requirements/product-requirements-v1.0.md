# Product Requirements — v1.0

## Purpose

This document consolidates the requirement clarifications completed during Sprint 0. It expands the v0.9 baseline into testable business rules for authentication, products, cart, inventory, orders, returns, invoices and bulk import.

The v0.9 document remains unchanged as the original review baseline.

---

## 1. Authentication and Account Management

### Registration

- **REQ-AUTH-001:** The system shall allow a new customer to register using First Name, Last Name, Email and Password.
- **REQ-AUTH-002:** First Name and Last Name shall contain between 1 and 50 characters.
- **REQ-AUTH-003:** First Name and Last Name may contain Arabic or English letters, spaces, hyphens and apostrophes. Numeric-only names and unsupported symbols shall be rejected.
- **REQ-AUTH-004:** Email addresses shall use a valid email format.
- **REQ-AUTH-005:** Customer email addresses shall be unique using case-insensitive comparison. For uniqueness purposes, `User@test.com` and `user@test.com` represent the same email address.
- **REQ-AUTH-006:** Passwords shall contain between 8 and 64 characters and include at least one uppercase letter, one lowercase letter, one number and one special character.
- **REQ-AUTH-007:** A newly registered customer account shall use status `PENDING_VERIFICATION` until email verification succeeds.
- **REQ-AUTH-008:** A customer shall not be automatically authenticated before email verification is completed.
- **REQ-AUTH-009:** After successful email verification, the account status shall become `ACTIVE`.

### Login and Account Protection

- **REQ-AUTH-010:** Registered active users shall be able to log in using Email and Password.
- **REQ-AUTH-011:** Invalid email and invalid password attempts shall return the same generic authentication failure response to reduce account enumeration risk.
- **REQ-AUTH-012:** Failed authentication shall return HTTP `401 Unauthorized`.
- **REQ-AUTH-013:** After five consecutive failed login attempts, the account shall be temporarily locked for 15 minutes.
- **REQ-AUTH-014:** Login requests shall be rate limited. Requests that exceed the configured limit shall return HTTP `429 Too Many Requests`.
- **REQ-AUTH-015:** Accounts with status `DISABLED` shall not be permitted to log in.

### Tokens and Sessions

- **REQ-AUTH-016:** Successful authentication shall issue an Access Token and a Refresh Token.
- **REQ-AUTH-017:** Access Tokens shall expire after 15 minutes.
- **REQ-AUTH-018:** Refresh Tokens shall expire after 7 days.
- **REQ-AUTH-019:** The system shall use Refresh Token Rotation. A refresh operation shall issue a new Refresh Token and invalidate the previously used Refresh Token.
- **REQ-AUTH-020:** A disabled account shall not be allowed to obtain new Access Tokens using an existing Refresh Token.
- **REQ-AUTH-021:** Disabling an account shall invalidate its active authentication sessions and tokens.
- **REQ-AUTH-022:** Logging out shall invalidate the active session and its Refresh Token.
- **REQ-AUTH-023:** A successful password reset shall invalidate all authentication sessions created before the reset.

### Password Recovery and OTP

- **REQ-AUTH-024:** The system shall support password recovery using an OTP sent to the registered email address.
- **REQ-AUTH-025:** The password-reset OTP shall contain six digits and remain valid for five minutes.
- **REQ-AUTH-026:** A maximum of five failed verification attempts shall be allowed for one OTP.
- **REQ-AUTH-027:** After five failed attempts, the current OTP shall become invalid and the customer shall be required to request a new OTP.
- **REQ-AUTH-028:** A successfully used OTP shall become invalid immediately and shall not be reusable.
- **REQ-AUTH-029:** A 60-second cooldown shall apply before another OTP can be requested.

### Two-Factor Authentication

- **REQ-AUTH-030:** Two-Factor Authentication shall be required for Administrator accounts.
- **REQ-AUTH-031:** Two-Factor Authentication shall be optional for Customer accounts.

### Account Status and Historical Data

- **REQ-AUTH-032:** Supported customer account states shall include `PENDING_VERIFICATION`, `ACTIVE` and `DISABLED`.
- **REQ-AUTH-033:** Administrators shall be able to disable and re-enable customer accounts.
- **REQ-AUTH-034:** Disabling an account shall not remove its historical Orders or Invoices.
- **REQ-AUTH-035:** Customer accounts referenced by historical Orders or Invoices shall not be hard deleted as part of normal account administration.

---

## 2. Products

- **REQ-PROD-001:** Guests and customers shall be able to retrieve products that are available for browsing.
- **REQ-PROD-002:** Each product shall contain Product ID, Name, SKU, Description, Category, Price, Stock Quantity, Status and Maximum Order Quantity.
- **REQ-PROD-003:** Product ID shall be system-generated and unique.
- **REQ-PROD-004:** SKU shall be unique using case-insensitive comparison. `ABC-100` and `abc-100` shall be treated as the same SKU.
- **REQ-PROD-005:** Product names are not required to be unique when the SKU differs.
- **REQ-PROD-006:** Supported product statuses shall include `ACTIVE`, `INACTIVE` and `DISCONTINUED`.
- **REQ-PROD-007:** Product price shall be greater than zero.
- **REQ-PROD-008:** Product currency shall be Jordanian Dinar (`JOD`).
- **REQ-PROD-009:** Product prices shall support two decimal places.
- **REQ-PROD-010:** Stock Quantity shall be an integer greater than or equal to zero.
- **REQ-PROD-011:** Each product may define a Maximum Order Quantity that limits the quantity allowed for that product in one order.
- **REQ-PROD-012:** Only Administrators may create or update product catalog records.
- **REQ-PROD-013:** Products referenced by historical Orders or Invoices shall not be hard deleted as part of normal catalog administration. Their availability shall be controlled through product status.
- **REQ-PROD-014:** Products with zero stock shall remain visible for browsing and shall be presented as out of stock.
- **REQ-PROD-015:** A product with zero stock shall not be addable to the cart.
- **REQ-PROD-016:** Products that are `INACTIVE` or `DISCONTINUED` shall not be purchasable.
- **REQ-PROD-017:** Product listing shall support Search, Filter, Sort and Pagination.

---

## 3. Cart

- **REQ-CART-001:** Guests and authenticated customers shall be able to add available products to a cart.
- **REQ-CART-002:** Authentication shall be required before Checkout and Order creation.
- **REQ-CART-003:** Cart quantity shall not exceed the currently available Stock Quantity.
- **REQ-CART-004:** Cart quantity shall not exceed the product's configured Maximum Order Quantity.
- **REQ-CART-005:** Adding a product to the cart shall not reserve inventory.
- **REQ-CART-006:** If a product price changes before Checkout, the cart shall use the latest product price and shall present the updated price before Order confirmation.
- **REQ-CART-007:** If a product becomes `INACTIVE` or `DISCONTINUED` while it is in the cart, the product shall not be eligible for Checkout.
- **REQ-CART-008:** If the available stock becomes lower than the quantity already stored in the cart, the cart shall adjust the quantity to the available amount and inform the user of the change.
- **REQ-CART-009:** Customers shall be able to add, update and remove items from their own cart.

---

## 4. Inventory

- **REQ-INVTRY-001:** Inventory shall not be reduced when a product is added to a cart.
- **REQ-INVTRY-002:** Inventory shall be validated again when an Order is confirmed.
- **REQ-INVTRY-003:** Inventory shall be reduced only after successful Order confirmation.
- **REQ-INVTRY-004:** If two or more customers attempt to confirm Orders for the same remaining inventory concurrently, the system shall prevent inventory from becoming negative and shall allow only quantities that remain available.
- **REQ-INVTRY-005:** Inventory restored from a returned item shall become available for sale only after the returned item has been received and approved as sellable.

---

## 5. Orders

### Order Creation and Calculation

- **REQ-ORD-001:** An authenticated Customer shall be able to create an Order from their cart.
- **REQ-ORD-002:** Guests shall not be allowed to create or confirm Orders.
- **REQ-ORD-003:** An Order shall contain one or more Order Items.
- **REQ-ORD-004:** Requested quantities shall not exceed available inventory or the product's Maximum Order Quantity.
- **REQ-ORD-005:** Order confirmation shall revalidate current product availability, price and inventory before the Order becomes `CONFIRMED`.
- **REQ-ORD-006:** Product-level percentage discounts shall be applied before VAT.
- **REQ-ORD-007:** A percentage discount shall be applied independently to each purchased unit. Increasing quantity shall increase the discount amount, not the discount percentage.
- **REQ-ORD-008:** VAT shall be calculated at 16% on the Net Amount after discounts.
- **REQ-ORD-009:** Order totals shall follow this calculation sequence: `Subtotal - Discount = Net Amount`, `Net Amount × 16% = VAT`, `Net Amount + VAT = Total`.
- **REQ-ORD-010:** Final monetary values shall be rounded to two decimal places.
- **REQ-ORD-011:** The Order shall preserve a historical snapshot of the purchased Product Name, SKU, Unit Price, Quantity, Discount and tax-related values used at confirmation time.
- **REQ-ORD-012:** Product changes made after Order confirmation shall not change historical Order values.

### Order Identification and Status

- **REQ-ORD-013:** Each Order shall have a unique, system-generated and immutable Order Number.
- **REQ-ORD-014:** Supported core Order statuses shall include `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCEL_REQUESTED` and `CANCELLED`.
- **REQ-ORD-015:** Customer modification of Order Items shall not be allowed after successful Order confirmation.

### Delivery Address

- **REQ-ORD-016:** Checkout shall require a Delivery Address.
- **REQ-ORD-017:** A customer may use a previously saved address or provide a new delivery address during Checkout.
- **REQ-ORD-018:** The Order shall preserve a snapshot of the Delivery Address used at Checkout. Later changes to the customer's saved address shall not modify historical Orders.

### Ownership and Authorization

- **REQ-ORD-019:** A Customer shall only be able to access Orders that belong to that Customer.
- **REQ-ORD-020:** Administrators shall be able to access customer Orders for operational management.
- **REQ-ORD-021:** Customer attempts to access another customer's Order shall not expose protected Order data.
- **REQ-ORD-022:** Administrative Order operations shall require Administrator authorization.

### Duplicate Request Protection

- **REQ-ORD-023:** Repeated submission of the same Checkout or Order-confirmation request shall not create duplicate Orders or duplicate inventory deductions.

---

## 6. Order History and Audit Trail

- **REQ-HIST-001:** Every Order status transition shall create a historical record.
- **REQ-HIST-002:** An Order history record shall contain Order Reference, Previous Status, New Status, Actor, Timestamp and an optional Note.
- **REQ-HIST-003:** Order history records shall not be modified or deleted through normal Order-management operations.
- **REQ-HIST-004:** Customers shall be able to retrieve history for their own Orders.
- **REQ-HIST-005:** Administrators shall be able to retrieve history for any Order.
- **REQ-HIST-006:** Administrators shall be able to search historical Orders using business-relevant criteria including Order Number, Customer, Date, Product/SKU and Order Status.
- **REQ-HIST-007:** Historical Order searches shall support pagination.

---

## 7. Cancellation, Returns and Refunds

### Cancellation

- **REQ-RET-001:** Customers shall submit cancellation requests through the system rather than directly changing an Order to `CANCELLED`.
- **REQ-RET-002:** A cancellation request shall include the target Order and a reason.
- **REQ-RET-003:** Cancellation requests shall require Administrator approval or rejection.
- **REQ-RET-004:** A Customer shall only be able to request cancellation of their own Order.
- **REQ-RET-005:** If a cancellation is approved before shipment, the Order shall become `CANCELLED` and any inventory previously deducted for the Order shall be restored.
- **REQ-RET-006:** If cancellation is requested after shipment, the Order shall enter a return-to-sender flow rather than being treated as an immediate cancellation.
- **REQ-RET-007:** Refund processing for an Order already in delivery shall not complete until the returned shipment has been received back according to the return workflow.

### Returns

- **REQ-RET-008:** After delivery, a Customer shall be able to submit a Return Request for eligible Order Items.
- **REQ-RET-009:** Partial returns shall be supported. A Customer may request return of one or more individual Order Items without returning the full Order.
- **REQ-RET-010:** Return Requests shall require Administrator approval or rejection.
- **REQ-RET-011:** Returned inventory shall not be restored to sellable stock when the Return Request is created or approved.
- **REQ-RET-012:** Returned inventory shall be restored only after the item is physically received and approved as sellable.
- **REQ-RET-013:** Items that fail return inspection shall not be restored to sellable stock.

### Refunds

- **REQ-RET-014:** Refund calculations shall use the historical amount actually paid for the returned item, including the applicable discount and VAT values from the original Order.
- **REQ-RET-015:** The system shall not calculate a refund using the product's current catalog price.
- **REQ-RET-016:** Return or delivery fees may depend on the return reason and delivery stage.
- **REQ-RET-017:** Returns caused by a defective, damaged or incorrect item shall not charge the Customer a return fee.
- **REQ-RET-018:** Returns caused by customer preference may be subject to a return or delivery fee according to the configured business policy.

---

## 8. Payment Status

- **REQ-PAY-001:** Version 1 shall track Payment Status without requiring integration with a live external payment gateway.
- **REQ-PAY-002:** Supported Payment Status values shall include `PENDING`, `PAID`, `FAILED`, `REFUND_PENDING` and `REFUNDED`.
- **REQ-PAY-003:** Refund processing shall update Payment Status consistently with the approved refund workflow.
- **REQ-PAY-004:** Financial state changes shall be restricted to authorized administrative or system operations.

---

## 9. Invoices and Credit Notes

- **REQ-INVOICE-001:** A successfully confirmed Order shall generate an Invoice.
- **REQ-INVOICE-002:** Each Invoice shall have a unique, system-generated and immutable Invoice Number.
- **REQ-INVOICE-003:** An Invoice shall contain Invoice Number, Customer, Order Reference, Line Items, Quantity, Unit Price, Discount, Subtotal, VAT, Total and Creation Date.
- **REQ-INVOICE-004:** Invoice values shall be generated from the confirmed Order snapshot.
- **REQ-INVOICE-005:** Changes to a Product, Customer profile or current catalog price after Invoice creation shall not modify historical Invoice values.
- **REQ-INVOICE-006:** Issued Invoice financial values shall not be directly edited through normal administration.
- **REQ-INVOICE-007:** Invoice calculations shall use the same Subtotal, Discount, Net Amount, VAT and Total rules used by the confirmed Order.
- **REQ-INVOICE-008:** Final Invoice monetary values shall be rounded to two decimal places.
- **REQ-INVOICE-009:** A return or financial reversal shall not rewrite the original Invoice.
- **REQ-INVOICE-010:** Approved returns requiring a financial reversal shall generate a separate Credit Note / Return Invoice linked to the original Invoice.
- **REQ-INVOICE-011:** A Credit Note for a partial return shall contain only the returned items and their corresponding historical financial values.

---

## 10. Bulk Product Import

- **REQ-BULK-001:** Administrators shall be able to import Products using CSV, Excel and JSON files.
- **REQ-BULK-002:** Bulk-import records shall follow the same Product validation and business rules used by the Product API.
- **REQ-BULK-003:** Valid records shall be imported even when other records in the same file are invalid.
- **REQ-BULK-004:** Invalid records shall not be inserted into the database.
- **REQ-BULK-005:** If the same SKU appears more than once in one import file, the first valid occurrence may be imported and later duplicate occurrences shall be rejected.
- **REQ-BULK-006:** If a SKU already exists in the Product database, the import record shall be rejected rather than automatically updating the existing Product.
- **REQ-BULK-007:** Bulk update of existing Products is outside the scope of Version 1.
- **REQ-BULK-008:** A file missing required structural fields or columns shall be rejected before record processing begins.
- **REQ-BULK-009:** The import response shall identify failed records with the source row or record reference and a clear validation error.
- **REQ-BULK-010:** The import response shall provide a summary containing Total Records, Imported Records and Failed Records.
- **REQ-BULK-011:** Maximum import file size shall be 5 MB.
- **REQ-BULK-012:** Maximum records per import shall be 10,000.
- **REQ-BULK-013:** Only Administrators shall be authorized to execute Bulk Import.
- **REQ-BULK-014:** Records reported as successfully imported shall exist in the database after successful completion of the import process.

---

## 11. Data Consistency

- **REQ-DATA-001:** Order confirmation shall keep Order creation, Order Items, inventory deduction, historical status recording and related financial data consistent.
- **REQ-DATA-002:** A failed Order-confirmation operation shall not leave the database in a partially completed business state.
- **REQ-DATA-003:** Historical Order and Invoice values shall remain independent from later Product catalog changes.
- **REQ-DATA-004:** API responses that report successful creation or state transition shall be consistent with the persisted database state.

---

## 12. Open Clarifications Before Final Baseline Approval

The following items were identified during Sprint 0 but require a final Product/API decision before detailed test cases are baselined:

- Exact 2FA mechanism for Administrator accounts.
- Whether normal Logout terminates only the current session or supports a separate "logout all devices" operation.
- Guest cart persistence and how a guest cart is merged or retained after login.
- Exact visibility rules for `INACTIVE` and `DISCONTINUED` products in public product-list responses.
- Exact HTTP response policy for authenticated customers attempting to access another customer's resource (`403` versus resource-hiding `404`).
- Exact return-fee amounts and fee-calculation rules for customer-preference returns.
- Exact API-level idempotency mechanism for duplicate Checkout requests.

---

## Out of Scope for Version 1

- Live payment-gateway integration.
- Full customer or administrator front-end implementation.
- External courier/shipping-provider integration.
- Bulk update of existing Products.
- CI/CD implementation and automated regression execution; these will be introduced as later project phases.

---

## Document Control

| Field | Value |
|---|---|
| Version | 1.0 |
| Previous Baseline | 0.9 |
| Status | Draft for final QA/Product review |
| Owner | Product / Business Analysis |
| QA Review Status | Clarifications consolidated |
| Project Phase | Sprint 0 |
