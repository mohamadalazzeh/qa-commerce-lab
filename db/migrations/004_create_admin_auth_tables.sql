BEGIN;

CREATE TABLE admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL,
    token_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_by_user_id UUID NOT NULL,
    cancelled_by_user_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT admin_invitations_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT admin_invitations_created_by_fk
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT admin_invitations_cancelled_by_fk
        FOREIGN KEY (cancelled_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT admin_invitations_token_hash_unique
        UNIQUE (token_hash),

    CONSTRAINT admin_invitations_status_check
        CHECK (status IN ('PENDING', 'EXPIRED', 'USED', 'CANCELLED'))
);

CREATE UNIQUE INDEX admin_invitations_pending_email_ci_unique
    ON admin_invitations (LOWER(email))
    WHERE status = 'PENDING';

CREATE INDEX admin_invitations_user_id_idx
    ON admin_invitations (user_id);

CREATE INDEX admin_invitations_created_by_user_id_idx
    ON admin_invitations (created_by_user_id);

CREATE INDEX admin_invitations_cancelled_by_user_id_idx
    ON admin_invitations (cancelled_by_user_id);

CREATE INDEX admin_invitations_status_idx
    ON admin_invitations (status);

CREATE INDEX admin_invitations_expires_at_idx
    ON admin_invitations (expires_at);

CREATE TABLE admin_login_otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    revocation_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT admin_login_otp_challenges_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT admin_login_otp_challenges_attempt_count_check
        CHECK (attempt_count >= 0)
);

CREATE INDEX admin_login_otp_challenges_user_id_idx
    ON admin_login_otp_challenges (user_id);

CREATE INDEX admin_login_otp_challenges_expires_at_idx
    ON admin_login_otp_challenges (expires_at);

CREATE TABLE temporary_password_change_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    purpose VARCHAR(40) NOT NULL DEFAULT 'CHANGE_TEMPORARY_PASSWORD',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT temporary_password_change_tokens_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT temporary_password_change_tokens_token_hash_unique
        UNIQUE (token_hash),

    CONSTRAINT temporary_password_change_tokens_purpose_check
        CHECK (purpose = 'CHANGE_TEMPORARY_PASSWORD')
);

CREATE INDEX temporary_password_change_tokens_user_id_idx
    ON temporary_password_change_tokens (user_id);

CREATE INDEX temporary_password_change_tokens_expires_at_idx
    ON temporary_password_change_tokens (expires_at);

COMMIT;
