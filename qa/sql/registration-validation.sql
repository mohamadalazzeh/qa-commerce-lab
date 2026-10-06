-- QA Commerce Lab - Registration DB Validation
-- Use this after running the Postman Registration suite.
-- Replace PASTE_REGISTRATION_EMAIL_HERE with the value of registration_email from Postman.

-- 1) Verify the registered customer row without exposing the password hash itself.
SELECT
    id,
    first_name,
    last_name,
    email,
    role,
    status,
    must_change_password,
    failed_login_attempts,
    locked_until,
    password_hash LIKE '$argon2id$%' AS password_uses_argon2id,
    created_at,
    updated_at
FROM users
WHERE LOWER(email) = LOWER('PASTE_REGISTRATION_EMAIL_HERE');

-- 2) Verify the verification-token row without exposing the token hash itself.
SELECT
    evt.id,
    evt.user_id,
    evt.used_at,
    evt.revoked_at,
    evt.created_at,
    evt.expires_at,
    LENGTH(evt.token_hash) = 64
        AND evt.token_hash ~ '^[0-9a-f]{64}$' AS token_looks_like_sha256_hex,
    (evt.expires_at - evt.created_at) BETWEEN INTERVAL '23 hours 59 minutes'
        AND INTERVAL '24 hours 1 minute' AS approximately_24_hour_lifetime
FROM email_verification_tokens evt
JOIN users u ON u.id = evt.user_id
WHERE LOWER(u.email) = LOWER('PASTE_REGISTRATION_EMAIL_HERE')
ORDER BY evt.created_at DESC;

-- 3) Inspect recent Registration test accounts created by the Postman suite.
SELECT
    email,
    role,
    status,
    created_at
FROM users
WHERE email LIKE 'qa.register.%@example.com'
ORDER BY created_at DESC
LIMIT 20;

-- 4) Check that the same normalized email was not inserted twice.
SELECT
    LOWER(email) AS normalized_email,
    COUNT(*) AS row_count
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
