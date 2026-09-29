CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "post_categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(220) NOT NULL,
    "excerpt" VARCHAR(500) NOT NULL,
    "category_id" UUID NOT NULL,
    "cover_media_id" UUID,
    "markdown_body" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "seo_title" VARCHAR(220),
    "seo_description" VARCHAR(320),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_categories_slug_key" ON "post_categories"("slug");
CREATE INDEX "post_categories_visible_sort_order_idx" ON "post_categories"("visible", "sort_order");
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE INDEX "posts_status_published_at_idx" ON "posts"("status", "published_at");
CREATE INDEX "posts_category_id_idx" ON "posts"("category_id");

ALTER TABLE "posts"
ADD CONSTRAINT "posts_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "post_categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_cover_media_id_fkey"
FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
