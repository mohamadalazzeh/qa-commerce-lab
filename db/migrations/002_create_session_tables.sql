BEGIN;

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    revocation_reason TEXT NULL,

    CONSTRAINT auth_sessions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE INDEX auth_sessions_user_id_idx
    ON auth_sessions (user_id);

CREATE INDEX auth_sessions_revoked_at_idx
    ON auth_sessions (revoked_at);

CREATE INDEX auth_sessions_expires_at_idx
    ON auth_sessions (expires_at);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    replaced_by_token_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT refresh_tokens_session_fk
        FOREIGN KEY (session_id)
        REFERENCES auth_sessions(id)
        ON DELETE RESTRICT,

    CONSTRAINT refresh_tokens_replaced_by_fk
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES refresh_tokens(id)
        ON DELETE RESTRICT,

    CONSTRAINT refresh_tokens_token_hash_unique
        UNIQUE (token_hash)
);

CREATE INDEX refresh_tokens_session_id_idx
    ON refresh_tokens (session_id);

CREATE INDEX refresh_tokens_replaced_by_token_id_idx
    ON refresh_tokens (replaced_by_token_id);

CREATE INDEX refresh_tokens_expires_at_idx
    ON refresh_tokens (expires_at);

COMMIT;
