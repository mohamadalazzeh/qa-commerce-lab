BEGIN;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_logs_actor_user_fk
        FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE INDEX audit_logs_actor_user_id_idx
    ON audit_logs (actor_user_id);

CREATE INDEX audit_logs_created_at_idx
    ON audit_logs (created_at);

CREATE INDEX audit_logs_resource_idx
    ON audit_logs (resource_type, resource_id);

COMMIT;
