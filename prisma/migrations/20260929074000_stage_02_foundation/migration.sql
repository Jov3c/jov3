CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_users_email_lowercase" CHECK ("email" = lower("email"))
);

CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_profile" (
    "id" UUID NOT NULL,
    "site_title" VARCHAR(120) NOT NULL,
    "site_description" VARCHAR(300) NOT NULL,
    "founded_at" DATE NOT NULL,
    "public_contact_email" VARCHAR(254),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "site_profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "storage_path" VARCHAR(500) NOT NULL,
    "public_url" VARCHAR(500) NOT NULL,
    "sha256" CHAR(64),
    "alt_text" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_assets_size_nonnegative" CHECK ("size_bytes" >= 0),
    CONSTRAINT "media_assets_width_positive" CHECK ("width" IS NULL OR "width" > 0),
    CONSTRAINT "media_assets_height_positive" CHECK ("height" IS NULL OR "height" > 0)
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");
CREATE UNIQUE INDEX "media_assets_stored_name_key" ON "media_assets"("stored_name");
CREATE UNIQUE INDEX "media_assets_storage_path_key" ON "media_assets"("storage_path");
CREATE UNIQUE INDEX "media_assets_public_url_key" ON "media_assets"("public_url");

ALTER TABLE "admin_sessions"
ADD CONSTRAINT "admin_sessions_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
