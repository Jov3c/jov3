CREATE TYPE "ModerationStatus" AS ENUM ('PENDING_EMAIL', 'PUBLISHED', 'HIDDEN', 'SPAM', 'DELETED');

CREATE TYPE "AuthorType" AS ENUM ('VISITOR', 'ADMIN');

CREATE TABLE "article_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "parent_id" UUID,
    "author_type" "AuthorType" NOT NULL DEFAULT 'VISITOR',
    "nickname" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254),
    "content" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "ip_hash" CHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "author_type" "AuthorType" NOT NULL DEFAULT 'VISITOR',
    "nickname" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254),
    "content" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "ip_hash" CHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_comments_post_id_status_created_at_idx" ON "article_comments"("post_id", "status", "created_at");
CREATE INDEX "article_comments_parent_id_idx" ON "article_comments"("parent_id");
CREATE INDEX "messages_status_created_at_idx" ON "messages"("status", "created_at");
CREATE INDEX "messages_parent_id_idx" ON "messages"("parent_id");

ALTER TABLE "article_comments"
ADD CONSTRAINT "article_comments_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_comments"
ADD CONSTRAINT "article_comments_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "article_comments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "messages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
