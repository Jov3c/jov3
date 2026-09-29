CREATE TYPE "FriendLinkStatus" AS ENUM ('PENDING_EMAIL', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');

CREATE TYPE "FriendLinkSource" AS ENUM ('ADMIN', 'APPLICATION');

CREATE TABLE "friend_links" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "logo_media_id" UUID,
    "contact_email" VARCHAR(254),
    "applicant_note" VARCHAR(500),
    "source" "FriendLinkSource" NOT NULL,
    "status" "FriendLinkStatus" NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "friend_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "friend_links_status_visible_sort_order_idx" ON "friend_links"("status", "visible", "sort_order");

ALTER TABLE "friend_links"
ADD CONSTRAINT "friend_links_logo_media_id_fkey"
FOREIGN KEY ("logo_media_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
