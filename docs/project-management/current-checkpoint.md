# QA Commerce Lab — Current Checkpoint

## How to Resume in a New Chat

Use this file together with `docs/project-management/project-continuity.md` as the source of truth for project continuity.

Suggested message to start a new chat:

> Continue my QA Commerce Lab project from GitHub repository `mohamadalazzeh/qa-commerce-lab`. Read `docs/project-management/project-continuity.md` and `docs/project-management/current-checkpoint.md` first. Continue from the current Authentication/Login review. Keep the work interactive and company-like. Focus now on Requirements, Business Rules, API behavior, Test Scenarios, UAT, Security thinking and DB implications. Do not create detailed Test Cases yet; detailed Test Cases are reserved for the later Postman execution phase after the backend is built.

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

Current phase:

```text
Requirement
→ Business Rule
→ Ambiguity / Clarification
→ API Behavior
→ Test Scenario
→ UAT
→ Security Thinking
→ Backend / DB implication
```

Decision Tables may be used when useful, but should not slow project delivery. Detailed Test Cases are intentionally postponed until the backend is built and practical execution begins with Postman and PostgreSQL.

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

---

## Login Account Lockout Rules

Approved behavior:

```text
5 consecutive failed login attempts
→ account temporarily locked for 15 minutes
```

Important meaning of **consecutive**:

```text
Wrong ×3
→ successful login
→ failed_login_attempts resets to 0
```

Approved lock behavior:

```text
Wrong ×5
→ lock starts
→ correct password before 15 minutes: still rejected
→ after lock expires: a new login attempt is allowed
```

Conceptual DB state:

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

`DISABLED` is a separate business/account status and must not be used to represent a temporary security lock.

---

## Approved Login Rate-Limiting Direction

Rate Limiting is separate from Account Lockout.

```text
Account Lockout
→ protects a specific account
→ based on consecutive failed credentials
→ 5 failures / 15-minute temporary lock

Rate Limiting
→ protects the Login endpoint/system from excessive request volume
→ can trigger even when requests target many different accounts
```

The project does **not** use IP-only rate limiting as the sole control because legitimate users may share the same public IP.

Approved layered design direction:

```text
Account/email request signal
+
Source IP request signal
+
Per-account failed-attempt protection
```

Current baseline thresholds for Version 1:

```text
Per account/email login-request limit
→ 10 requests per minute

Per source IP login-request limit
→ 60 requests per minute

Threshold exceeded
→ 429 Too Many Requests
→ include Retry-After where practical
```

Why the IP threshold is higher: multiple legitimate users may share one network/NAT, so IP protection must be less aggressive than account-level protection.

Important behavior examples:

```text
Same account receives many requests rapidly
→ account-level rate limit may trigger

Same IP sends requests against many different accounts rapidly
→ IP-level rate limit may trigger

Wrong password ×5 on one account
→ account lockout may trigger before the account request-rate threshold is reached
```

Rate-limit values should be configurable in backend/environment settings rather than hard-coded.

Possible configuration direction:

```text
LOGIN_ACCOUNT_RATE_LIMIT_MAX=10
LOGIN_ACCOUNT_RATE_LIMIT_WINDOW_SECONDS=60
LOGIN_IP_RATE_LIMIT_MAX=60
LOGIN_IP_RATE_LIMIT_WINDOW_SECONDS=60
LOGIN_LOCKOUT_FAILED_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
```

---

## Decision Table Learning Point

Login is a strong candidate for Decision Table Testing because multiple conditions influence the result, such as credential validity, account state, temporary lock state, role and Admin OTP completion.

Decision Tables are useful for organizing logic, but they are not the current priority; project delivery should continue first.

Example rule:

```text
Valid credentials + PENDING_VERIFICATION
→ EMAIL_VERIFICATION_REQUIRED
```

Corresponding Test Scenario:

> Verify that a user with valid credentials and `PENDING_VERIFICATION` status is prevented from normal login and is required to complete email verification.

---

## Immediate Next Step

Continue Authentication/Login with the **Admin email OTP login flow** and finalize:

- OTP lifetime
- maximum failed OTP attempts
- resend cooldown
- behavior after requesting a new OTP
- expected status codes / error behavior
- when Access Token and Refresh Token are issued
- special handling for the bootstrap Admin that must change the temporary password

Then continue to Refresh Token, Logout and Password Recovery.
