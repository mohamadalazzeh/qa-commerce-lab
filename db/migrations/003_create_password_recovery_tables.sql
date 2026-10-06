BEGIN;

CREATE TABLE password_reset_challenges (
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

    CONSTRAINT password_reset_challenges_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT password_reset_challenges_attempt_count_check
        CHECK (attempt_count >= 0)
);

CREATE INDEX password_reset_challenges_user_id_idx
    ON password_reset_challenges (user_id);

CREATE INDEX password_reset_challenges_expires_at_idx
    ON password_reset_challenges (expires_at);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT password_reset_tokens_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT password_reset_tokens_challenge_fk
        FOREIGN KEY (challenge_id)
        REFERENCES password_reset_challenges(id)
        ON DELETE RESTRICT,

    CONSTRAINT password_reset_tokens_token_hash_unique
        UNIQUE (token_hash)
);

CREATE INDEX password_reset_tokens_user_id_idx
    ON password_reset_tokens (user_id);

CREATE INDEX password_reset_tokens_challenge_id_idx
    ON password_reset_tokens (challenge_id);

CREATE INDEX password_reset_tokens_expires_at_idx
    ON password_reset_tokens (expires_at);

COMMIT;
