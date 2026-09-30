# QA Commerce Lab — Current Checkpoint

## How to Resume in a New Chat

Use this file together with `docs/project-management/project-continuity.md` as the source of truth for project continuity.

Suggested message to start a new chat:

> Continue my QA Commerce Lab project from GitHub repository `mohamadalazzeh/qa-commerce-lab`. Read `docs/project-management/project-continuity.md` and `docs/project-management/current-checkpoint.md` first. Continue from the current Authentication/Login review. Keep the work interactive and company-like. Focus now on Requirements, Business Rules, API behavior, Decision Tables, Test Scenarios, UAT, Security thinking and DB implications. Do not create detailed Test Cases yet; detailed Test Cases are reserved for the later Postman execution phase after the backend is built.

---

## Current Module

**Authentication — Login review**

Completed / substantially agreed before Login:

- Customer registration
- Customer email verification
- Resend verification
- Verification token lifecycle
- First Admin bootstrap
- Additional Admin invitation
- Admin invitation token lifecycle
- Admin email OTP / second authentication step

---

## Current Learning / Working Style

The current phase is intentionally interactive.

Focus sequence:

```text
Requirement
→ Business Rule
→ Ambiguity / Clarification
→ API Behavior
→ Decision Table where useful
→ Test Scenario
→ UAT
→ Security Thinking
→ Backend / DB implication
```

Detailed Test Cases are intentionally postponed until the backend is built and practical execution begins with Postman and PostgreSQL.

Later execution phase:

```text
Test Cases
→ Postman
→ SQL / DB Validation
→ Defects
→ Retest
→ Regression
```

---

## Approved Login Account-State Behavior

Current Login decision logic:

| Credentials | Account State | Expected Behavior |
|---|---|---|
| Valid | `ACTIVE` | Login may continue |
| Invalid email or password | Any | Generic authentication failure; do not reveal which credential is incorrect |
| Valid | `PENDING_VERIFICATION` | Reject normal login and return `EMAIL_VERIFICATION_REQUIRED` so the client can direct the user to the verification/resend flow |
| Valid | `DISABLED` | Reject login and return an account-disabled result such as `ACCOUNT_DISABLED` |
| Invalid password | `PENDING_VERIFICATION` or other known account state | Generic authentication failure; do not disclose account state before credentials are proven |

Important principle:

```text
Wrong credentials
→ generic response first

Correct credentials
→ account state may then determine a more specific business response
```

This protects against unnecessary account-state disclosure while still giving legitimate users useful recovery guidance.

---

## Login Account Lockout Rules

Approved requirement behavior:

```text
5 consecutive failed login attempts
→ account locked for 15 minutes
```

Important meaning of **consecutive**:

```text
Wrong ×3
→ successful login
→ failed_login_attempts resets to 0
```

Successful authentication breaks the failure sequence.

Approved lock behavior:

```text
Wrong ×5
→ lock starts
→ correct password after 1 minute: still rejected
→ correct password before full 15 minutes: still rejected
→ after lock expires: a new login attempt is allowed
```

Conceptual DB state may include:

```text
failed_login_attempts
locked_until
```

Backend logic concept:

```text
if NOW < locked_until
→ reject login even if the supplied password is correct
```

After lock expiry, a new failed-attempt sequence begins. After a successful login, the failure counter resets to zero and stale lock state is cleared.

---

## Rate Limiting — Current Discussion Point

The discussion has moved from Account Lockout to **Rate Limiting**.

Key distinction already established:

```text
Account Lockout
→ protects a specific account from repeated password guessing
→ based on consecutive failed attempts for that account

Rate Limiting
→ protects the login endpoint / system from excessive request volume
→ may apply even when requests target different accounts
```

Important design concern identified:

A simplistic IP-only rate limit can block legitimate users who share the same network or who arrive during legitimate traffic spikes. Therefore the project should think in terms of layered controls such as:

```text
per-IP rate limiting
+
per-account failed-attempt protection
+
temporary account lockout
```

Exact numerical rate-limit thresholds and windows have **not yet been finalized**.

The next interactive exercise should continue from Rate Limiting and then expand the Login Decision Table to include account state, lock state, role and Admin OTP state.

---

## Decision Table Learning Point

The Login flow is a strong candidate for Decision Table Testing because multiple conditions influence the outcome.

Examples of conditions:

```text
Credentials valid?
Account ACTIVE / PENDING_VERIFICATION / DISABLED?
Account currently locked?
Role CUSTOMER / ADMIN?
Admin OTP completed?
```

A Decision Table is used to organize combinations of conditions and resulting actions. Test Scenarios are then derived from the meaningful rules/rows of that table.

Example:

```text
Valid credentials + PENDING_VERIFICATION
→ EMAIL_VERIFICATION_REQUIRED
```

is a Decision Table rule / condition-action combination.

A corresponding Test Scenario would be:

> Verify that a user with valid credentials and `PENDING_VERIFICATION` status is prevented from normal login and is required to complete email verification.

---

## Immediate Next Step

Continue the interactive Login discussion from **Rate Limiting**.

Do not jump to detailed Test Cases yet.
