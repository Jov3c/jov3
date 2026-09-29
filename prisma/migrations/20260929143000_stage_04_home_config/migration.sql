CREATE TYPE "EntryTargetType" AS ENUM ('INTERNAL', 'EXTERNAL');

CREATE TABLE "home_profile" (
    "id" UUID NOT NULL,
    "nickname" VARCHAR(80) NOT NULL,
    "role" VARCHAR(160) NOT NULL,
    "intro" TEXT NOT NULL,
    "avatar_media_id" UUID,
    "status_text" VARCHAR(120),
    "status_visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "home_profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_entries" (
    "id" UUID NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(180) NOT NULL,
    "icon" VARCHAR(80),
    "url" VARCHAR(500) NOT NULL,
    "target_type" "EntryTargetType" NOT NULL DEFAULT 'INTERNAL',
    "open_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "home_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(80),
    "url" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "home_entries_visible_sort_order_idx" ON "home_entries"("visible", "sort_order");
CREATE INDEX "social_links_visible_sort_order_idx" ON "social_links"("visible", "sort_order");

ALTER TABLE "home_profile"
ADD CONSTRAINT "home_profile_avatar_media_id_fkey"
FOREIGN KEY ("avatar_media_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
