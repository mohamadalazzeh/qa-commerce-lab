BEGIN;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_check
        CHECK (role IN ('CUSTOMER', 'ADMIN')),
    CONSTRAINT users_status_check
        CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'DISABLED')),
    CONSTRAINT users_failed_login_attempts_check
        CHECK (failed_login_attempts >= 0)
);

CREATE UNIQUE INDEX users_email_ci_unique
    ON users (LOWER(email));

CREATE INDEX users_role_idx
    ON users (role);

CREATE INDEX users_status_idx
    ON users (status);

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT email_verification_tokens_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT email_verification_tokens_token_hash_unique
        UNIQUE (token_hash)
);

CREATE INDEX email_verification_tokens_user_id_idx
    ON email_verification_tokens (user_id);

CREATE INDEX email_verification_tokens_expires_at_idx
    ON email_verification_tokens (expires_at);

COMMIT;
