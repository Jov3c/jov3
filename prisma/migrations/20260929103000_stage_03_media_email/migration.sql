CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "entity_id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_verifications_email_lowercase" CHECK ("email" = lower("email"))
);

CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");
CREATE INDEX "email_verifications_purpose_entity_id_idx" ON "email_verifications"("purpose", "entity_id");
